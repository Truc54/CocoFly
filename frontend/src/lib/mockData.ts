// ─── Types ────────────────────────────────────────────────────────────────────

export interface MockAuctionItem {
  id: string;
  title: string;
  thumbnailUrl: string;
  category: { id: number; name: string };
  currentPrice: number;
  startingPrice: number;
  endTime: string;
  scheduledStart?: string;
  totalBids: number;
  totalWatchers: number;
}

export interface MockCategory {
  id: number;
  name: string;
  slug: string;
  iconUrl: string;
  description: string;
}

// ─── Notifications (mock) ─────────────────────────────────────────────────────

export const mockNotifications = { unreadCount: 3 };

// ─── Hot Auctions (mock — phiên có nhiều bids/watchers nhất) ──────────────────

export const mockHotAuctions: MockAuctionItem[] = [
  {
    id: 'hot-1',
    title: 'Rolex Submariner Date 41mm',
    thumbnailUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&q=80',
    category: { id: 6, name: 'Đồng hồ & Trang sức' },
    currentPrice: 350000000,
    startingPrice: 250000000,
    endTime: new Date(Date.now() + 4 * 3600000).toISOString(),
    totalBids: 42,
    totalWatchers: 234,
  },
  {
    id: 'hot-2',
    title: 'iPhone 15 Pro Max 1TB',
    thumbnailUrl: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=400&q=80',
    category: { id: 1, name: 'Công nghệ' },
    currentPrice: 35000000,
    startingPrice: 20000000,
    endTime: new Date(Date.now() + 2 * 3600000).toISOString(),
    totalBids: 38,
    totalWatchers: 189,
  },
  {
    id: 'hot-3',
    title: 'Tranh sơn dầu "Hoàng Hôn" — Bùi Xuân Phái',
    thumbnailUrl: 'https://images.unsplash.com/photo-1579541814924-49fef17c5be5?w=400&q=80',
    category: { id: 4, name: 'Nghệ thuật' },
    currentPrice: 120000000,
    startingPrice: 50000000,
    endTime: new Date(Date.now() + 6 * 3600000).toISOString(),
    totalBids: 31,
    totalWatchers: 167,
  },
  {
    id: 'hot-4',
    title: 'Vespa 946 Christian Dior Limited',
    thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80',
    category: { id: 5, name: 'Xe & Phương tiện' },
    currentPrice: 950000000,
    startingPrice: 700000000,
    endTime: new Date(Date.now() + 8 * 3600000).toISOString(),
    totalBids: 28,
    totalWatchers: 312,
  },
  {
    id: 'hot-5',
    title: 'MacBook Pro M3 Max 16" 96GB',
    thumbnailUrl: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=400&q=80',
    category: { id: 1, name: 'Công nghệ' },
    currentPrice: 89000000,
    startingPrice: 65000000,
    endTime: new Date(Date.now() + 3 * 3600000).toISOString(),
    totalBids: 25,
    totalWatchers: 145,
  },
  {
    id: 'hot-6',
    title: 'Túi Hermès Birkin 30 Togo Gold',
    thumbnailUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400&q=80',
    category: { id: 2, name: 'Thời trang & Phụ kiện' },
    currentPrice: 450000000,
    startingPrice: 300000000,
    endTime: new Date(Date.now() + 5 * 3600000).toISOString(),
    totalBids: 22,
    totalWatchers: 198,
  },
];

// ─── Upcoming Auctions (mock) ─────────────────────────────────────────────────

