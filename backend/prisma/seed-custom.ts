import { PrismaClient, UserRole, AccountStatus, ItemCondition, AuctionType, AuctionStatus, ItemStatus } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

interface ProductTemplate {
  title: string;
  description: string;
  brand: string;
}

interface CategoryConfig {
  slug: string;
  keywords: string[];
  startingPriceMin: number;
  startingPriceMax: number;
  buyoutPriceMin: number;
  buyoutPriceMax: number;
  bidIncrement: number;
  cdnUrls: string[];
  products: ProductTemplate[];
}

const CATEGORY_CONFIGS: Record<string, CategoryConfig> = {
  "dong-ho-trang-suc": {
    slug: "dong-ho-trang-suc",
    keywords: ["watch", "jewelry"],
    startingPriceMin: 10000000,
    startingPriceMax: 50000000,
    buyoutPriceMin: 50000000,
    buyoutPriceMax: 200000000,
    bidIncrement: 1000000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600",
      "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600",
      "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?q=80&w=600",
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=600",
      "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=600",
    ],
    products: [
      { title: "Đồng hồ Rolex Submariner Date 126610LN", description: "Đồng hồ lặn Rolex Submariner chính hãng bằng thép Oystersteel, niềng Cerachrom đen, đi kèm hộp sổ thẻ đầy đủ.", brand: "Rolex" },
      { title: "Đồng hồ Omega Speedmaster Moonwatch Professional", description: "Chronograph huyền thoại Omega Speedmaster Moonwatch thép không gỉ, máy cót tay Co-Axial Master Chronometer Calibre 3861.", brand: "Omega" },
      { title: "Nhẫn kim cương PNJ 18K Luxury", description: "Nhẫn kim cương thiên nhiên vàng trắng 18k PNJ, viên chủ 5.4ly kiểm định GIA chất lượng xuất sắc F VVS1.", brand: "PNJ" },
      { title: "Đồng hồ Cartier Santos de Cartier Medium", description: "Dòng Santos cổ điển bằng thép, mặt số La Mã đặc trưng, trang bị cơ chế tự động lên cót Calibre 1847 MC.", brand: "Cartier" },
      { title: "Vòng tay Chanel Coco Crush Gold", description: "Vòng tay vàng vàng 18K Chanel Coco Crush cao cấp, hoa văn hình quả trám chần bông mang tính biểu tượng.", brand: "Chanel" },
    ],
  },
  "ruou-vang-do-uong": {
    slug: "ruou-vang-do-uong",
    keywords: ["wine", "whiskey"],
    startingPriceMin: 500000,
    startingPriceMax: 3000000,
    buyoutPriceMin: 3000000,
    buyoutPriceMax: 15000000,
    bidIncrement: 100000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=600",
      "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?q=80&w=600",
      "https://images.unsplash.com/photo-1528258347432-8a3b216bb63a?q=80&w=600",
      "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?q=80&w=600",
      "https://images.unsplash.com/photo-1560512823-829485b8bf24?q=80&w=600",
    ],
    products: [
      { title: "Rượu vang Chateau Margaux 2015 Premium", description: "Rượu vang Pháp cao cấp Chateau Margaux niên vụ xuất sắc 2015, nồng độ đậm đà, hậu vị tinh tế, hương thơm trái chín ngọt ngào.", brand: "Chateau Margaux" },
      { title: "Macallan 18 Years Old Sherry Oak Single Malt", description: "Dòng rượu Whisky mạch nha đơn cất Macallan 18 năm ủ trong thùng gỗ sồi Sherry nhập khẩu từ Tây Ban Nha.", brand: "Macallan" },
      { title: "Rượu Champagne Dom Perignon Vintage 2012", description: "Rượu sâm panh Pháp Dom Perignon hoàng gia niên vụ 2012, bọt khí mịn màng, hương vị phức hợp cuốn hút.", brand: "Dom Perignon" },
      { title: "Rượu Hibiki Japanese Harmony Master's Select", description: "Dòng Blended Whisky trứ danh của Suntory Nhật Bản, thiết kế chai 24 cạnh đại diện cho 24 tiết khí.", brand: "Suntory" },
      { title: "Rượu vang Penfolds Grange Hermitage Shiraz", description: "Rượu vang đỏ biểu tượng của Australia từ nhà làm rượu Penfolds, nồng độ cồn sâu lắng, tannin mượt mà.", brand: "Penfolds" },
    ],
  },
  "bat-dong-san": {
    slug: "bat-dong-san",
    keywords: ["house", "villa"],
    startingPriceMin: 1000000000,
    startingPriceMax: 5000000000,
    buyoutPriceMin: 5000000000,
    buyoutPriceMax: 15000000000,
    bidIncrement: 50000000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?q=80&w=600",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=600",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?q=80&w=600",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=600",
      "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?q=80&w=600",
    ],
    products: [
      { title: "Căn hộ Penthouse Vinhomes Central Park 3PN", description: "Căn hộ thông tầng Penthouse đẳng cấp tại Vinhomes Central Park Bình Thạnh, view trực diện sông Sài Gòn và Landmark 81.", brand: "Vinhomes" },
      { title: "Biệt thự sân vườn Thảo Điền Quận 2", description: "Biệt thự đơn lập sân vườn xanh mát Thảo Điền, hồ bơi riêng biệt, an ninh khép kín 24/7, vị trí yên tĩnh thông thoáng.", brand: "Thảo Điền Land" },
      { title: "Đất nền sổ đỏ mặt tiền đường Trần Não", description: "Lô đất vuông vức diện tích 150m2, sổ đỏ chính chủ, thích hợp xây tòa nhà văn phòng hoặc khách sạn mini.", brand: "Tư nhân" },
      { title: "Căn hộ chung cư cao cấp Masteri Thảo Điền", description: "Căn hộ chung cư cao cấp Masteri Thảo Điền 2 phòng ngủ, tầng cao, đầy đủ nội thất sang trọng nhập khẩu châu Âu.", brand: "Masterise" },
      { title: "Nhà phố thương mại Shophouse Sala Thủ Thiêm", description: "Nhà phố shophouse khu đô thị Sala Quận 2, xây dựng 1 trệt 4 lầu thích hợp làm showroom lớn.", brand: "Đại Quang Minh" },
    ],
  },
  "nhac-cu": {
    slug: "nhac-cu",
    keywords: ["piano", "guitar"],
    startingPriceMin: 2000000,
    startingPriceMax: 10000000,
    buyoutPriceMin: 10000000,
    buyoutPriceMax: 50000000,
    bidIncrement: 500000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1550985616-10810253b84d?q=80&w=600",
      "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=600",
      "https://images.unsplash.com/photo-1573871669414-010dbf73ca84?q=80&w=600",
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?q=80&w=600",
      "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=600",
    ],
    products: [
      { title: "Đàn Piano Grand Yamaha C3 Studio", description: "Đàn piano cơ đại dương cầm Yamaha C3 dòng chuyên nghiệp, âm sắc vang sáng, được căn chỉnh tỉ mỉ tại Nhật.", brand: "Yamaha" },
      { title: "Đàn Guitar Acoustic Taylor 214ce DLX", description: "Đàn guitar acoustic cao cấp Taylor 214ce Deluxe mặt gỗ vân sam Sitka nguyên tấm, dáng Grand Auditorium linh hoạt.", brand: "Taylor" },
      { title: "Đàn Guitar Electric Fender Stratocaster", description: "Đàn guitar điện Fender Player Stratocaster màu Sunburst ba màu kinh điển, sản xuất tại Mexico.", brand: "Fender" },
      { title: "Đàn Violin cổ Cremona 1720 Replica", description: "Vĩ cầm thủ công gỗ sồi và thông sấy khô tự nhiên trên 15 năm, mô phỏng thiết kế Cremona nổi tiếng thế kỷ 18.", brand: "Cremona" },
      { title: "Bàn nhạc Organ Roland Juno-DS61", description: "Đàn keyboard synthesizer chuyên nghiệp Roland Juno-DS61, thư viện âm thanh đồ sộ cho nhạc công đi show.", brand: "Roland" },
    ],
  },
  "the-thao-outdoor": {
    slug: "the-thao-outdoor",
    keywords: ["bicycle", "camping"],
    startingPriceMin: 300000,
    startingPriceMax: 1500000,
    buyoutPriceMin: 1500000,
    buyoutPriceMax: 8000000,
    bidIncrement: 50000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600",
      "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?q=80&w=600",
      "https://images.unsplash.com/photo-1517649763962-0c623066013b?q=80&w=600",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?q=80&w=600",
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=600",
    ],
    products: [
      { title: "Xe đạp đua Giant TCR Advanced 2", description: "Xe đua khung carbon siêu nhẹ Giant TCR Advanced 2, bộ truyền động Shimano 105 mượt mà chuyên nghiệp.", brand: "Giant" },
      { title: "Lều cắm trại dã ngoại Coleman WeatherMaster", description: "Lều cắm trại cao cấp 6-8 người Coleman WeatherMaster chống nước tuyệt đối, thông gió thông minh.", brand: "Coleman" },
      { title: "Thuyền hơi Kayak Intex Challenger K2", description: "Thuyền hơi hai người Intex Challenger K2 đi kèm mái chèo nhôm và bơm hơi, chất liệu nhựa vinyl siêu bền.", brand: "Intex" },
      { title: "Máy chạy bộ thông minh Xiaomi KingSmith R2", description: "Máy chạy bộ gấp gọn thông minh KingSmith R2 kết nối app điện thoại, màn hình LED hiển thị tốc độ quãng đường.", brand: "Xiaomi Kingsmith" },
      { title: "Vợt Tennis Wilson Pro Staff v14", description: "Vợt tennis Wilson Pro Staff v14 phiên bản mới nhất, kiểm soát bóng tối ưu, trợ lực trung bình tốt.", brand: "Wilson" },
    ],
  },
  "sach-tai-lieu-quy": {
    slug: "sach-tai-lieu-quy",
    keywords: ["old-book", "manuscript"],
    startingPriceMin: 1000000,
    startingPriceMax: 5000000,
    buyoutPriceMin: 5000000,
    buyoutPriceMax: 30000000,
    bidIncrement: 200000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600",
      "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?q=80&w=600",
      "https://images.unsplash.com/photo-1461360228754-6e81c478b882?q=80&w=600",
      "https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?q=80&w=600",
    ],
    products: [
      { title: "Bản dịch cổ \"Truyện Kiều\" Nôm khắc gỗ 1866", description: "Bản in khắc gỗ chữ Nôm tác phẩm Đoạn Trường Tân Thanh (Truyện Kiều) thời vua Tự Đức cực kỳ quý hiếm.", brand: "Cổ bản triều Nguyễn" },
      { title: "Cuốn sách cổ Đông Dương Pháp thuộc \"L'Indochine\"", description: "Tập sách ảnh tư liệu về địa lý, con người Đông Dương Pháp thuộc in năm 1930 với nhiều ảnh tư liệu quý.", brand: "Maison d'Édition Paris" },
      { title: "Bản chép tay sắc phong triều Nguyễn năm Tự Đức", description: "Văn bản triều đình chép tay bằng chữ Hán phong tước cho công thần, triện ấn đỏ hoàng gia còn sắc nét.", brand: "Hoàng triều Nguyễn" },
      { title: "Sách ảnh Đông Dương Indochine cổ bản giới hạn", description: "Sách ảnh chụp phong cảnh xứ Đông Dương đầu thế kỷ 20, bìa da đắp vàng sang trọng, bản giới hạn đánh số.", brand: "G. D'Indochine" },
      { title: "Sách hiếm về bản đồ lãnh thổ Việt Nam thế kỷ 19", description: "Sách địa chí vẽ tay hệ thống sông ngòi và bờ biển Việt Nam thời nhà Nguyễn biên soạn bằng Hán Nôm.", brand: "Đại Nam Thực Lục" },
    ],
  },
  "noi-that-decor": {
    slug: "noi-that-decor",
    keywords: ["chair", "lamp"],
    startingPriceMin: 800000,
    startingPriceMax: 4000000,
    buyoutPriceMin: 4000000,
    buyoutPriceMax: 20000000,
    bidIncrement: 100000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?q=80&w=600",
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=600",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=600",
      "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?q=80&w=600",
      "https://images.unsplash.com/photo-1538688525198-9b88f6f53126?q=80&w=600",
    ],
    products: [
      { title: "Ghế bành thư giãn Eames Lounge Chair & Ottoman", description: "Phiên bản thiết kế cao cấp ghế Eames bọc da bò tót thật kết hợp lưng gỗ óc chó uốn cong nghệ thuật.", brand: "Eames Design" },
      { title: "Đèn chùm pha lê vintage Baccarat Pháp", description: "Đèn trần pha lê nhiều tầng Baccarat Pháp chính hãng, khúc xạ ánh sáng lộng lẫy cổ điển cho phòng khách.", brand: "Baccarat" },
      { title: "Tủ gỗ gõ đỏ chạm khắc hoàng gia cổ điển", description: "Tủ trưng bày trang trí đắp gỗ gõ đỏ nguyên khối, họa tiết hoa văn chạm trổ thủ công điêu luyện từ làng nghề Đồng Kỵ.", brand: "Mộc Đồng Kỵ" },
      { title: "Đồng hồ quả lắc Hermle của Đức", description: "Đồng hồ đứng tủ đứng cơ học Hermle vỏ gỗ sồi, gõ chuông 15 phút Westminster cổ điển.", brand: "Hermle" },
      { title: "Bức tranh sơn mài Thuận Buồm Xuôi Gió", description: "Tranh sơn mài truyền thống thếp vàng lá 24K, biểu tượng may mắn thịnh vượng, đóng khung gỗ gụ.", brand: "Sơn mài Bình Dương" },
    ],
  },
  "may-anh-ong-kinh": {
    slug: "may-anh-ong-kinh",
    keywords: ["camera", "lens"],
    startingPriceMin: 3000000,
    startingPriceMax: 15000000,
    buyoutPriceMin: 15000000,
    buyoutPriceMax: 75000000,
    bidIncrement: 500000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600",
      "https://images.unsplash.com/photo-1616440347437-b1c73416efc2?q=80&w=600",
      "https://images.unsplash.com/photo-1500643753655-32309834479e?q=80&w=600",
      "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600",
      "https://images.unsplash.com/photo-1495707902641-75cac588d2e9?q=80&w=600",
    ],
    products: [
      { title: "Máy ảnh Rangefinder Leica M11 Classic", description: "Máy ảnh số Rangefinder Leica M11 thế hệ mới, cảm biến BSI CMOS Full-frame 60MP cực kỳ đẳng cấp.", brand: "Leica" },
      { title: "Ống kính Leica Noctilux-M 50mm f/0.95 ASPH", description: "Vua bóng đêm Leica Noctilux 50mm độ mở siêu khủng f/0.95, mang lại bokeh mịn màng đặc thù.", brand: "Leica" },
      { title: "Máy ảnh Fujifilm GFX 100S Medium Format", description: "Máy ảnh Medium Format Fujifilm GFX 100S cảm biến 102 megapixel, hệ thống chống rung trong thân máy.", brand: "Fujifilm" },
      { title: "Máy ảnh Sony Alpha 7R V Full-frame", description: "Sony A7R5 dòng máy ảnh chuyên phong cảnh 61MP, tích hợp vi xử lý AI lấy nét tự động thông minh.", brand: "Sony" },
      { title: "Ống kính Canon RF 28-70mm f/2L USM", description: "Ống kính zoom đa dụng khẩu độ lớn f/2 dòng L cao cấp nhất của Canon cho ngàm mirrorless.", brand: "Canon" },
    ],
  },
  "do-choi-mo-hinh": {
    slug: "do-choi-mo-hinh",
    keywords: ["figure", "lego"],
    startingPriceMin: 200000,
    startingPriceMax: 1000000,
    buyoutPriceMin: 1000000,
    buyoutPriceMax: 6000000,
    bidIncrement: 50000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1560942485-b2a11cc13456?q=80&w=600",
      "https://images.unsplash.com/photo-1566577134770-3d85bb3a9cc4?q=80&w=600",
      "https://images.unsplash.com/photo-1587654780291-39c9404d746b?q=80&w=600",
      "https://images.unsplash.com/photo-1608889175123-8ec330b86f84?q=80&w=600",
      "https://images.unsplash.com/photo-1593085512500-5d55148d6f0d?q=80&w=600",
    ],
    products: [
      { title: "Mô hình PG RX-93 Nu Gundam Bandai", description: "Mô hình lắp ráp cao cấp Perfect Grade Nu Gundam chính hãng Bandai Nhật Bản, tỷ lệ 1/60 chi tiết cơ khí đỉnh cao.", brand: "Bandai" },
      { title: "Mô hình Figure Monkey D. Luffy Gear 5 Studio", description: "Mô hình tĩnh nhựa resin cao cấp One Piece Luffy trạng thái Thần Mặt Trời Nika Gear 5, phát sáng LED.", brand: "JacksDo Studio" },
      { title: "Bộ đồ chơi lắp ráp LEGO Star Wars Millennium Falcon", description: "Mẫu tàu Millennium Falcon khổng lồ từ vũ trụ Star Wars với hơn 7500 chi tiết lắp ráp độ khó cao.", brand: "LEGO" },
      { title: "Mô hình siêu xe Bugatti Chiron LEGO Technic", description: "Siêu xe Bugatti Chiron tỷ lệ 1/8 dòng Technic lắp ráp cơ cấu hộp số hoạt động chân thực.", brand: "LEGO" },
      { title: "Mô hình Figure Hot Toys Iron Man Mark LXXXV", description: "Mô hình khớp cử động tỷ lệ 1/6 siêu anh hùng Iron Man Mark 85 phim Avengers Endgame đi kèm phụ kiện.", brand: "Hot Toys" },
    ],
  },
  "dien-thoai-may-tinh-bang": {
    slug: "dien-thoai-may-tinh-bang",
    keywords: ["iphone", "ipad"],
    startingPriceMin: 4000000,
    startingPriceMax: 15000000,
    buyoutPriceMin: 15000000,
    buyoutPriceMax: 45000000,
    bidIncrement: 200000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600",
      "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?q=80&w=600",
      "https://images.unsplash.com/photo-1598327105666-5b89351aff97?q=80&w=600",
      "https://images.unsplash.com/photo-1580910051074-3eb694886505?q=80&w=600",
      "https://images.unsplash.com/photo-1565630916779-e303be97b6f5?q=80&w=600",
    ],
    products: [
      { title: "Điện thoại iPhone 15 Pro Max 512GB", description: "Phiên bản quốc tế cao cấp titan tự nhiên iPhone 15 Pro Max dung lượng 512GB, máy đẹp 99% nguyên zin.", brand: "Apple" },
      { title: "Máy tính bảng iPad Pro M2 12.9-inch Cellular", description: "Máy tính bảng iPad Pro 12.9-inch màn hình Liquid Retina XDR chip M2 mạnh mẽ, hỗ trợ mạng 5G tiện lợi.", brand: "Apple" },
      { title: "Điện thoại Samsung Galaxy S24 Ultra", description: "Flagship cao cấp nhất của Samsung Galaxy S24 Ultra màu xám titan, đi kèm bút S-Pen, RAM 12GB bộ nhớ 256GB.", brand: "Samsung" },
      { title: "Điện thoại Vertu Signature S Design", description: "Phiên bản chế tác cao cấp Vertu Signature S bằng thép không gỉ, đính đá sapphire sang trọng tinh tế.", brand: "Vertu" },
      { title: "Máy tính bảng iPad Air 5 M1 Wifi", description: "iPad Air thế hệ 5 chạy vi xử lý Apple M1 hiệu năng mạnh mẽ, màu xanh dương cá tính trẻ trung.", brand: "Apple" },
    ],
  },
  "laptop-may-vi-tinh": {
    slug: "laptop-may-vi-tinh",
    keywords: ["laptop", "pc"],
    startingPriceMin: 6000000,
    startingPriceMax: 25000000,
    buyoutPriceMin: 25000000,
    buyoutPriceMax: 80000000,
    bidIncrement: 500000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?q=80&w=600",
      "https://images.unsplash.com/photo-1587831990711-23ca6441447b?q=80&w=600",
      "https://images.unsplash.com/photo-1547082299-de196ea013d6?q=80&w=600",
      "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=600",
      "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600",
    ],
    products: [
      { title: "Laptop MacBook Pro 16-inch M3 Max 64GB", description: "Quái vật đồ họa MacBook Pro 16-inch cấu hình cao nhất chip M3 Max (16 CPU/40 GPU), RAM 64GB SSD 1TB.", brand: "Apple" },
      { title: "Laptop Asus ROG Zephyrus G14 Gaming", description: "Laptop gaming mỏng nhẹ cao cấp Asus ROG Zephyrus G14 màn hình OLED, chip Ryzen 9, card đồ họa RTX 4070.", brand: "Asus" },
      { title: "Thùng máy PC Gaming Intel i9-14900K RTX 4090", description: "Case PC cấu hình khủng Intel Core i9 14900K, tản nhiệt nước Custom, card đồ họa đầu bảng Nvidia RTX 4090 24GB.", brand: "Custom Build" },
      { title: "Laptop Dell XPS 15 9530 Carbon", description: "Laptop Dell XPS 15 mỏng nhẹ vỏ carbon sang trọng, CPU Intel Core i7 13700H, RAM 16GB, SSD 512GB.", brand: "Dell" },
      { title: "Màn hình máy tính LG UltraFine 5K 27-inch", description: "Màn hình LG UltraFine chuyên dụng cho đồ họa độ phân giải 5K sắc nét, hỗ trợ kết nối Thunderbolt 3.", brand: "LG" },
    ],
  },
  "hang-hieu-do-xa-xi": {
    slug: "hang-hieu-do-xa-xi",
    keywords: ["bag", "wallet"],
    startingPriceMin: 8000000,
    startingPriceMax: 40000000,
    buyoutPriceMin: 40000000,
    buyoutPriceMax: 200000000,
    bidIncrement: 1000000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600",
      "https://images.unsplash.com/photo-1627124765135-56a300133a09?q=80&w=600",
      "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?q=80&w=600",
      "https://images.unsplash.com/photo-1548036328-c9fa89d128fa?q=80&w=600",
      "https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?q=80&w=600",
    ],
    products: [
      { title: "Túi xách Hermes Birkin 30 Leather", description: "Túi xách tay huyền thoại Hermes Birkin size 30 chất liệu da Togo màu đen khóa vàng cổ điển tuyệt đẹp.", brand: "Hermes" },
      { title: "Túi xách Chanel Classic Double Flap Bag", description: "Túi đeo chéo Chanel Classic chất liệu da Caviar bền bỉ khóa bạc, dòng túi hiệu giữ giá tốt nhất.", brand: "Chanel" },
      { title: "Ví da nam Louis Vuitton Zippy Organizer", description: "Ví cầm tay khóa kéo Louis Vuitton họa tiết Monogram đặc trưng, ngăn chứa rộng rãi và sang trọng.", brand: "Louis Vuitton" },
      { title: "Thắt lưng da Gucci Double G Buckle", description: "Thắt lưng da bò cao cấp khóa logo GG màu vàng đồng bản to 4cm lịch lãm phong cách.", brand: "Gucci" },
      { title: "Túi xách Dior Lady Dior Medium Bag", description: "Túi hiệu Lady Dior da cừu chần bông Cannage màu đỏ cherry nổi bật, charms Dior vàng lấp lánh.", brand: "Dior" },
    ],
  },
  "dien-gia-dung": {
    slug: "dien-gia-dung",
    keywords: ["appliances", "coffee-maker"],
    startingPriceMin: 400000,
    startingPriceMax: 2000000,
    buyoutPriceMin: 2000000,
    buyoutPriceMax: 10000000,
    bidIncrement: 100000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?q=80&w=600",
      "https://images.unsplash.com/photo-1570222094114-d054a817e56b?q=80&w=600",
      "https://images.unsplash.com/photo-1520608421741-68228b76b620?q=80&w=600",
      "https://images.unsplash.com/photo-1612538498456-e861df91d4d0?q=80&w=600",
      "https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?q=80&w=600",
    ],
    products: [
      { title: "Máy pha cà phê Breville Bambino Plus", description: "Máy pha espresso gia đình Breville Bambino Plus nhỏ gọn, tự động tạo bọt sữa mịn màng chuẩn barista.", brand: "Breville" },
      { title: "Máy hút bụi robot Roborock S8 Pro Ultra", description: "Robot hút bụi lau nhà Roborock S8 Pro Ultra với trạm sạc thông minh đa năng tự giặt dẻ sấy khô.", brand: "Roborock" },
      { title: "Nồi chiên không dầu Philips Premium XXL", description: "Nồi chiên không dầu cao cấp Philips công nghệ Fat Removal giảm mỡ thừa tối ưu cho thực phẩm.", brand: "Philips" },
      { title: "Máy làm sữa hạt Tefal Ultrablend", description: "Máy xay nấu đa năng làm sữa hạt Tefal công suất lớn, xay mịn không cần lọc xơ bã.", brand: "Tefal" },
      { title: "Lò vi sóng hơi nước Sharp Healsio", description: "Lò hấp vi sóng Sharp công nghệ siêu nhiệt Healsio bảo toàn dưỡng chất cho món ăn gia đình.", brand: "Sharp" },
    ],
  },
  "cong-nghe": {
    slug: "cong-nghe",
    keywords: ["headphones", "smartwatch"],
    startingPriceMin: 500000,
    startingPriceMax: 3000000,
    buyoutPriceMin: 3000000,
    buyoutPriceMax: 15000000,
    bidIncrement: 100000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=600",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=600",
      "https://images.unsplash.com/photo-1572536143248-966236ad6c27?q=80&w=600",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=600",
      "https://images.unsplash.com/photo-1608248597481-496100c80836?q=80&w=600",
    ],
    products: [
      { title: "Tai nghe không dây Apple AirPods Max", description: "Tai nghe chụp tai Apple AirPods Max màu xám không gian chống ồn chủ động ANC cực kỳ ấn tượng.", brand: "Apple" },
      { title: "Đồng hồ thông minh Garmin Fenix 7X Pro", description: "Đồng hồ GPS thể thao chuyên nghiệp Garmin Fenix 7X Pro, pin mặt trời thời lượng cực lâu.", brand: "Garmin" },
      { title: "Kính thực tế ảo Meta Quest 3 128GB", description: "Kính thực tế ảo thế hệ mới Meta Quest 3 dung lượng 128GB hỗ trợ công nghệ thực tế hỗn hợp MR.", brand: "Meta" },
      { title: "Tai nghe chống ồn Sony WH-1000XM5", description: "Tai nghe bluetooth chụp tai Sony WH-1000XM5 hàng đầu về khả năng chống ồn chủ động.", brand: "Sony" },
      { title: "Loa di động Bang & Olufsen Beosound A1", description: "Loa bluetooth di động cao cấp B&O Beosound A1 Gen 2 kháng nước IP67 âm thanh 360 độ sống động.", brand: "Bang & Olufsen" },
    ],
  },
  "thoi-trang-phu-kien": {
    slug: "thoi-trang-phu-kien",
    keywords: ["sunglasses", "jacket"],
    startingPriceMin: 300000,
    startingPriceMax: 2000000,
    buyoutPriceMin: 2000000,
    buyoutPriceMax: 10000000,
    bidIncrement: 50000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600",
      "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=600",
      "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?q=80&w=600",
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?q=80&w=600",
    ],
    products: [
      { title: "Kính mát nam Ray-Ban Classic Aviator", description: "Kính phi công Ray-Ban gọng vàng tròng xanh lá G-15 phân cực chống chói tốt, phong cách nam tính.", brand: "Ray-Ban" },
      { title: "Áo khoác da thật Saint Laurent Leather", description: "Áo khoác biker da cừu Saint Laurent cao cấp khóa kéo đen cá tính, chuẩn phom dáng thời trang Pháp.", brand: "Saint Laurent" },
      { title: "Giày Sneaker Jordan 1 Retro High OG", description: "Giày bóng rổ cổ cao Air Jordan 1 màu Chicago cổ điển được các tín đồ streetwear cực kỳ săn đón.", brand: "Nike" },
      { title: "Khăn choàng cổ Burberry Cashmere Classic", description: "Khăn len dệt sợi cashmere cao cấp Burberry họa tiết sọc kẻ Vintage Check sang trọng ấm áp.", brand: "Burberry" },
      { title: "Giày cao gót Christian Louboutin Kate", description: "Giày cao gót đế đỏ huyền thoại Louboutin Kate cao 10cm da bóng màu đen quyến rũ.", brand: "Christian Louboutin" },
    ],
  },
  "co-vat-suu-tam": {
    slug: "co-vat-suu-tam",
    keywords: ["antique", "vintage"],
    startingPriceMin: 2000000,
    startingPriceMax: 15000000,
    buyoutPriceMin: 15000000,
    buyoutPriceMax: 90000000,
    bidIncrement: 500000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?q=80&w=600",
      "https://images.unsplash.com/photo-1554034227-21418d53afe3?q=80&w=600",
      "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?q=80&w=600",
      "https://images.unsplash.com/photo-1584790870736-b42907474402?q=80&w=600",
      "https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=600",
    ],
    products: [
      { title: "Tượng Phật Thích Ca bằng đồng thế kỷ 18", description: "Tượng Phật cổ bằng đồng thau chạm khắc hoa văn tinh xảo thời Lê Trung Hưng, lớp patina cổ tự nhiên.", brand: "Cổ vật Việt Nam" },
      { title: "Đồng tiền cổ thời vua Minh Mạng bằng bạc", description: "Đồng bạc cổ đúc dưới thời vua Minh Mạng (Minh Mạng Thông Bảo), tình trạng bảo quản tốt hiếm gặp.", brand: "Hoàng triều Nguyễn" },
      { title: "Bình gốm Chu Đậu vẽ vàng thủ công", description: "Bình gốm sứ cổ Chu Đậu Hải Dương phục dựng thủ công vẽ vàng tinh xảo, nét hoa văn thuần Việt.", brand: "Gốm Chu Đậu" },
      { title: "Bản đồ cổ xứ Đông Dương thế kỷ 18", description: "Bản đồ in khắc đồng mô tả xứ Đàng Trong và Đàng Ngoài vẽ bởi nhà địa lý học người Pháp Bellin năm 1750.", brand: "Cartography Paris" },
      { title: "Bộ lư đồng thờ cúng khảm ngũ sắc cổ", description: "Bộ đồ thờ cúng gia tiên bằng đồng đỏ khảm ngũ sắc (Vàng, Bạc, Đồng đen, Đồng xanh, Đồng thau) cổ.", brand: "Đồ đồng Đại Bái" },
    ],
  },
  "xe-co": {
    slug: "xe-co",
    keywords: ["scooter", "motorcycle"],
    startingPriceMin: 5000000,
    startingPriceMax: 30000000,
    buyoutPriceMin: 30000000,
    buyoutPriceMax: 150000000,
    bidIncrement: 1000000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=600",
      "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600",
      "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=600",
      "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=600",
      "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600",
    ],
    products: [
      { title: "Xe máy Vespa Sprint 150 ABS Custom", description: "Xe ga Vespa Sprint động cơ i-Get 150cc phanh ABS, sơn đen nhám thời thượng, máy êm chạy lướt.", brand: "Piaggio" },
      { title: "Xe máy Honda Super Cub C125 nhập khẩu", description: "Mẫu xe huyền thoại Honda Super Cub C125 nhập khẩu nguyên chiếc từ Thái Lan, khóa Smartkey thông minh.", brand: "Honda" },
      { title: "Xe đạp điện thông minh Super73-RX", description: "Xe đạp điện địa hình Super73-RX phong cách Retro Cafe Racer mạnh mẽ, pin lithium dung lượng lớn.", brand: "Super73" },
      { title: "Xe máy điện VinFast Evo200 Lite", description: "Xe máy điện VinFast Evo200 pin LFP bền bỉ, chạy được quãng đường 200km/sạc, xe gia đình tiện dụng.", brand: "VinFast" },
      { title: "Xe đạp đua Carbon Specialized Tarmac SL8", description: "Siêu xe đạp đua chuyên nghiệp Specialized Tarmac SL8 khung carbon FACT 12r siêu nhẹ đẳng cấp.", brand: "Specialized" },
    ],
  },
  "khac": {
    slug: "khac",
    keywords: ["box", "pen"],
    startingPriceMin: 200000,
    startingPriceMax: 1000000,
    buyoutPriceMin: 1000000,
    buyoutPriceMax: 5000000,
    bidIncrement: 50000,
    cdnUrls: [
      "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600",
      "https://images.unsplash.com/photo-1583209814683-c023de294402?q=80&w=600",
      "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=600",
    ],
    products: [
      { title: "Hộp quà tết thượng hạng Phú Quý", description: "Hộp quà gỗ cao cấp chứa hạt dinh dưỡng, trà cổ thụ shan tuyết và rượu vang nhập khẩu sang trọng.", brand: "Đại Phát" },
      { title: "Bật lửa Zippo Armor Sterling Silver", description: "Bật lửa xăng đá Zippo vỏ dày bằng bạc đúc nguyên khối (Sterling Silver 925), tiếng chuông vang ấm.", brand: "Zippo" },
      { title: "Bút ký cao cấp Parker Sonnet Gold", description: "Bút máy Parker ngòi vàng 18K sang trọng tinh tế, thích hợp làm quà tặng doanh nhân.", brand: "Parker" },
    ],
  },
};

