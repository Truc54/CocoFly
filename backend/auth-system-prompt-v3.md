# Prompt: Hệ thống Authentication cho Web Đấu Giá Cocofly

## Tổng quan

Xây dựng hệ thống đăng ký / đăng nhập cho web đấu giá **Cocofly**.
- Architecture: **Layered Architecture** (Middleware → Controller → Service → Repository)
- Backend: Node.js (NestJS hoặc Express)
- Database: PostgreSQL + Prisma ORM
- Cache: Redis (OTP, rate limiting, refresh token)
- Gửi email: Resend

---


## Layered Architecture

```
Request
   ↓
Middleware   ← rate limiting, xác thực JWT
   ↓
Controller   ← nhận input, trả response
   ↓
Service      ← toàn bộ business logic
   ↓
Repository   ← query DB qua Prisma
```

---

## 1. Đăng ký (email/password)

### Input
```
email      : string, required
password   : string, required
fullName   : string, required
```

### Validate (Service layer)
- Email đúng định dạng regex, không có khoảng trắng
- Email chưa tồn tại trong DB (hoặc tồn tại nhưng chưa verified — cho phép đăng ký lại)
- Password tối thiểu 8 ký tự, có ít nhất 1 chữ hoa, 1 chữ thường, 1 số
- fullName không rỗng, không vượt quá 100 ký tự

### Xử lý
1. Nếu email đã tồn tại và `isVerified: false` → xóa user cũ, tạo lại
2. Nếu email đã tồn tại và `isVerified: true` → báo lỗi "Email đã được sử dụng"
3. Hash password bằng **bcrypt** (cost factor: 12)
4. Tạo user trong DB với `isVerified: false`
5. Tạo OTP 6 số
6. Lưu OTP vào Redis (TTL 10 phút), reset bộ đếm attempts
7. Gửi email OTP qua Resend
8. Trả về: `{ message: "Mã OTP đã được gửi đến email của bạn" }`

### Rate Limiting (Middleware)
```
Chặn theo IP: 3 lần đăng ký / giờ
Key: register:ip:{ip}   TTL: 3600s
```

---

## 2. Xác minh OTP

### Input
```
email : string, required
code  : string, required (6 số)
```

### Validate
- Email tồn tại trong DB
- code đúng 6 ký tự số

### Xử lý
1. Kiểm tra `otp:attempts:{email}` — nếu >= 5 → báo lỗi "Vui lòng yêu cầu mã mới"
2. Lấy `otp:{email}` từ Redis
3. Không tồn tại → "Mã OTP đã hết hạn"
4. Sai mã:
   - `INCR otp:attempts:{email}`, set TTL 600s
   - Trả về "Mã không đúng. Còn X lần thử" (X = 4 - attempts)
5. Đúng mã:
   - `DEL otp:{email}`, `DEL otp:attempts:{email}`
   - Update `isVerified: true` trong DB
   - Trả về: `{ message: "Xác minh thành công" }`
   - Frontend tự động chuyển về trang đăng nhập sau **3–5 giây**

### Gửi lại OTP
- Kiểm tra `otp:cooldown:{email}` → nếu tồn tại: trả về TTL còn lại
- Tạo OTP mới → ghi đè key cũ (mã cũ tự vô hiệu)
- Set `otp:cooldown:{email}` TTL 60s

---

## 3. Đăng nhập (email/password)

### Input
```
email    : string, required
password : string, required
```

### Validate
- Email đúng định dạng
- Password không rỗng

### Rate Limiting (Middleware) — kiểm tra TRƯỚC khi vào Service
```
Chặn theo email: 5 lần sai / 15 phút
Key: login:fail:email:{email}   TTL: 900s

Chặn theo IP: 20 lần sai / 1 giờ
Key: login:fail:ip:{ip}         TTL: 3600s

Kiểm tra cả 2, chặn nếu 1 trong 2 vượt ngưỡng
```

### Xử lý (Service)
1. Tìm user theo email → không có: "Email hoặc mật khẩu không đúng" (không tiết lộ email tồn tại hay không)
2. Kiểm tra `isVerified` → false: "Tài khoản chưa xác minh. Kiểm tra email của bạn"
3. Kiểm tra `isBanned` → true: "Tài khoản đã bị khóa: {banReason}"
4. Verify password với bcrypt
5. Sai password:
   - `INCR login:fail:email:{email}`, set TTL 900s
   - `INCR login:fail:ip:{ip}`, set TTL 3600s
   - Trả về "Email hoặc mật khẩu không đúng"
6. Đúng password:
   - `DEL login:fail:email:{email}`
   - Update `lastLoginAt` trong DB
   - Tạo và trả về Access Token + Refresh Token

---

## 4. OAuth2 (Google + Facebook)

### Scope
```
Google:   openid email profile
Facebook: email public_profile
```