export const mockUpcomingAuctions: MockAuctionItem[] = [
  {
    id: 'up-1',
    title: 'Bình gốm Lý-Trần thế kỷ 12',
    thumbnailUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80',
    category: { id: 3, name: 'Cổ vật & Sưu tầm' },
    currentPrice: 0,
    startingPrice: 200000000,
    scheduledStart: new Date(Date.now() + 24 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 48 * 3600000).toISOString(),
    totalBids: 0,
    totalWatchers: 89,
  },
  {
    id: 'up-2',
    title: 'Sony A7R V + Lens 24-70mm f/2.8 GM II',
    thumbnailUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&q=80',
    category: { id: 13, name: 'Máy ảnh & Ống kính' },
    currentPrice: 0,
    startingPrice: 75000000,
    scheduledStart: new Date(Date.now() + 12 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 36 * 3600000).toISOString(),
    totalBids: 0,
    totalWatchers: 56,
  },
  {
    id: 'up-3',
    title: 'Đàn Piano Steinway & Sons Model B',
    thumbnailUrl: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=400&q=80',
    category: { id: 9, name: 'Nhạc cụ' },
    currentPrice: 0,
    startingPrice: 1500000000,
    scheduledStart: new Date(Date.now() + 48 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 72 * 3600000).toISOString(),
    totalBids: 0,
    totalWatchers: 34,
  },
  {
    id: 'up-4',
    title: 'Rượu Macallan 30 Year Old',
    thumbnailUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80',
    category: { id: 7, name: 'Rượu vang & Đồ uống' },
    currentPrice: 0,
    startingPrice: 85000000,
    scheduledStart: new Date(Date.now() + 6 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 30 * 3600000).toISOString(),
    totalBids: 0,
    totalWatchers: 72,
  },
  {
    id: 'up-5',
    title: 'Xe đạp Pinarello Dogma F 2024',
    thumbnailUrl: 'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?w=400&q=80',
    category: { id: 10, name: 'Thể thao & Outdoor' },
    currentPrice: 0,
    startingPrice: 180000000,
    scheduledStart: new Date(Date.now() + 18 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 42 * 3600000).toISOString(),
    totalBids: 0,
    totalWatchers: 45,
  },
  {
    id: 'up-6',
    title: 'Bộ mô hình Gundam PG Unicorn',
    thumbnailUrl: 'https://images.unsplash.com/photo-1608889175123-8ee362201f81?w=400&q=80',
    category: { id: 14, name: 'Đồ chơi & Mô hình' },
    currentPrice: 0,
    startingPrice: 15000000,
    scheduledStart: new Date(Date.now() + 36 * 3600000).toISOString(),
    endTime: new Date(Date.now() + 60 * 3600000).toISOString(),
    totalBids: 0,
    totalWatchers: 28,
  },
];

// ─── Category-specific auctions (mock for homepage rows) ──────────────────────

