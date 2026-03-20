import { env } from '../config/env';
import { UserRepository } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { AppError } from '../utils/AppError';

const userRepository = new UserRepository();
const tokenService = new TokenService();

interface OAuthUserInfo {
  email: string;
  name: string;
  avatar?: string;
  providerId: string;
}

export class OAuthService {
  // ──────────────────────────────────────────
  // GOOGLE
  // ──────────────────────────────────────────
  getGoogleAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      redirect_uri: env.GOOGLE_CALLBACK_URL,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent',
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string) {
    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: env.GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: env.GOOGLE_CALLBACK_URL,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      throw new AppError('Không thể xác thực với Google', 401);
    }

    const tokenData = await tokenRes.json() as { access_token: string };

    // Get user info
    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      throw new AppError('Không thể lấy thông tin từ Google', 401);
    }

    const googleUser = await userRes.json() as { id: string; email: string; name: string; picture?: string };

    return this.findOrCreateUser({
      email: googleUser.email,
      name: googleUser.name,
      avatar: googleUser.picture,
      providerId: googleUser.id,
    }, 'google');
  }

  // ──────────────────────────────────────────
  // FACEBOOK
  // ──────────────────────────────────────────
  getFacebookAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID,
      redirect_uri: env.FACEBOOK_CALLBACK_URL,
      scope: 'email public_profile',
      response_type: 'code',
    });
    return `https://www.facebook.com/v19.0/dialog/oauth?${params.toString()}`;
  }

  async handleFacebookCallback(code: string) {
    // Exchange code for access token
    const tokenParams = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      redirect_uri: env.FACEBOOK_CALLBACK_URL,
      code,
    });

    const tokenRes = await fetch(`https://graph.facebook.com/v19.0/oauth/access_token?${tokenParams.toString()}`);

    if (!tokenRes.ok) {
      throw new AppError('Không thể xác thực với Facebook', 401);
    }

    const tokenData = await tokenRes.json() as { access_token: string };

    // Get user info
    const userRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture.type(large)&access_token=${tokenData.access_token}`,
    );

    if (!userRes.ok) {
      throw new AppError('Không thể lấy thông tin từ Facebook', 401);
    }

    const fbUser = await userRes.json() as { id: string; email: string; name: string; picture?: { data?: { url?: string } } };

    if (!fbUser.email) {
      throw new AppError('Tài khoản Facebook không có email. Vui lòng thêm email vào Facebook', 400);
    }

    return this.findOrCreateUser({
      email: fbUser.email,
      name: fbUser.name,
      avatar: fbUser.picture?.data?.url,
      providerId: fbUser.id,
    }, 'facebook');
  }

  // ──────────────────────────────────────────
  // TH1 / TH2 / TH3 — Find or create user
  // ──────────────────────────────────────────
  private async findOrCreateUser(info: OAuthUserInfo, provider: string) {
    // TH1: providerId already linked
    const existingOAuth = await userRepository.findOAuthByProviderAndId(provider, info.providerId);
    if (existingOAuth) {
      const user = existingOAuth.user;
      await userRepository.updateLastLogin(user.id);
      return this.issueTokens(user);
    }

    // Check if email already exists
    const existingUser = await userRepository.findByEmail(info.email);

    if (existingUser) {
      // TH2: Email exists but no OAuth for this provider
      await userRepository.createOAuth({
        userId: existingUser.id,
        provider,
        providerId: info.providerId,
        rawData: { name: info.name, avatar: info.avatar },
      });

      // Auto-verify if not yet verified
      if (!existingUser.isVerified) {
        await userRepository.updateIsVerified(existingUser.id, true);
      }

      await userRepository.updateLastLogin(existingUser.id);

      return {
        ...this.issueTokens(existingUser),
        message: `Tài khoản ${provider === 'google' ? 'Google' : 'Facebook'} đã được liên kết`,
      };
    }

    // TH3: Completely new user
    const newUser = await userRepository.create({
      email: info.email,
      passwordHash: null,
      fullName: info.name,
      isVerified: true,
    });

    await userRepository.createOAuth({
      userId: newUser.id,
      provider,
      providerId: info.providerId,
      rawData: { name: info.name, avatar: info.avatar },
    });

    await userRepository.updateLastLogin(newUser.id);

    return this.issueTokens(newUser);
  }

  private issueTokens(user: { id: string; role: string; email: string; fullName: string | null; avatarUrl: string | null }) {
    const accessToken = tokenService.generateAccessToken({
      userId: user.id,
      role: user.role,
      email: user.email,
    });

    const refreshToken = tokenService.generateRefreshToken();
    tokenService.saveRefreshToken(refreshToken, user.id);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        avatarUrl: user.avatarUrl,
      },
    };
  }
}
