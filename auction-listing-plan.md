# 📋 Plan: Danh sách Đấu giá LIVE & Sắp diễn ra (AUC-10 & AUC-11)

> **Mục tiêu:** Kết nối trang `/live` và `/upcoming` (hiện đang dùng data giả) với Backend API thật, lấy dữ liệu Auction từ Database.

---

## 1. Hiện trạng hệ thống

### Backend đã có:
- **Prisma Schema:** Model `Auction` với các field: `status` (enum: `scheduled`, `active`, `ended`, `cancelled`, `failed`), `scheduledStart`, `endTime`, `currentPrice`, `startingPrice`, `totalBids`, `totalWatchers`, `viewCount`.
- **Relations:** `Auction` → `Item` (title, condition, brand, location) → `ItemMedia` (cdnUrl, sortOrder) + `User` (seller: fullName, avatarUrl, rating).
- **Routes:** `POST /api/auctions` (tạo), `GET /api/auctions/:auctionId` (xem chi tiết).
- **Repository:** `AuctionRepository` có `createAuctionWithItem()` và `findById()`.
- **Index có sẵn trên DB:** `@@index([status, endTime])` và `@@index([sellerId, status])` — rất phù hợp cho query filter theo status.

### Frontend đã có:
- **Trang `/live` (`frontend/src/app/live/page.tsx`):** UI hoàn chỉnh với card grid, category sidebar, badge LIVE, hiển thị giá + thời gian còn lại + số người đang bid. **Đang dùng mảng `LIVE_AUCTIONS` hardcode.**
- **Trang `/upcoming` (`frontend/src/app/upcoming/page.tsx`):** UI hoàn chỉnh với card grid, filter tabs (Hôm nay/Ngày mai/Tuần này/Tất cả), search bar, nút "Nhắc tôi". **Đang dùng mảng `UPCOMING_AUCTIONS` hardcode.**
- **API client (`frontend/src/lib/api.ts`):** `auctionApi` object có `create()` và `getById()`. Chưa có method cho listing.

---

## 2. Cần xây dựng

### 2.1 Backend — API Endpoints

#### `GET /api/auctions/live`
Trả về danh sách các phiên đấu giá đang diễn ra (`status = 'active'`).

**Query params:**
| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | number | 1 | Trang hiện tại |
| `limit` | number | 20 | Số item mỗi trang (max 50) |
| `categoryId` | number? | — | Lọc theo danh mục |
| `sort` | string | `ending_soon` | Sắp xếp: `ending_soon` (endTime ASC), `newest` (createdAt DESC), `most_bids` (totalBids DESC), `price_asc`, `price_desc` |

**Response shape:**
```json
{
  "success": true,
  "data": {
    "auctions": [
      {
        "id": "uuid",
        "title": "iPhone 15 Pro Max",        // từ Item
        "thumbnailUrl": "https://...",        // ItemMedia có sortOrder=0
        "category": { "id": 1, "name": "Điện tử" },
        "condition": "like_new",
        "location": "TP. Hồ Chí Minh",
        "currentPrice": 25000000,
        "startingPrice": 20000000,
        "bidIncrement": 500000,
        "endTime": "2026-04-19T14:00:00Z",
        "totalBids": 18,
        "totalWatchers": 45,
        "seller": {
          "id": "uuid",
          "fullName": "Nguyễn Văn A",
          "avatarUrl": "https://...",
          "rating": 4.8
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "totalItems": 85,
      "totalPages": 5
    }
  }
}
```

---

#### `GET /api/auctions/upcoming`
Trả về danh sách các phiên đấu giá sắp diễn ra (`status = 'scheduled'`, `scheduledStart > now()`).

**Query params:**
| Param | Type | Default | Mô tả |
|-------|------|---------|-------|
| `page` | number | 1 | Trang hiện tại |
| `limit` | number | 20 | Số item mỗi trang (max 50) |
| `categoryId` | number? | — | Lọc theo danh mục |
| `period` | string | `all` | Lọc thời gian: `today`, `tomorrow`, `this_week`, `all` |
| `search` | string? | — | Tìm kiếm theo title (ILIKE) |