const EXTRA_UNSPLASH_IMAGES: Record<string, string[]> = {
  "dong-ho-trang-suc": [
    "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?q=80&w=600",
    "https://images.unsplash.com/photo-1542496658-e33a6d0d50f6?q=80&w=600",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600",
    "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=600",
    "https://images.unsplash.com/photo-1573408301185-9146fe634ad0?q=80&w=600"
  ],
  "ruou-vang-do-uong": [
    "https://images.unsplash.com/photo-1553184920-f9e045c01b25?q=80&w=600",
    "https://images.unsplash.com/photo-1578985545062-69928b1d9587?q=80&w=600",
    "https://images.unsplash.com/photo-1527018601619-a508a2be00cd?q=80&w=600",
    "https://images.unsplash.com/photo-1569937756430-c45b5d2c5c74?q=80&w=600",
    "https://images.unsplash.com/photo-1584916201218-f4242ceb4809?q=80&w=600"
  ],
  "bat-dong-san": [
    "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?q=80&w=600",
    "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?q=80&w=600",
    "https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?q=80&w=600",
    "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?q=80&w=600",
    "https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=600"
  ],
  "nhac-cu": [
    "https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=600",
    "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=600",
    "https://images.unsplash.com/photo-1552422535-c45813c61732?q=80&w=600",
    "https://images.unsplash.com/photo-1612222869049-d8ec122c66b4?q=80&w=600",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=600"
  ],
  "the-thao-outdoor": [
    "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?q=80&w=600",
    "https://images.unsplash.com/photo-1471506480208-91b3a4cc78be?q=80&w=600",
    "https://images.unsplash.com/photo-1505330622279-bf7d7fc9d8f4?q=80&w=600",
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=600",
    "https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=600"
  ],
  "sach-tai-lieu-quy": [
    "https://images.unsplash.com/photo-1476275466078-4007374efbbe?q=80&w=600",
    "https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=600",
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=600",
    "https://images.unsplash.com/photo-1509021436665-8f07dbf5bf1d?q=80&w=600",
    "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=600"
  ],
  "noi-that-decor": [
    "https://images.unsplash.com/photo-1592078615290-033ee584e267?q=80&w=600",
    "https://images.unsplash.com/photo-1505691938895-1758d7feb511?q=80&w=600",
    "https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=600",
    "https://images.unsplash.com/photo-1595428774223-ef52624120d2?q=80&w=600",
    "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?q=80&w=600"
  ],
  "may-anh-ong-kinh": [
    "https://images.unsplash.com/photo-1512790182412-b19e6d62bc39?q=80&w=600",
    "https://images.unsplash.com/photo-1502982720700-bfff97f2ecac?q=80&w=600",
    "https://images.unsplash.com/photo-1617005082133-548c4dd27f35?q=80&w=600",
    "https://images.unsplash.com/photo-1620802657476-8800dc051d95?q=80&w=600",
    "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=600"
  ],
  "do-choi-mo-hinh": [
    "https://images.unsplash.com/photo-1585366119957-e5733f3c6396?q=80&w=600",
    "https://images.unsplash.com/photo-1531589172605-e320f721d03e?q=80&w=600",
    "https://images.unsplash.com/photo-1606813907291-d86efa9b94db?q=80&w=600",
    "https://images.unsplash.com/photo-1594787318286-3d835c1d207f?q=80&w=600",
    "https://images.unsplash.com/photo-1472457897821-70d3819a0e24?q=80&w=600"
  ],
  "dien-thoai-may-tinh-bang": [
    "https://images.unsplash.com/photo-1565849906661-ca9608c0c478?q=80&w=600",
    "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?q=80&w=600",
    "https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?q=80&w=600",
    "https://images.unsplash.com/photo-1580910051390-a521440263f3?q=80&w=600",
    "https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?q=80&w=600"
  ],
  "laptop-may-vi-tinh": [
    "https://images.unsplash.com/photo-1593642632823-8f785ba67e45?q=80&w=600",
    "https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?q=80&w=600",
    "https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?q=80&w=600",
    "https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?q=80&w=600",
    "https://images.unsplash.com/photo-1542751371-adc38448a05e?q=80&w=600"
  ],
  "hang-hieu-do-xa-xi": [
    "https://images.unsplash.com/photo-1566150905458-1bf1fc15a490?q=80&w=600",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600",
    "https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=600",
    "https://images.unsplash.com/photo-1614252335133-c901e18d61cc?q=80&w=600",
    "https://images.unsplash.com/photo-1598532163257-ae3c6b2524b6?q=80&w=600"
  ],
  "dien-gia-dung": [
    "https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600",
    "https://images.unsplash.com/photo-1581092921461-eab62e97a780?q=80&w=600",
    "https://images.unsplash.com/photo-1621972750749-0fbb1abb7736?q=80&w=600",
    "https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?q=80&w=600",
    "https://images.unsplash.com/photo-1585238342024-78d387f4a707?q=80&w=600"
  ],
  "cong-nghe": [
    "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=600",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?q=80&w=600",
    "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?q=80&w=600",
    "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?q=80&w=600",
    "https://images.unsplash.com/photo-1545454675-3531b543be5d?q=80&w=600"
  ],
  "thoi-trang-phu-kien": [
    "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=600",
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?q=80&w=600",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600",
    "https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=80&w=600"
  ],
  "co-vat-suu-tam": [
    "https://images.unsplash.com/photo-1501700493788-fa1a4fc9fe62?q=80&w=600",
    "https://images.unsplash.com/photo-1572945281869-8733d7458ab9?q=80&w=600",
    "https://images.unsplash.com/photo-1584790870736-b42907474402?q=80&w=600",
    "https://images.unsplash.com/photo-1447069387593-a5de0862481e?q=80&w=600",
    "https://images.unsplash.com/photo-1590073844006-33379778ae09?q=80&w=600"
  ],
  "xe-co": [
    "https://images.unsplash.com/photo-1558981806-ec527fa84c39?q=80&w=600",
    "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=600",
    "https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?q=80&w=600",
    "https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?q=80&w=600"
  ],
  "khac": [
    "https://images.unsplash.com/photo-1513201099705-a9746e1e201f?q=80&w=600",
    "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?q=80&w=600",
    "https://images.unsplash.com/photo-1583209814683-c023de294402?q=80&w=600"
  ]
};