export const mockCategoryAuctions: Record<string, MockAuctionItem[]> = {
  'Cổ vật & Sưu tầm': [
    { id: 'cat3-1', title: 'Tượng Phật đồng thế kỷ 17', thumbnailUrl: 'https://images.unsplash.com/photo-1609619385002-f40f1df9b5a4?w=400&q=80', category: { id: 3, name: 'Cổ vật & Sưu tầm' }, currentPrice: 85000000, startingPrice: 40000000, endTime: new Date(Date.now() + 7 * 3600000).toISOString(), totalBids: 15, totalWatchers: 67 },
    { id: 'cat3-2', title: 'Bộ sưu tập tiền xu cổ Đông Dương', thumbnailUrl: 'https://images.unsplash.com/photo-1621981386829-9b458a1fa30a?w=400&q=80', category: { id: 3, name: 'Cổ vật & Sưu tầm' }, currentPrice: 25000000, startingPrice: 10000000, endTime: new Date(Date.now() + 5 * 3600000).toISOString(), totalBids: 12, totalWatchers: 45 },
    { id: 'cat3-3', title: 'Đĩa sứ men lam Bát Tràng cổ', thumbnailUrl: 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&q=80', category: { id: 3, name: 'Cổ vật & Sưu tầm' }, currentPrice: 18000000, startingPrice: 8000000, endTime: new Date(Date.now() + 9 * 3600000).toISOString(), totalBids: 8, totalWatchers: 34 },
    { id: 'cat3-4', title: 'Kiếm Nhật Katana thời Edo', thumbnailUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80', category: { id: 3, name: 'Cổ vật & Sưu tầm' }, currentPrice: 150000000, startingPrice: 80000000, endTime: new Date(Date.now() + 12 * 3600000).toISOString(), totalBids: 19, totalWatchers: 89 },
    { id: 'cat3-5', title: 'Bản đồ Việt Nam thế kỷ 18', thumbnailUrl: 'https://images.unsplash.com/photo-1524661135-423995f22d0b?w=400&q=80', category: { id: 3, name: 'Cổ vật & Sưu tầm' }, currentPrice: 42000000, startingPrice: 20000000, endTime: new Date(Date.now() + 4 * 3600000).toISOString(), totalBids: 14, totalWatchers: 56 },
    { id: 'cat3-6', title: 'Hộp sơn mài Nhật Bản cổ', thumbnailUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=400&q=80', category: { id: 3, name: 'Cổ vật & Sưu tầm' }, currentPrice: 35000000, startingPrice: 15000000, endTime: new Date(Date.now() + 6 * 3600000).toISOString(), totalBids: 9, totalWatchers: 41 },
  ],
  'Xe & Phương tiện': [
    { id: 'cat5-1', title: 'Mercedes-Benz S-Class W140 1995', thumbnailUrl: 'https://images.unsplash.com/photo-1553440569-bcc63803a83d?w=400&q=80', category: { id: 5, name: 'Xe & Phương tiện' }, currentPrice: 280000000, startingPrice: 150000000, endTime: new Date(Date.now() + 10 * 3600000).toISOString(), totalBids: 21, totalWatchers: 156 },
    { id: 'cat5-2', title: 'Honda CB750 Four 1971 Restored', thumbnailUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=80', category: { id: 5, name: 'Xe & Phương tiện' }, currentPrice: 450000000, startingPrice: 300000000, endTime: new Date(Date.now() + 8 * 3600000).toISOString(), totalBids: 16, totalWatchers: 123 },
    { id: 'cat5-3', title: 'Porsche 911 Carrera 1987', thumbnailUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=400&q=80', category: { id: 5, name: 'Xe & Phương tiện' }, currentPrice: 1800000000, startingPrice: 1200000000, endTime: new Date(Date.now() + 15 * 3600000).toISOString(), totalBids: 11, totalWatchers: 234 },
    { id: 'cat5-4', title: 'Vespa PX 150 1978 Original', thumbnailUrl: 'https://images.unsplash.com/photo-1571075051265-a8a53de3822b?w=400&q=80', category: { id: 5, name: 'Xe & Phương tiện' }, currentPrice: 65000000, startingPrice: 35000000, endTime: new Date(Date.now() + 6 * 3600000).toISOString(), totalBids: 14, totalWatchers: 78 },
    { id: 'cat5-5', title: 'BMW R75/5 1972 Cafe Racer', thumbnailUrl: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=400&q=80', category: { id: 5, name: 'Xe & Phương tiện' }, currentPrice: 180000000, startingPrice: 100000000, endTime: new Date(Date.now() + 11 * 3600000).toISOString(), totalBids: 9, totalWatchers: 95 },
    { id: 'cat5-6', title: 'Land Rover Defender 110 1997', thumbnailUrl: 'https://images.unsplash.com/photo-1606016159991-dfe4f2746ad5?w=400&q=80', category: { id: 5, name: 'Xe & Phương tiện' }, currentPrice: 520000000, startingPrice: 350000000, endTime: new Date(Date.now() + 13 * 3600000).toISOString(), totalBids: 7, totalWatchers: 112 },
  ],
  'Đồng hồ & Trang sức': [
    { id: 'cat6-1', title: 'Omega Speedmaster Moonwatch', thumbnailUrl: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=400&q=80', category: { id: 6, name: 'Đồng hồ & Trang sức' }, currentPrice: 125000000, startingPrice: 80000000, endTime: new Date(Date.now() + 5 * 3600000).toISOString(), totalBids: 18, totalWatchers: 134 },
    { id: 'cat6-2', title: 'Nhẫn kim cương 3 carat D-VVS1', thumbnailUrl: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&q=80', category: { id: 6, name: 'Đồng hồ & Trang sức' }, currentPrice: 890000000, startingPrice: 500000000, endTime: new Date(Date.now() + 9 * 3600000).toISOString(), totalBids: 14, totalWatchers: 178 },
    { id: 'cat6-3', title: 'Patek Philippe Calatrava 5227', thumbnailUrl: 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&q=80', category: { id: 6, name: 'Đồng hồ & Trang sức' }, currentPrice: 750000000, startingPrice: 450000000, endTime: new Date(Date.now() + 7 * 3600000).toISOString(), totalBids: 10, totalWatchers: 201 },
    { id: 'cat6-4', title: 'Vòng ngọc jadeite Myanmar', thumbnailUrl: 'https://images.unsplash.com/photo-1515562141589-67f0d569b6f5?w=400&q=80', category: { id: 6, name: 'Đồng hồ & Trang sức' }, currentPrice: 320000000, startingPrice: 200000000, endTime: new Date(Date.now() + 4 * 3600000).toISOString(), totalBids: 22, totalWatchers: 99 },
    { id: 'cat6-5', title: 'Cartier Love Bracelet vàng hồng', thumbnailUrl: 'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=80', category: { id: 6, name: 'Đồng hồ & Trang sức' }, currentPrice: 95000000, startingPrice: 60000000, endTime: new Date(Date.now() + 6 * 3600000).toISOString(), totalBids: 16, totalWatchers: 87 },
    { id: 'cat6-6', title: 'TAG Heuer Monaco Steve McQueen', thumbnailUrl: 'https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?w=400&q=80', category: { id: 6, name: 'Đồng hồ & Trang sức' }, currentPrice: 185000000, startingPrice: 120000000, endTime: new Date(Date.now() + 11 * 3600000).toISOString(), totalBids: 13, totalWatchers: 76 },
  ],
  'Rượu vang & Đồ uống': [
    { id: 'cat7-1', title: 'Château Margaux 2005 Magnum', thumbnailUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&q=80', category: { id: 7, name: 'Rượu vang & Đồ uống' }, currentPrice: 45000000, startingPrice: 25000000, endTime: new Date(Date.now() + 8 * 3600000).toISOString(), totalBids: 11, totalWatchers: 67 },
    { id: 'cat7-2', title: 'Yamazaki 18 Single Malt', thumbnailUrl: 'https://images.unsplash.com/photo-1569529465841-dfecdab7503b?w=400&q=80', category: { id: 7, name: 'Rượu vang & Đồ uống' }, currentPrice: 38000000, startingPrice: 20000000, endTime: new Date(Date.now() + 6 * 3600000).toISOString(), totalBids: 15, totalWatchers: 82 },
    { id: 'cat7-3', title: 'Romanée-Conti Grand Cru 2012', thumbnailUrl: 'https://images.unsplash.com/photo-1553361371-9b22f78e8b1d?w=400&q=80', category: { id: 7, name: 'Rượu vang & Đồ uống' }, currentPrice: 180000000, startingPrice: 100000000, endTime: new Date(Date.now() + 12 * 3600000).toISOString(), totalBids: 8, totalWatchers: 145 },
    { id: 'cat7-4', title: 'Hennessy Paradis Imperial', thumbnailUrl: 'https://images.unsplash.com/photo-1602524816024-4e1e67d9a6a6?w=400&q=80', category: { id: 7, name: 'Rượu vang & Đồ uống' }, currentPrice: 55000000, startingPrice: 35000000, endTime: new Date(Date.now() + 10 * 3600000).toISOString(), totalBids: 9, totalWatchers: 58 },
    { id: 'cat7-5', title: 'Penfolds Grange 2010', thumbnailUrl: 'https://images.unsplash.com/photo-1474722883778-792e7990302f?w=400&q=80', category: { id: 7, name: 'Rượu vang & Đồ uống' }, currentPrice: 28000000, startingPrice: 15000000, endTime: new Date(Date.now() + 7 * 3600000).toISOString(), totalBids: 12, totalWatchers: 43 },
    { id: 'cat7-6', title: 'Macallan 25 Year Old Sherry Oak', thumbnailUrl: 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=400&q=80', category: { id: 7, name: 'Rượu vang & Đồ uống' }, currentPrice: 72000000, startingPrice: 45000000, endTime: new Date(Date.now() + 9 * 3600000).toISOString(), totalBids: 7, totalWatchers: 91 },
  ],
};

// ─── Featured Categories (cho grid danh mục nổi bật) ──────────────────────────

export const mockFeaturedCategories: MockCategory[] = [
  { id: 1, name: 'Công nghệ', slug: 'cong-nghe', iconUrl: 'devices', description: 'Điện thoại, laptop, thiết bị điện tử' },
  { id: 3, name: 'Cổ vật & Sưu tầm', slug: 'co-vat-suu-tam', iconUrl: 'account_balance', description: 'Đồ cổ, tiền xu, đồ sưu tầm' },
  { id: 6, name: 'Đồng hồ & Trang sức', slug: 'dong-ho-trang-suc', iconUrl: 'watch', description: 'Đồng hồ cao cấp, trang sức' },
  { id: 5, name: 'Xe & Phương tiện', slug: 'xe-phuong-tien', iconUrl: 'directions_car', description: 'Ô tô, xe máy, xe đạp' },
  { id: 4, name: 'Nghệ thuật', slug: 'nghe-thuat', iconUrl: 'palette', description: 'Tranh, tượng, tác phẩm' },
  { id: 7, name: 'Rượu vang & Đồ uống', slug: 'ruou-vang-do-uong', iconUrl: 'wine_bar', description: 'Rượu sưu tầm cao cấp' },
  { id: 2, name: 'Thời trang & Phụ kiện', slug: 'thoi-trang-phu-kien', iconUrl: 'checkroom', description: 'Quần áo, túi xách cao cấp' },
  { id: 13, name: 'Máy ảnh & Ống kính', slug: 'may-anh-ong-kinh', iconUrl: 'photo_camera', description: 'Máy ảnh, ống kính, phụ kiện' },
];
