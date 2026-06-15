import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Update existing categories (match by slug)
const EXISTING_UPDATES = [
  { slug: 'cong-nghe', update: { iconUrl: 'devices', sortOrder: 1 } },
  { slug: 'thoi-trang-phu-kien', update: { iconUrl: 'checkroom', sortOrder: 2 } },
  { slug: 'co-vat-suu-tam', update: { iconUrl: 'account_balance', sortOrder: 3 } },
  { slug: 'nghe-thuat', update: { iconUrl: 'palette', sortOrder: 4 } },
  // Rename/update "Xe cộ" → "Xe & Phương tiện"
  { slug: 'xe-co', update: { name: 'Xe & Phương tiện', description: 'Ô tô, xe máy, xe đạp và phụ tùng', iconUrl: 'directions_car', sortOrder: 5 } },
  // Deactivate "Sưu tầm" (duplicate of "Cổ vật & Sưu tầm")
  { slug: 'suu-tam', update: { isActive: false } },
  // Update "Khác"
  { slug: 'khac', update: { description: 'Các sản phẩm khác', iconUrl: 'dashboard_customize', sortOrder: 99 } },
];

// New categories to add
const NEW_CATEGORIES = [
  { name: 'Đồng hồ & Trang sức', slug: 'dong-ho-trang-suc', description: 'Đồng hồ cao cấp, nhẫn, vòng, dây chuyền', iconUrl: 'watch', sortOrder: 6 },
  { name: 'Rượu vang & Đồ uống', slug: 'ruou-vang-do-uong', description: 'Rượu vang, whisky, rượu sưu tầm', iconUrl: 'wine_bar', sortOrder: 7 },
  { name: 'Bất động sản', slug: 'bat-dong-san', description: 'Nhà, đất, căn hộ đấu giá', iconUrl: 'home_work', sortOrder: 8 },
  { name: 'Nhạc cụ', slug: 'nhac-cu', description: 'Guitar, piano, violin và nhạc cụ khác', iconUrl: 'piano', sortOrder: 9 },
  { name: 'Thể thao & Outdoor', slug: 'the-thao-outdoor', description: 'Dụng cụ thể thao, camping, đồ dã ngoại', iconUrl: 'fitness_center', sortOrder: 10 },
  { name: 'Sách & Tài liệu quý', slug: 'sach-tai-lieu-quy', description: 'Sách hiếm, bản thảo, tài liệu cổ', iconUrl: 'menu_book', sortOrder: 11 },
  { name: 'Nội thất & Decor', slug: 'noi-that-decor', description: 'Bàn ghế, đèn, đồ trang trí nội thất', iconUrl: 'chair', sortOrder: 12 },
  { name: 'Máy ảnh & Ống kính', slug: 'may-anh-ong-kinh', description: 'Máy ảnh, ống kính, phụ kiện nhiếp ảnh', iconUrl: 'photo_camera', sortOrder: 13 },
  { name: 'Đồ chơi & Mô hình', slug: 'do-choi-mo-hinh', description: 'Mô hình, figure, đồ chơi sưu tầm', iconUrl: 'toys', sortOrder: 14 },
];

// Default System Configurations
const SYSTEM_CONFIGS = [
  { key: 'platform_fee_rate', value: '5', description: 'Tỷ lệ phí nền tảng (%)' },
  { key: 'payment_timeout_hours', value: '48', description: 'Thời hạn thanh toán của người mua (giờ)' },
  { key: 'auto_confirm_days', value: '7', description: 'Thời gian tự động xác nhận đã nhận hàng kể từ khi giao hàng (ngày)' },
  { key: 'max_active_listings', value: '10', description: 'Giới hạn số phiên đấu giá đang hoạt động tối đa cho mỗi người bán' },
  { key: 'new_account_bid_limit', value: '5000000', description: 'Giới hạn số tiền đặt giá tối đa cho tài khoản mới chưa xác minh số điện thoại (VND)' },
  { key: 'seller_shipping_deadline_days', value: '5', description: 'Hạn cuối để người bán gửi hàng đi kể từ khi thanh toán hoàn tất (ngày)' },
  { key: 'max_non_payment_strikes', value: '3', description: 'Số lần vi phạm thanh toán (gậy) tối đa trước khi tài khoản bị tự động khóa' },
];

async function main() {
  console.log('🌱 Seeding categories...');

  // 1. Update existing categories
  let updated = 0;
  for (const item of EXISTING_UPDATES) {
    const result = await prisma.category.updateMany({
      where: { slug: item.slug },
      data: item.update,
    });
    updated += result.count;
  }
  console.log(`  Category: Updated ${updated} existing categories`);

  // 2. Reset autoincrement sequence to max existing id
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT COALESCE(MAX(id), 1) FROM categories));`
  );

  // 3. Create new categories (skip if slug already exists)
  let created = 0;
  for (const cat of NEW_CATEGORIES) {
    const exists = await prisma.category.findUnique({ where: { slug: cat.slug } });
    if (!exists) {
      await prisma.category.create({ data: cat });
      created++;
    }
  }
  console.log(`  Category: Created ${created} new categories`);

  // 4. Seed Admin user
  console.log('🌱 Seeding Admin User...');
  const adminEmail = 'admin@cocofly.vn';
  const adminExists = await prisma.user.findUnique({ where: { email: adminEmail } });

  if (!adminExists) {
    const passwordHash = await bcrypt.hash('Admin@12345', 12);
    const adminUser = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        fullName: 'CocoFly Admin',
        role: 'admin',
        accountStatus: 'active',
      },
    });
    console.log(`  User: Created admin account: ${adminEmail} (password: Admin@12345)`);
  } else {
    // Force role to admin if it was created differently
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: 'admin', accountStatus: 'active' },
    });
    console.log(`  User: Admin account already exists: ${adminEmail}`);
  }

  // 5. Seed System Configurations
  console.log('🌱 Seeding System Configurations...');
  let configsCreated = 0;
  let configsUpdated = 0;

  for (const config of SYSTEM_CONFIGS) {
    const exists = await prisma.systemConfig.findUnique({ where: { key: config.key } });
    if (!exists) {
      await prisma.systemConfig.create({ data: config });
      configsCreated++;
    } else {
      await prisma.systemConfig.update({
        where: { key: config.key },
        data: { description: config.description }, // update description in case it changed
      });
      configsUpdated++;
    }
  }
  console.log(`  Config: Created ${configsCreated}, Updated ${configsUpdated} system config keys`);

  console.log('\n🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