// Pricing Helper
function roundToNiceNumber(value: number): number {
  if (value >= 1000000000) {
    return Math.round(value / 10000000) * 10000000;
  }
  if (value >= 10000000) {
    return Math.round(value / 1000000) * 1000000;
  }
  if (value >= 1000000) {
    return Math.round(value / 100000) * 100000;
  }
  return Math.round(value / 10000) * 10000;
}

async function main() {
  console.log("🚀 Starting database cleanup for mock records...");
  
  // Find all mock users
  const mockUsers = await prisma.user.findMany({
    where: {
      email: {
        endsWith: "@mock.cocofly.vn",
      },
    },
    select: { id: true },
  });
  const mockUserIds = mockUsers.map(u => u.id);

  if (mockUserIds.length > 0) {
    // 1. Get all mock auction IDs first
    const mockAuctions = await prisma.auction.findMany({
      where: {
        sellerId: { in: mockUserIds },
      },
      select: { id: true },
    });
    const mockAuctionIds = mockAuctions.map(a => a.id);

    // 2. Delete audit logs of mock users
    const deletedAuditLogs = await prisma.auditLog.deleteMany({
      where: {
        actorId: { in: mockUserIds },
      },
    });
    console.log(`🧹 Deleted ${deletedAuditLogs.count} mock audit logs.`);

    // 3. Delete payments first due to foreign keys
    const deletedPayments = await prisma.payment.deleteMany({
      where: {
        OR: [
          { buyerId: { in: mockUserIds } },
          { sellerId: { in: mockUserIds } },
          { auctionId: { in: mockAuctionIds } }
        ]
      }
    });
    console.log(`🧹 Deleted ${deletedPayments.count} mock payments.`);

    // 4. Delete bids referencing mock bidders or mock auctions
    const deletedBids = await prisma.bid.deleteMany({
      where: {
        OR: [
          { bidderId: { in: mockUserIds } },
          { auctionId: { in: mockAuctionIds } }
        ]
      },
    });
    console.log(`🧹 Deleted ${deletedBids.count} mock bids.`);

    // 5. Delete watchers
    const deletedWatchers = await prisma.auctionWatcher.deleteMany({
      where: {
        OR: [
          { userId: { in: mockUserIds } },
          { auctionId: { in: mockAuctionIds } }
        ]
      },
    });
    console.log(`🧹 Deleted ${deletedWatchers.count} mock watchers.`);

    // 6. Delete notifications
    const deletedNotifications = await prisma.notification.deleteMany({
      where: {
        OR: [
          { userId: { in: mockUserIds } },
          { auctionId: { in: mockAuctionIds } }
        ]
      },
    });
    console.log(`🧹 Deleted ${deletedNotifications.count} mock notifications.`);

    // 7. Delete direct messages of mock users
    const deletedDMs = await prisma.directMessage.deleteMany({
      where: {
        senderId: { in: mockUserIds },
      },
    });
    console.log(`🧹 Deleted ${deletedDMs.count} mock direct messages.`);

    // 8. Delete pinned auctions
    const deletedPins = await prisma.pinnedAuction.deleteMany({
      where: {
        OR: [
          { userId: { in: mockUserIds } },
          { auctionId: { in: mockAuctionIds } }
        ]
      },
    });
    console.log(`🧹 Deleted ${deletedPins.count} mock pinned auctions.`);

    // 9. Delete auctions first before items (due to onDelete: Restrict on Item)
    const deletedAuctions = await prisma.auction.deleteMany({
      where: {
        id: { in: mockAuctionIds },
      },
    });
    console.log(`🧹 Deleted ${deletedAuctions.count} mock auctions.`);

    // 10. Delete items (which will cascade to item_media)
    const deletedItems = await prisma.item.deleteMany({
      where: {
        sellerId: { in: mockUserIds },
      },
    });
    console.log(`🧹 Deleted ${deletedItems.count} mock items and their media.`);

    // 11. Delete mock users
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        id: { in: mockUserIds },
      },
    });
    console.log(`🧹 Deleted ${deletedUsers.count} mock user accounts.`);
  }

  console.log("👥 Creating mock accounts...");

  const passwordHash = await bcrypt.hash("Password@123", 12);
  
  // Create 5 mock sellers
  const sellers = [];
  for (let i = 1; i <= 5; i++) {
    const seller = await prisma.user.create({
      data: {
        email: `seller${i}@mock.cocofly.vn`,
        passwordHash,
        fullName: `Nhà Bán Sưu Tầm #${i}`,
        phone: `09012345${i}1`,
        bio: `Chuyên mua bán và trao đổi cổ vật, đồng hồ hiệu và đồ sưu tầm cao cấp thế hệ #${i}.`,
        role: UserRole.seller,
        accountStatus: AccountStatus.active,
      },
    });
    sellers.push(seller);
  }
  console.log(`👥 Created 5 Mock Sellers.`);

  // Create 10 mock buyers
  const buyers = [];
  for (let i = 1; i <= 10; i++) {
    const buyer = await prisma.user.create({
      data: {
        email: `buyer${i}@mock.cocofly.vn`,
        passwordHash,
        fullName: `Người Mua Giả Lập #${i}`,
        phone: `09087654${i}2`,
        role: UserRole.buyer,
        accountStatus: AccountStatus.active,
        balance: 100000000, // 100M VND starting balance for bidding
      },
    });
    buyers.push(buyer);
  }
  console.log(`👥 Created 10 Mock Buyers.`);

  // Fetch active categories
  console.log("🏷️ Fetching active categories...");
  const categories = await prisma.category.findMany({
    where: { isActive: true },
  });

  if (categories.length === 0) {
    throw new Error("No active categories found! Please seed default categories first via `npm run seed`.");
  }
  console.log(`🏷️ Found ${categories.length} active categories.`);

  const now = new Date();

  // Create 200 Auctions
  console.log("🔨 Seeding 200 clean test auctions...");
  
  let activeCreated = 0;
  let scheduledCreated = 0;

  for (let i = 0; i < 200; i++) {
    const seller = sellers[i % sellers.length];
    const category = categories[i % categories.length];

    // Resolve config, fallback to "khac" if category slug not found
    let config = CATEGORY_CONFIGS[category.slug];
    if (!config) {
      // Find one config that matches category.slug or use fallback "khac"
      const matchedKey = Object.keys(CATEGORY_CONFIGS).find(k => category.slug.includes(k) || k.includes(category.slug));
      config = matchedKey ? CATEGORY_CONFIGS[matchedKey] : CATEGORY_CONFIGS["khac"];
    }

    const prodIndex = Math.floor(i / categories.length) % config.products.length;
    const prodDef = config.products[prodIndex];

    const batchNum = Math.floor(i / (categories.length * config.products.length)) + 1;
    const itemTitle = `${prodDef.title} (Lô #${batchNum})`;

    const imageIndex = Math.floor(i / categories.length) % config.cdnUrls.length;
    let cdnUrl = config.cdnUrls[imageIndex];
    if (batchNum > 1) {
      const extraList = EXTRA_UNSPLASH_IMAGES[category.slug] || EXTRA_UNSPLASH_IMAGES["khac"];
      cdnUrl = extraList[prodIndex % extraList.length];
    }

    // 1. Create Item
    const item = await prisma.item.create({
      data: {
        sellerId: seller.id,
        categoryId: category.id,
        title: itemTitle,
        description: `Sản phẩm cao cấp ${itemTitle}. ${prodDef.description} Hàng nguyên bản, được giám định đầy đủ, thích hợp cho việc mua sắm hoặc đấu giá sưu tầm.`,
        condition: ItemCondition.like_new,
        status: ItemStatus.in_auction,
        brand: prodDef.brand,
        location: "TP. Hồ Chí Minh, Việt Nam",
      },
    });

    // 2. Create Item Media
    await prisma.itemMedia.create({
      data: {
        itemId: item.id,
        uploaderId: seller.id,
        type: "image",
        purpose: "thumbnail",
        storageKey: `mock_key_${item.id}`,
        cdnUrl: cdnUrl,
        processStatus: "ready",
      },
    });

    // Compute pricing
    const startingPriceRaw = config.startingPriceMin + Math.random() * (config.startingPriceMax - config.startingPriceMin);
    const startingPrice = roundToNiceNumber(startingPriceRaw);

    const buyoutPriceRaw = startingPrice * (1.5 + Math.random() * 2);
    const hasBuyout = Math.random() > 0.15; // 85% of auctions have a buyout price
    const buyoutPrice = hasBuyout ? roundToNiceNumber(buyoutPriceRaw) : null;

    const bidIncrement = config.bidIncrement;

    // Timing and status
    let status: AuctionStatus;
    let scheduledStart: Date;
    let startTime: Date | null;
    let endTime: Date;

    if (i < 140) {
      // Active (Ongoing) Auctions
      status = AuctionStatus.active;
      scheduledStart = new Date(now.getTime() - 24 * 60 * 60 * 1000); // started 1 day ago
      startTime = scheduledStart;

      if (i < 3) {
        // Special end time at 19:30 today
        const today1930 = new Date();
        today1930.setHours(19, 30, 0, 0);
        endTime = today1930;
      } else if (i < 40) {
        // Spaced bi-hourly within the next 24 hours
        endTime = new Date(now.getTime() + (i - 2) * 40 * 60 * 1000);
      } else if (i < 90) {
        // Spaced over 2 to 5 days
        endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000 + (i - 39) * 2 * 60 * 60 * 1000);
      } else {
        // Spaced over 1 to 4 weeks
        endTime = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000 + (i - 89) * 8 * 60 * 60 * 1000);
      }
      activeCreated++;
    } else {
      // Upcoming (Scheduled) Auctions
      status = AuctionStatus.scheduled;
      startTime = null; // scheduled haven't started yet

      const index = i - 140;
      if (index < 20) {
        // Start in 1 day
        scheduledStart = new Date(now.getTime() + 24 * 60 * 60 * 1000 + index * 30 * 60 * 1000);
      } else if (index < 40) {
        // Start in 3 days
        scheduledStart = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000 + (index - 20) * 30 * 60 * 1000);
      } else {
        // Start in 1 week
        scheduledStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + (index - 40) * 30 * 60 * 1000);
      }
      endTime = new Date(scheduledStart.getTime() + 3 * 24 * 60 * 60 * 1000); // 3 days duration
      scheduledCreated++;
    }

    // 3. Create Auction
    await prisma.auction.create({
      data: {
        itemId: item.id,
        sellerId: seller.id,
        startingPrice: startingPrice,
        currentPrice: startingPrice,
        buyoutPrice: buyoutPrice,
        bidIncrement: bidIncrement,
        auctionType: AuctionType.english,
        status: status,
        scheduledStart: scheduledStart,
        startTime: startTime,
        endTime: endTime,
        autoExtend: true,
        autoExtendMinutes: 5,
        autoExtendThreshold: 5,
      },
    });
  }

  console.log(`\n🎉 Seed completed successfully!`);
  console.log(`  - Total Auctions created: 200`);
  console.log(`    * Active: ${activeCreated}`);
  console.log(`    * Scheduled: ${scheduledCreated}`);
  console.log(`  - 5 Mock Sellers and 10 Mock Buyers created with password "Password@123"`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
