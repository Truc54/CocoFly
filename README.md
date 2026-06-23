# CocoFly - Real-time Auction & E-commerce Platform

**CocoFly** là một nền tảng đấu giá trực tuyến theo thời gian thực dành cho các sản phẩm đã qua sử dụng, đồ sưu tầm và các mặt hàng giá trị tại Việt Nam. Dự án được thiết kế và xây dựng theo mô hình kiến trúc phân lớp chuyên nghiệp, đáp ứng các tiêu chuẩn bảo mật và hiệu năng cao để sẵn sàng deploy lên môi trường Production.

---

## Live Demo & Test Credentials

Để thuận tiện cho việc đánh giá và thử nghiệm toàn bộ luồng nghiệp vụ của hệ thống (Đăng sản phẩm, Đấu giá thời gian thực, Thanh toán Sandbox, Quản trị Admin, Chat/DM trực tiếp), vui lòng sử dụng các tài khoản demo được cung cấp sẵn dưới đây:

### Tài khoản Demo Hệ thống

| Vai trò | Email đăng nhập | Mật khẩu mặc định | Ghi chú quyền hạn |
|:---|:---|:---|:---|
| **Seller (Người bán)** | `seller@cocofly.vn` | `Seller@12345` | Đăng tin đấu giá mới, quản lý sản phẩm, chat với người mua, gửi hàng. |
| **Buyer (Người mua)** | `buyer@cocofly.vn` | `Buyer@12345` | Tham gia đấu giá trực tiếp, đặt giá tự động (Proxy Bid), thanh toán hóa đơn. |

### Thông tin Thanh toán Thử nghiệm (Sandbox)

Hệ thống tích hợp cổng thanh toán **VNPay** và **MoMo (Sandbox)**. Bạn có thể sử dụng thông tin thẻ sau để thanh toán thử nghiệm:

#### Cổng thanh toán VNPay Sandbox
* **Ngân hàng:** `NCB`
* **Số thẻ:** `9704198526191432198`
* **Tên chủ thẻ:** `NGUYEN VAN A`
* **Ngày phát hành:** `07/15`
* **Mã OTP:** `123456`

#### Cổng thanh toán MoMo Sandbox
  * **Số thẻ:** `9704000000000018`
  * **Tên chủ thẻ:** `NGUYEN VAN A`
  * **Ngày phát hành:** `03/07`
  * **Mã OTP:** Nhập chữ `OTP`

---

## Các Tính năng Nổi bật

### 1. Đấu giá Thời gian thực 
* **Socket.IO + Redis:** Mọi thao tác đặt giá (Place Bid) được đồng bộ hóa tức thời đến tất cả người dùng đang xem sản phẩm mà không cần tải lại trang.
* **Tự động gia hạn phút chót:** Tự động kéo dài thời gian kết thúc đấu giá thêm 5 phút nếu có lượt đặt giá hợp lệ ở phút cuối cùng để đảm bảo tính công bằng.
* **Đặt giá tự động:** Người mua thiết lập mức giá tối đa, hệ thống tự động trả giá tối thiểu cần thiết để giữ vị trí dẫn đầu.
* **Chống đặt giá trùng lặp:** Ngăn chặn việc gửi liên tiếp các yêu cầu đặt giá trùng nhau thông qua Redis Lock.

### 2. Nhắn tin & Trao đổi Trực tiếp
* **Phòng chat sản phẩm:** Nơi những người tham gia cùng bàn luận công khai về sản phẩm đang đấu giá.
* **Nhắn tin trực tiếp:** Kênh liên lạc riêng tư giữa Người mua và Người bán hỗ trợ gửi ảnh, thu hồi tin nhắn và thả icon cảm xúc.

### 3. Hệ thống Cảnh báo & Thông báo
* Tự động gửi thông báo trực quan khi: bị vượt giá, đấu giá thành công, nhận tin nhắn mới hoặc yêu cầu thanh toán.

### 4. Quản trị & Vận hành
* Giao diện Admin chuyên nghiệp cho phép duyệt tin đấu giá, thiết lập thông số hệ thống (phí nền tảng, số gậy vi phạm thanh toán tối đa, thời hạn thanh toán...).

---

## Công nghệ Sử dụng 
### Frontend (Client-side)
* **Framework:** Next.js 15 (App Router), React 19, TypeScript
* **Styling:** Tailwind CSS v4, shadcn/ui
* **Realtime:** Socket.IO Client
* **Cloud Notification:** Firebase Client

### Backend (Server-side)
* **Runtime:** Node.js, Express, TypeScript
* **Database ORM:** Prisma (PostgresQL)
* **Caching & Queue:** Redis (bullmq)
* **Realtime:** Socket.IO Server
* **Security:** Helmet, Express Rate Limit, Cookie Parser, CORS, JSON Body Size Protection.
* **Media Upload:** Cloudinary API

---

## Kiến trúc & Thư mục Dự án

Cấu hình thư mục được tổ chức theo cấu trúc Layered Architecture chặt chẽ và chuyên nghiệp:

```
CocoFly/
├── backend/                  # Source code Node.js API server
│   ├── prisma/               # Database Schema & Seed scripts
│   └── src/
│       ├── config/           # Cấu hình hệ thống & Env Validation (Zod)
│       ├── controllers/      # Tầng tiếp nhận request & trả response
│       ├── services/         # Tầng xử lý logic nghiệp vụ chính (Business Logic)
│       ├── repositories/     # Tầng tương tác trực tiếp với cơ sở dữ liệu
│       ├── gateways/         # Tích hợp thanh toán thứ 3 (MoMo, VNPay)
│       ├── middlewares/      # Lớp bảo vệ (Auth guards, Rate limiters)
│       ├── workers/          # Background jobs xử lý kết thúc đấu giá (BullMQ)
│       └── config/socket.ts  # Cấu hình Socket.IO & Rate Limit Socket
├── frontend/                 # Source code Next.js Web App
│   └── src/
│       ├── app/              # Next.js App Router (Pages & Layouts)
│       ├── components/       # Tổ chức components theo domain (auth, auction, chat...)
│       ├── context/          # State quản lý Auth, Socket connection
│       └── lib/              # Utils, Types, API Client
```

