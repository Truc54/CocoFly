# Kiến thức cốt lõi: Socket.IO và Redis Lock trong Hệ thống Đấu giá

Tài liệu này giải thích chi tiết về hai công nghệ cốt lõi được sử dụng để xây dựng tính năng đấu giá (Bidding Engine) thời gian thực và xử lý đồng thời cho dự án CocoFly.

---

## 1. Socket.IO và vai trò trong hệ thống Đấu giá

### Socket.IO là gì?
Nhiều người lầm tưởng Socket.IO chỉ là một thư viện dùng ở Frontend, nhưng thực tế nó là một giải pháp giao tiếp **hai chiều (bidirectional)** và **thời gian thực (real-time)** bao gồm 2 phần:
- **Client-side** (Thư viện chạy trên trình duyệt/Frontend - ví dụ: ứng dụng Next.js của chúng ta).
- **Server-side** (Thư viện chạy trên Backend - ví dụ: ứng dụng Node.js/Express của chúng ta).

Bản chất Socket.IO được xây dựng dựa trên giao thức **WebSocket** (có fallback xuống HTTP long-polling nếu môi trường không hỗ trợ). Nó cho phép duy trì một "đường ống" kết nối mở liên tục giữa Client và Server, thay vì cơ chế "hỏi - đáp" (Request - Response) một lần rồi đóng kết nối như HTTP REST API thông thường.

### Tại sao KHÔNG dùng HTTP REST API thông thường cho Đấu giá?
Nếu chúng ta chỉ dùng HTTP API (như `GET /api/auctions/:id`), để Frontend biết được có người vừa đặt giá mới, Frontend sẽ phải dùng kỹ thuật **Polling**: Cứ mỗi 1 giây lại gửi một request lên Backend để hỏi "Có giá mới chưa?".
- **Hậu quả về tài nguyên:** Nếu có 1.000 người cùng xem 1 phiên đấu giá, Backend và Database sẽ phải chịu 1.000 request/giây. Điều này gây lãng phí tài nguyên khổng lồ, làm sập server rất nhanh (giống như tự DDoS chính hệ thống của mình).
- **Hậu quả về trải nghiệm:** Độ trễ (latency) thấp nhất cũng là 1 giây. Trong khi đấu giá cần tính bằng mili-giây.

### Tác dụng của Socket.IO trong hệ thống CocoFly:
- **Cơ chế Push (Đẩy dữ liệu):** Server không bị động chờ Client hỏi. Khi User A đặt giá thành công (thông qua WebSocket hoặc API), Backend sẽ **chủ động "bắn" (broadcast)** thông tin giá mới xuống ngay lập tức cho 999 người còn lại đang ở trong "Room" của phiên đấu giá đó thông qua kết nối Socket đang mở.
- **Real-time (Thời gian thực tuyệt đối):** Độ trễ chỉ tính bằng mili-giây. Điều này là **sống còn** trong đấu giá, đặc biệt ở những giây cuối (chống bắn tỉa - anti-sniping). Người dùng cần nhìn thấy giá nhảy ngay lập tức để quyết định có đặt tiếp hay không.
- **Tiết kiệm tài nguyên:** Backend không phải nhận hàng ngàn request vô nghĩa. Server được rảnh rang và chỉ phải xử lý logic tính toán khi thực sự có một sự kiện (event) được gửi lên (như khi có người bấm nút "Đặt giá").

---

## 2. Redis Lock vs Database Lock cho xử lý đồng thời (Concurrency)

### Vấn đề Race Condition (Tình trạng tương tranh) trong đấu giá
Ở những giây cuối cùng của phiên đấu giá, có thể có 50 người cùng bấm nút "Đặt giá" ở mức giá 110.000đ trong cùng một mili-giây. Nếu Backend xử lý các request này đồng thời (chạy song song):
1. 50 request cùng đọc Database và thấy `currentPrice` đang là 100.000đ.
2. Cả 50 request cùng tính toán và thấy giá 110.000đ là hợp lệ.
3. Cả 50 request cùng tiến hành cập nhật (ghi) vào Database.
=> **Kết quả:** Database bị cập nhật đè lên nhau, logic đấu giá bị hỏng bét (đáng lẽ chỉ được phép 1 người đầu tiên đặt được giá 110.000đ, những người sau phải bị từ chối).

