# Báo cáo Code Review Tích Hợp Bidding & Socket (Chi Tiết & Trực Quan)

Dưới đây là bản review chuyên sâu về các thay đổi ở backend phục vụ tính năng Đấu giá theo thời gian thực (Real-time Bidding) và Đặt giá tự động (Proxy Bidding). Đi kèm là các đoạn code thực tế để minh họa cách hệ thống hoạt động.

---

## 1. Mở rộng Giao tiếp Thời Gian Thực (WebSockets)

Việc chỉ dùng HTTP REST API không thể đáp ứng được trải nghiệm đấu giá cần độ trễ thấp. Hệ thống đã thêm mới **Socket.IO** để xử lý.

### 1.1. `src/config/socket.ts` - Trung tâm điều phối sự kiện
File này đóng vai trò như một Controller nhưng dành riêng cho WebSocket.

**A. Xác thực JWT qua Socket (Middleware):**
Đảm bảo kết nối an toàn, chỉ user hợp lệ mới tham gia được room.
```typescript
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) return next(new Error('Token không được cung cấp'));

    const payload = tokenService.verifyAccessToken(token);
    socket.data.userId = payload.userId; // Gắn userId vào socket context
    next();
  } catch {
    next(new Error('Token không hợp lệ hoặc đã hết hạn'));
  }
});
```

**B. Cơ chế Idempotency (Chống trùng lặp request):**
Để chống spam hoặc lỗi mạng khiến client gửi nhiều request cùng lúc, hệ thống tận dụng Redis để làm khiên chắn.
```typescript
socket.on('bid:place', async (data) => {
  // Idempotency guard: reject duplicate requests within 10s
  if (data.requestId) {
    const idempotencyKey = `bid_idem:${userId}:${data.requestId}`;
    // Nếu key đã tồn tại (chưa hết 10s), isNew sẽ là null/false
    const isNew = await redis.set(idempotencyKey, '1', 'EX', 10, 'NX');
    if (!isNew) {
      console.log(`⚠️ Duplicate bid request rejected`);
      return; 
    }
  }
  // ... gọi BiddingService
});
```

**C. Broadcast Kết Quả:**
Sau khi `BiddingService` xử lý xong, Socket sẽ lập tức "loan tin" cho toàn bộ room.
```typescript
// Báo cho tất cả người xem trong room biết giá vừa được nâng lên
io!.to(`auction:${data.auctionId}`).emit('auction:bid_placed', {
  bid: result.bid,
  currentPrice: result.currentPrice,
  totalBids: result.totalBids,
});

// "Bắn tỉa" - Nếu có Anti-sniping được kích hoạt, báo cho mọi người giờ đã tăng lên
if (result.extended) {
  io!.to(`auction:${data.auctionId}`).emit('auction:extended', {
    newEndTime: result.newEndTime,
    extendCount: result.extendCount,
  });
}
```

---

## 2. Lõi Nghiệp Vụ Bidding (Bidding Engine)

Logic đấu giá cực kỳ nhạy cảm với dữ liệu (sai 1 đồng là hỏng hệ thống), do đó đã được tách ra một service riêng biệt.

### 2.1. `src/services/bidding.service.ts`

**A. Distributed Lock (Khóa phân tán với Redis):**
Tránh lỗi Race-Condition (2 người bấm đặt giá cùng 1 mili-giây).
```typescript
async placeBid(params: PlaceBidParams): Promise<BidResult> {
  // 1. Dùng Redis SET NX (Chỉ set nếu chưa tồn tại) để khóa phiên đấu giá này lại
  const lockKey = `lock:auction:${auctionId}`;
  const lockValue = crypto.randomUUID();
  const acquired = await redis.set(lockKey, lockValue, 'EX', LOCK_TTL, 'NX');

  if (!acquired) {
    throw new AppError('Hệ thống đang xử lý bid khác, vui lòng thử lại', 409);
  }
  
  try {
    // 2. Toàn bộ logic đặt giá, check proxy, lưu database nằm ở đây...
  } finally {
    // 3. Phải đảm bảo luôn mở khóa khi xử lý xong (kể cả khi lỗi) bằng Lua script
    await redis.eval(RELEASE_LOCK_SCRIPT, 1, lockKey, lockValue);
  }
}
```

**B. Proxy Bidding (Xử lý Đấu trí tự động):**
Đây là logic đáng giá nhất. Hàm `resolveProxyCompetition` phân xử khi 1 người đặt giá thủ công đối đầu với 1 Proxy (bot đặt giá tự động do người chơi trước cài đặt).