---

## Hướng dẫn Cài đặt & Chạy Cục bộ (Local Setup)

### Yêu cầu hệ thống
* **Node.js** >= 18
* **PostgreSQL** >= 14
* **Redis Server** >= 6

### Bước 1: Khởi động cơ sở dữ liệu & Redis bằng Docker (Khuyên dùng)
Tại thư mục root của dự án, chạy lệnh:
```bash
docker-compose up -d
```
*Lệnh này sẽ khởi động PostgreSQL và Redis Server cục bộ.*

### Bước 2: Thiết lập Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env` từ file mẫu:
   ```bash
   cp .env.example .env
   ```
   *Mở file `.env` vừa tạo và điền đầy đủ các thông tin kết nối Database, Redis, SMTP Email, Cloudinary, VNPay và MoMo.*
4. Đồng bộ Database Schema (Prisma Migration):
   ```bash
   npx prisma migrate dev
   ```
5. Chạy dữ liệu mẫu (Database Seed):
   ```bash
   npx prisma db seed
   ```
6. Khởi động backend ở chế độ phát triển:
   ```bash
   npm run dev
   ```

### Bước 3: Thiết lập Frontend
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Tạo file cấu hình môi trường `.env.local` từ file mẫu:
   ```bash
   cp .env.example .env.local
   ```
   *Cập nhật các biến Firebase và URL API backend của bạn.*
4. Khởi động frontend:
   ```bash
   npm run dev
   ```
5. Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)

---

## Các Biện pháp Bảo mật đã Triển khai 

Để đảm bảo hệ thống an toàn trước khi deploy thực tế, các lớp phòng thủ bảo mật sau đã được tích hợp toàn diện:

1. **Global Rate Limiting (Redis-based):** Ngăn chặn tấn công DDoS cơ bản bằng cách giới hạn tối đa `1000 request / 15 phút` trên mỗi IP.
2. **Auth & OTP Route Protections:**
   * Các hành động đăng ký, đăng nhập được giới hạn ở mức `20 request / 15 phút`.
   * Gửi và xác thực OTP bị giới hạn nghiêm ngặt ở mức `3 request / 3 phút` trên mỗi IP để ngăn chặn việc spam Gmail/SMS API.
3. **Cloudinary Upload Protection:**
   * Route lấy chữ ký tải ảnh (`/media/sign`) được bảo vệ bằng lớp `authGuard` kết hợp `uploadRateLimit` tối đa `20 lần / 15 phút` trên mỗi tài khoản để tránh bot spam làm cạn kiệt dung lượng Cloudinary miễn phí.
4. **Socket.IO Event Rate Limiting & Service Throttle:**
   * Đặt giá đấu giá: Giới hạn `5 lượt đặt giá / 5 giây` ở tầng Socket, đồng thời giới hạn tốc độ `1 lượt đặt giá / 3 giây` cho mỗi người dùng ở tầng API để chống spam.
   * Gửi tin nhắn và trò chuyện:
     - Nhắn tin trực tiếp (`dm:send`): Giới hạn tối đa `10 tin nhắn / 1 giây` trên mỗi người dùng.
     - Trò chuyện trong phòng đấu giá (`chat:send`): Giới hạn tối đa `1 tin nhắn / 2 giây` trên mỗi người dùng để tránh làm nghẽn socket server.
5. **Request Body Size Limit:** Enforce kích thước payload tối đa ở mức `1MB` (`express.json({ limit: '1mb' })`) để phòng tránh tấn công tràn bộ nhớ (Out-Of-Memory).
6. **HTTP Security Headers:** Sử dụng `helmet` để ẩn thông tin công nghệ chạy phía server và phòng ngừa clickjacking, XSS.

---

## Hướng dẫn Deployment lên Production

### 1. Deploy Frontend (Next.js) lên **Vercel**
* Kết nối kho lưu trữ GitHub của bạn với Vercel.
* Thiết lập các biến môi trường tương tự như trong file `.env.example` của frontend.
* Thiết lập lệnh Build: `npm run build` và thư mục đích: `.next`.

### 2. Deploy Backend (Express) lên **Railway**
* Tạo một Project mới trên Railway và liên kết với GitHub Repository của bạn.
* Cấu hình toàn bộ biến môi trường (Environment Variables) trong tab **Variables** tương tự như file `.env.example` của backend:
  * **Database (PostgreSQL):** Sử dụng chuỗi kết nối từ dịch vụ cơ sở dữ liệu serverless **Neon** (gán vào biến `DATABASE_URL`).
  * **Cache & Queue (Redis):** Sử dụng chuỗi kết nối từ dịch vụ **Upstash Redis** (gán vào biến `REDIS_URL`).
* Railway sẽ tự động phát hiện ứng dụng Node.js, chạy lệnh build (`npm run build`) và khởi động ứng dụng thông qua script start (`npm start`).
* Nền tảng tự động cung cấp tên miền HTTPS và cấu hình Reverse Proxy bảo mật sẵn mà không cần thiết lập Nginx hoặc SSL thủ công.
* Lớp cấu hình `trust proxy` trong Express đã được bật sẵn để đảm bảo các bộ rate limiter nhận diện IP khách hàng chính xác qua proxy của Railway.