### Tại sao KHÔNG dùng Database Lock (Isolation Level / Pessimistic Lock)?
Bạn hoàn toàn có thể dùng Database Lock (như câu lệnh `SELECT * FROM auctions WHERE id = ? FOR UPDATE`). Khi đó Database sẽ khóa cứng dòng (row) của phiên đấu giá đó lại, các request khác muốn đọc/ghi dòng đó phải xếp hàng chờ. Tuy nhiên, trong bài toán đấu giá, nó có những nhược điểm chí mạng:
1. **Cháy Connection Pool (Cạn kiệt kết nối DB):** Nếu 500 người cùng bid, 1 request được lấy Lock, 499 request còn lại sẽ phải "treo" (block) chờ bên trong Database. Số lượng connection tối đa của Database (thường cấu hình khoảng 50-100) sẽ bị cạn kiệt ngay lập tức. Toàn bộ các tính năng khác của hệ thống (đăng nhập, xem sản phẩm, tạo item) cũng sẽ chết theo vì không còn connection trống để gọi DB.
2. **Hi hiệu năng cực chậm:** Database sinh ra để lưu trữ dữ liệu an toàn trên ổ cứng. Việc bắt DB quản lý Lock (khóa) trên hàng ngàn request tranh chấp cùng lúc sẽ làm DB quá tải CPU.
3. **Logic ứng dụng phức tạp và kéo dài:** Logic đặt giá (Bid) yêu cầu tính toán rất nhiều bước (kiểm tra Proxy Bidding, tính toán ngày giờ anti-sniping, kiểm tra trạng thái User...). Việc giữ DB Lock trong suốt quá trình chạy một đống logic tính toán chậm chạp này là một **Anti-pattern** (thực hành tồi) cực kỳ nguy hiểm.

### Tại sao Redis Lock (Distributed Lock) lại tối ưu hơn?
Redis là một cơ sở dữ liệu lưu trữ trên **RAM (In-memory)**. Tốc độ đọc/ghi của nó tính bằng micro-giây, nhanh gấp hàng ngàn lần Database thông thường.
- **Cơ chế "Bảo vệ từ xa" (Gatekeeper):** Thay vì để 500 request đập thẳng vào Database để tranh nhau cái Lock, chúng ta bắt chúng tranh nhau cái khóa trên Redis trước.
- **Xử lý siêu tốc:** Chỉ mất chưa tới 1 mili-giây để Redis quyết định ai là người cầm khóa. 
- **Fail-fast (Thất bại nhanh):** 1 request đầu tiên lấy được khóa và đi vào chạy business logic, update Database. 499 request đến sau (chỉ trễ vài mili-giây) khi hỏi Redis sẽ thấy khóa đã bị lấy. Backend lập tức trả về lỗi cho 499 Frontend: *"Hệ thống đang xử lý giao dịch khác, vui lòng đặt lại"* **MÀ KHÔNG HỀ ĐỤNG VÀO DATABASE MỘT LẦN NÀO**. Nhờ vậy, Database hoàn toàn được bảo vệ.
- **An toàn trong môi trường phân tán (Distributed System):** Nếu sau này nền tảng CocoFly lớn mạnh, Backend được scale lên chạy trên 5 server khác nhau (để cân bằng tải). Lock bằng biến trong code (như Mutex của JS) sẽ vô dụng vì các server không share bộ nhớ. Nhưng Redis Lock vẫn hoạt động chuẩn xác vì 5 server cùng trỏ chung vào 1 cục Redis độc lập.