Kịch bản 2 (Proxy thắng): Người dùng thủ công đặt mức giá vẫn chưa qua ngưỡng tối đa của Proxy.
```typescript
// 1. Lưu lại nỗ lực tuyệt vọng của người dùng thủ công
const manualBid = await this.repo.saveBidTransaction({
  bidderId: manualBidderId,
  amount: effectiveManualMax,
  isAutoBid: false, // ...
});

// 2. Proxy tự động đặt đè lên 1 bước giá (bidIncrement) để giữ vị trí dẫn đầu
let proxyBidAmount = manualRecordAmount + bidIncrement;

// Cap lại không cho vượt quá ngưỡng cài đặt của chính Proxy đó
if (proxyBidAmount > bestProxyMax) proxyBidAmount = bestProxyMax;

const autoBid = await this.repo.saveBidTransaction({
  bidderId: bestProxy.bidderId,
  amount: proxyBidAmount,
  isAutoBid: true, // Đánh dấu là hệ thống tự đặt
});
```

**C. Anti-Sniping (Luật chống bắn tỉa):**
Ngăn chặn hành vi rình tới giây cuối cùng mới đặt giá.
```typescript
private async checkAntiSniping(auctionId, auction) {
  const remainingMs = endTimeMs - Date.now();
  const thresholdMs = auction.autoExtendThreshold * 60 * 1000;

  // Nếu đặt giá khi thời gian còn lại ít hơn Threshold (ví dụ: < 5 phút)
  if (remainingMs <= thresholdMs) {
    const extensionMs = auction.autoExtendMinutes * 60 * 1000;
    const newEndTime = new Date(endTimeMs + extensionMs);
    
    // Cộng thêm giờ vào DB và lên lịch lại cho worker
    await prisma.auction.update({ ... });
    await scheduleAuctionEnd(auctionId, newEndTime); // Đẩy lùi lịch đóng phiên

    return { extended: true, newEndTime: newEndTime.toISOString() };
  }
  return { extended: false };
}
```

---

## 3. Khép Kín Vòng Đời Bằng Background Jobs (BullMQ)

Khi đếm ngược kết thúc, hệ thống không gọi API mà worker tự chạy.

### 3.1. `src/workers/auction.worker.ts`
Khi phiên đấu giá đóng (`handleEndAuction`), hệ thống sẽ tìm người thắng và xử lý thanh toán.

```typescript
// 1. Tìm người đặt giá hợp lệ cao nhất
const highestBid = await auctionRepo.findHighestBid(auctionId);

if (highestBid) {
  const finalPrice = Number(highestBid.amount);
  const platformFee = finalPrice * 0.05; // Thu phí nền tảng 5%

  // 2. Tạo hóa đơn chờ thanh toán
  await prisma.payment.create({
    data: {
      buyerId: highestBid.bidderId,
      sellerId: auction.sellerId,
      amount: new Decimal(finalPrice),
      platformFee: new Decimal(platformFee),
      status: 'pending',
      // ...
    },
  });

  // 3. Kích hoạt đồng hồ đếm ngược 48H để thanh toán (Sang payment worker)
  await schedulePaymentTimeout(auctionId, highestBid.bidderId);
  
  // 4. Báo qua Socket là phiên đấu giá đã hạ màn và có người thắng
  tryBroadcast(auctionId, 'auction:ended', { winnerId: highestBid.bidderId, finalPrice });
}
```

---

## 4. Tầng Kiểm Soát Đầu Vào (Validation)

### 4.1. `src/validators/bid.validator.ts`
Chặn ngay từ cửa nếu payload không hợp lý.
```typescript
export const placeBidSchema = z.object({
  auctionId: z.string().uuid(),
  amount: z.number().positive(),
  maxAutoBid: z.number().positive().optional(),
}).refine(
  // Rule: Cài proxy thì giá tối đa lúc nào cũng phải lớn hơn hoặc bằng giá gốc lúc khởi điểm đặt
  (data) => !data.maxAutoBid || data.maxAutoBid >= data.amount,
  { message: 'Giá tối đa tự động phải >= giá đặt' }
);
```

---

## Kiến Trúc Chốt Lại
Việc bổ sung các file này đánh dấu sự chuyển đổi thành kiến trúc **Event-Driven & Real-time**. 
1. **Zod Validator** chặn rác ở cửa.
2. **Socket.IO** làm nhân viên nhận/phát thông báo siêu tốc.
3. **Redis Lock** làm bảo vệ chống chen lấn xô đẩy.
4. **BiddingService** làm quan tòa xử lý Proxy và Anti-Sniping.
5. **BullMQ** làm hậu cần (Worker) lo chốt sổ và đòi tiền sau 48h.