**Response shape:** Giống như `/live` nhưng thay `currentPrice` bằng giá trị của `startingPrice`, và thêm field `scheduledStart`.

---

### 2.2 Backend — Các file cần tạo / sửa

#### Tầng Repository (`auction.repository.ts`) — THÊM 2 methods:

```typescript
// Method 1: Lấy danh sách active auctions
public async findActiveAuctions(options: {
  page: number;
  limit: number;
  categoryId?: number;
  sort?: string;
}): Promise<{ auctions: any[]; total: number }>

// Method 2: Lấy danh sách scheduled auctions
public async findUpcomingAuctions(options: {
  page: number;
  limit: number;
  categoryId?: number;
  period?: string;
  search?: string;
}): Promise<{ auctions: any[]; total: number }>
```

**Prisma query mẫu cho `findActiveAuctions`:**
```typescript
const where = {
  status: 'active' as AuctionStatus,
  ...(categoryId ? { item: { categoryId } } : {}),
};

const [auctions, total] = await Promise.all([
  prisma.auction.findMany({
    where,
    include: {
      item: {
        include: {
          media: { where: { sortOrder: 0 }, take: 1 },  // Chỉ lấy thumbnail
          category: { select: { id: true, name: true } },
        },
      },
      seller: { select: { id: true, fullName: true, avatarUrl: true, rating: true } },
    },
    orderBy: sort === 'ending_soon' ? { endTime: 'asc' } : ...,
    skip: (page - 1) * limit,
    take: limit,
  }),
  prisma.auction.count({ where }),
]);
```

**Prisma query bổ sung cho `findUpcomingAuctions` (filter `period`):**
```typescript
const now = new Date();
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const startOfTomorrow = new Date(startOfToday); startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
const endOfTomorrow = new Date(startOfTomorrow); endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
const endOfWeek = new Date(startOfToday); endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));

// period filter logic:
// 'today'     → scheduledStart >= startOfToday AND < startOfTomorrow
// 'tomorrow'  → scheduledStart >= startOfTomorrow AND < endOfTomorrow
// 'this_week' → scheduledStart >= startOfToday AND < endOfWeek
// 'all'       → scheduledStart > now (mặc định)
```

---

#### Tầng Service (`auction.service.ts`) — THÊM 2 methods:
```typescript
public async getLiveAuctions(options): Promise<PaginatedResult>
public async getUpcomingAuctions(options): Promise<PaginatedResult>
```
Các method này chỉ gọi thẳng xuống Repository (không cần business logic phức tạp vì đây là read-only).

---

#### Tầng Controller (`auction.controller.ts`) — THÊM 2 handlers:
```typescript
public async getLiveAuctions(req: Request, res: Response, next: NextFunction)
public async getUpcomingAuctions(req: Request, res: Response, next: NextFunction)
```
Trích xuất query params, gọi service, trả response.

---

#### Tầng Routes (`auction.routes.ts`) — THÊM 2 routes:
```typescript
// Public routes — không cần authGuard
auctionRoutes.get('/live', auctionController.getLiveAuctions.bind(auctionController));
auctionRoutes.get('/upcoming', auctionController.getUpcomingAuctions.bind(auctionController));
```

> ⚠️ **LƯU Ý THỨ TỰ ROUTE:** Phải đặt route `/live` và `/upcoming` **TRƯỚC** route `/:auctionId`, nếu không Express sẽ hiểu chữ "live" là một auctionId và đá vào handler sai.

---

### 2.3 Frontend — Các file cần sửa

#### `frontend/src/lib/api.ts` — Thêm 2 methods vào `auctionApi`:
```typescript
export const auctionApi = {
  create: (data: any) => fetchApi('/api/auctions', { ... }),
  getById: (id: string) => fetchApi(`/api/auctions/${id}`),
  // MỚI:
  getLive: (params?: { page?: number; limit?: number; categoryId?: number; sort?: string }) =>
    fetchApi(`/api/auctions/live?${new URLSearchParams(params as any)}`),
  getUpcoming: (params?: { page?: number; limit?: number; categoryId?: number; period?: string; search?: string }) =>
    fetchApi(`/api/auctions/upcoming?${new URLSearchParams(params as any)}`),
};
```