### Tóm tắt kiến trúc
**Redis Lock** đứng ở vòng ngoài làm "bảo vệ tinh nhuệ", loại bỏ ngay lập tức các request bị xung đột hoặc chậm chân. **PostgreSQL (Database)** đứng ở vòng trong chỉ làm nhiệm vụ lưu trữ dữ liệu một cách an toàn và nhàn nhã, không phải chịu gánh nặng quản lý xếp hàng. Sự kết hợp này giúp hệ thống Đấu giá chịu tải cực lớn (High Concurrency) mà vẫn mượt mà.

---

## 3. Bổ sung kiến thức: Chi tiết về Socket.IO và Logic Đấu giá (Cập nhật 14/05/2026)

### 3.1. Phân biệt `io` vs `socket` trong Backend
- **`io` (Tổng đài):** Đối tượng quản lý toàn bộ server socket. Dùng để gửi thông báo cho tất cả người dùng (`io.emit`) hoặc gửi cho một nhóm người trong phòng (`io.to('room').emit`).
- **`socket` (Đường dây riêng):** Đối tượng đại diện cho kết nối của một người dùng duy nhất. Dùng để lắng nghe (`socket.on`) và trả lời riêng cho người đó (`socket.emit`).

### 3.2. Cơ chế chia Room và Bảo mật JWT
- **Room management:** Sử dụng `socket.join('auction:ID')` để gom những người đang xem cùng một phiên đấu giá vào một nhóm. Giúp tối ưu hóa việc phát loa thông báo giá mới.
- **JWT Middleware:** WebSocket là giao thức khác với HTTP. Dù đã login ở web, khi mở Socket vẫn phải xác thực lại bằng Token (`io.use`) để Server gán đúng `userId` vào `socket.data`, ngăn chặn việc giả danh đặt giá.

### 3.3. Idempotency Guard (Chống trùng lặp yêu cầu)
Sử dụng Redis với lệnh `SET NX` kèm thời gian hết hạn (TTL) 10 giây cho mỗi `requestId`. 
- **Mục đích:** Chống lỗi người dùng click đúp nút đặt giá hoặc mạng lag khiến request bị gửi đi 2 lần. 
- **Cơ chế:** Chỉ cho phép yêu cầu đầu tiên đi qua, các yêu cầu trùng lặp trong vòng 10 giây sẽ bị từ chối ngay lập tức.

### 3.4. Logic "Giá Mua Ngay" (Buyout Price) và Triết lý UX
- **Mua ngay (Buyout) vs Bảo lưu (Reserve):** Giá Mua ngay luôn công khai để khuyến khích chốt đơn sớm. Giá Bảo lưu luôn ẩn để bảo vệ người bán.
- **Cơ chế Tự động Mua Ngay (Auto-Buyout):** Nếu người dùng nhập giá đặt $\ge$ giá mua ngay, hệ thống sẽ tự động ép giá về đúng mức mua ngay và kết thúc phiên đấu giá lập tức. 
- **Lưu ý UX:** Việc nhập nhầm số tiền lớn dẫn đến mua đứt được kiểm soát bằng **Popup xác nhận** ở Frontend. Backend đóng vai trò là chốt chặn cuối cùng để đảm bảo dữ liệu luôn nhất quán.

### 3.5. Kỹ thuật `tryBroadcast` và Lazy Loading trong Worker
Trong các tiến trình chạy ngầm (Worker), việc gọi Socket có thể gây lỗi nếu Server chưa khởi động xong.
- **Lazy Loading:** Sử dụng `require('../config/socket')` bên trong hàm thay vì `import` ở đầu file để đảm bảo Socket chỉ được gọi khi thực sự cần thiết.
- **Startup Recovery:** Sử dụng `try...catch` rỗng để Worker có thể phục hồi và xử lý các công việc tồn đọng (như kết thúc phiên đấu giá khi sập server vừa bật lại) mà không bị crash nếu Socket chưa sẵn sàng.

### 3.6. API `getMyBidStatus`
Là API giúp Frontend lấy trạng thái hiện thời của người dùng khi vừa tải trang (đang dẫn đầu không, giá proxy là bao nhiêu, đã đặt giá chưa) để đồng bộ hóa giao diện ngay lập tức.