### Flow
```
GET /auth/google
→ Redirect sang Google kèm client_id + redirect_uri + scope

GET /auth/google/callback?code=...
→ Server dùng code + client_secret đổi lấy { email, name, avatar, providerId }
→ Xử lý logic tìm/tạo user
→ Phát JWT của hệ thống
```

### Logic tìm/tạo user (Service)
```
TH1 — providerId đã có trong UserOAuth
      → Vào luôn

TH2 — Email đã tồn tại, chưa có UserOAuth tương ứng
      → Tạo bản ghi UserOAuth, gộp vào tài khoản cũ
      → Nếu isVerified: false → update thành true
      → Thông báo: "Tài khoản Google đã được liên kết"

TH3 — Email chưa tồn tại
      → Tạo user mới (passwordHash: null, isVerified: true)
      → Tạo bản ghi UserOAuth
      → Đăng nhập tự động (không cần OTP, không cần password)
```

**Quan trọng:** Sau khi xử lý xong → phát JWT của hệ thống, không dùng token Google/Facebook.

---

## 5. JWT — Access Token + Refresh Token

### Access Token
- Định dạng: JWT, ký bằng **HS256**
- Payload: `{ userId, role, email, iat, exp }`
- Thời hạn: **15 phút**
- Lưu ở client: **memory (biến JS)** — không lưu localStorage
- Gửi kèm request: `Authorization: Bearer <token>`

### Refresh Token
- Định dạng: `crypto.randomBytes(64).toString('hex')`
- Thời hạn: **30 ngày**
- Lưu ở client: **HttpOnly Cookie** (`Secure`, `SameSite=Strict`)
- Lưu ở server: Redis — `refresh:{token}` → `userId`, TTL 2592000s
- **Refresh Token Rotation**: mỗi lần dùng → cấp token mới + xóa token cũ

### Khi F5 trang
```
Access token mất (RAM xóa)
→ Client gọi POST /auth/refresh kèm cookie
→ Server verify refresh token trong Redis
→ Cấp access token mới
→ User không thấy màn hình đăng nhập
```

---

## 6. Đăng xuất

1. Lấy refresh token từ cookie
2. `DEL refresh:{token}` khỏi Redis
3. Clear HttpOnly cookie
4. Access token tự hết hạn sau tối đa 15 phút

---

## 7. Cấu trúc Redis

```
Key                           Value        TTL          Mục đích
──────────────────────────────────────────────────────────────────────
otp:{email}                   "482619"     600s         Mã OTP
otp:attempts:{email}          "3"          600s         Số lần nhập sai OTP
otp:cooldown:{email}          "1"          60s          Chống spam gửi lại OTP
login:fail:email:{email}      "4"          900s         Đăng nhập sai theo email
login:fail:ip:{ip}            "12"         3600s        Đăng nhập sai theo IP
register:ip:{ip}              "2"          3600s        Chống spam đăng ký
refresh:{token}               "{userId}"   2592000s     Refresh token (30 ngày)
```

---

## 8. API Endpoints

## 9. Email gửi cho user

| Thời điểm | Nội dung |
|---|---|
| Đăng ký xong | Mã OTP 6 số, hết hạn 10 phút |
| Gửi lại OTP | Mã OTP mới, mã cũ vô hiệu |
| Đăng nhập IP/thiết bị lạ | Email cảnh báo bảo mật |
| Đổi mật khẩu | Thông báo xác nhận |

---

## 10. Unit Test

Test toàn bộ **Service layer** — không mock HTTP, chỉ mock Repository và Redis.

## 11. Bảo mật — checklist

- [ ] Không lưu password plain text — bcrypt cost 12
- [ ] Không đưa passwordHash vào JWT payload
- [ ] Không lưu access token vào localStorage
- [ ] JWT verify phải chỉ định `algorithms: ['HS256']` — chặn `alg: none` attack
- [ ] Secret key lưu trong `.env`, không commit lên git
- [ ] Dùng 2 secret key riêng: `ACCESS_TOKEN_SECRET` và `REFRESH_TOKEN_SECRET`
- [ ] Cookie: `HttpOnly`, `Secure`, `SameSite=Strict`
- [ ] Rate limit đăng nhập theo email: 5 lần / 15 phút
- [ ] Rate limit đăng nhập theo IP: 20 lần / 1 giờ
- [ ] Rate limit đăng ký theo IP: 3 lần / 1 giờ
- [ ] Rate limit gửi OTP: 1 lần / 60 giây
- [ ] OTP tối đa 5 lần nhập sai → yêu cầu gửi lại
- [ ] Refresh Token Rotation — xóa token cũ mỗi lần refresh
- [ ] Đổi password → xóa toàn bộ refresh token của user đó
- [ ] Thông báo email khi đăng nhập từ IP lạ