---

#### `frontend/src/app/live/page.tsx` — Thay data giả bằng API thật:
1. **Xóa** hoàn toàn mảng `LIVE_AUCTIONS` hardcode.
2. **Import** `auctionApi` và hook `useEffect`, `useState`.
3. **Fetch data** khi component mount hoặc khi `activeCategory` thay đổi.
4. **Map** response data vào card hiện tại, thay thế các field:
   - `auction.image` → `auction.thumbnailUrl`
   - `auction.price` → format `auction.currentPrice` sang VNĐ
   - `auction.timeLeft` → tính countdown từ `auction.endTime` (dùng `setInterval` mỗi giây)
   - `auction.activeBidders` → `auction.totalBids`
   - `auction.category` → `auction.category.name`
5. **Loading state + Empty state:** Skeleton loader khi đang tải, thông báo "Chưa có phiên đấu giá nào" khi danh sách rỗng.
6. **Pagination:** Thêm nút "Xem thêm" hoặc infinite scroll ở cuối grid.
7. **Lấy danh sách Category từ DB** thay vì hardcode (tuỳ chọn - có thể tạo thêm `GET /api/categories`).

---

#### `frontend/src/app/upcoming/page.tsx` — Thay data giả bằng API thật:
1. **Xóa** mảng `UPCOMING_AUCTIONS` hardcode.
2. **Fetch** dùng `auctionApi.getUpcoming()`.
3. **Filter tabs** (Hôm nay / Ngày mai / Tuần này / Tất cả): Khi user bấm tab → gọi lại API với param `period` tương ứng.
4. **Search bar:** Debounce input 300ms → gọi API với param `search`.
5. **Map** response:
   - `auction.startPrice` → format `auction.startingPrice`
   - `auction.startTime` → format `auction.scheduledStart` sang dạng "Bắt đầu lúc HH:mm - dd/MM"
6. **Loading, Empty, Pagination:** tương tự trang Live.

---

## 3. Thứ tự triển khai đề xuất

| Bước | Task | File |
|------|------|------|
| 1 | Thêm 2 methods `findActiveAuctions` + `findUpcomingAuctions` | `auction.repository.ts` |
| 2 | Thêm 2 methods `getLiveAuctions` + `getUpcomingAuctions` | `auction.service.ts` |
| 3 | Thêm 2 handlers trong Controller | `auction.controller.ts` |
| 4 | Đăng ký 2 routes MỚI (đặt TRƯỚC `/:auctionId`) | `auction.routes.ts` |
| 5 | Test Backend bằng curl/Postman | — |
| 6 | Thêm 2 API methods vào `auctionApi` | `api.ts` |
| 7 | Kết nối trang `/live` với API thật | `live/page.tsx` |
| 8 | Kết nối trang `/upcoming` với API thật | `upcoming/page.tsx` |
| 9 | Test E2E trên trình duyệt | — |

---

## 4. Lưu ý kỹ thuật

- **Performance:** Index `@@index([status, endTime])` đã có sẵn trong schema → query `WHERE status = 'active' ORDER BY endTime` sẽ cực nhanh.
- **Thumbnail optimization:** Chỉ lấy `ItemMedia` có `sortOrder = 0` (1 ảnh duy nhất) thay vì load cả gallery → giảm payload.
- **Countdown timer:** Tính toán phía client từ `endTime` (trang Live) hoặc `scheduledStart` (trang Upcoming) chứ KHÔNG gửi chuỗi format sẵn từ server. Vì nếu format sẵn, mỗi giây phải gọi lại API.
- **Route order:** `GET /live` và `GET /upcoming` PHẢI nằm trước `GET /:auctionId` trong file routes để Express không hiểu nhầm "live" là UUID.
