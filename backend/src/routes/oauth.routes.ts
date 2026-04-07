import { Router, Request, Response, NextFunction } from 'express';
import { OAuthService } from '../services/oauth.service';
import { env } from '../config/env';

const oauthService = new OAuthService();
export const oauthRoutes = Router();

const REFRESH_COOKIE_NAME = 'refreshToken';
const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/',
};

// ──────────────────────────────────────────
// GOOGLE
// ──────────────────────────────────────────

// GET /auth/google → redirect to Google consent
oauthRoutes.get('/google', (_req: Request, res: Response) => {
  const url = oauthService.getGoogleAuthUrl();
  res.redirect(url);
});

// GET /auth/google/callback → handle callback
oauthRoutes.get('/google/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.redirect(`${env.FRONTEND_URL}/login?error=missing_code`);
      return;
    }

    const result = await oauthService.handleGoogleCallback(code);

    // Set refresh token as HttpOnly cookie
    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

    // Redirect to frontend with access token and user stringified
    const params = new URLSearchParams({ 
      accessToken: result.accessToken,
      user: JSON.stringify(result.user) 
    });
    if ('message' in result && result.message) {
      params.set('message', result.message);
    }
    res.redirect(`${env.FRONTEND_URL}/auth/callback?${params.toString()}`);
  } catch (err) {
    next(err);
  }
});

// ──────────────────────────────────────────
// FACEBOOK
// ──────────────────────────────────────────

// GET /auth/facebook → redirect to Facebook consent
oauthRoutes.get('/facebook', (_req: Request, res: Response) => {
  const url = oauthService.getFacebookAuthUrl();
  res.redirect(url);
});

// GET /auth/facebook/callback → handle callback
oauthRoutes.get('/facebook/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.query;
    if (!code || typeof code !== 'string') {
      res.redirect(`${env.FRONTEND_URL}/login?error=missing_code`);
      return;
    }

    const result = await oauthService.handleFacebookCallback(code);

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, REFRESH_COOKIE_OPTIONS);

    const params = new URLSearchParams({ 
      accessToken: result.accessToken,
      user: JSON.stringify(result.user)
    });
    if ('message' in result && result.message) {
      params.set('message', result.message);
    }
    res.redirect(`${env.FRONTEND_URL}/auth/callback?${params.toString()}`);
  } catch (err) {
    next(err);
  }
});
