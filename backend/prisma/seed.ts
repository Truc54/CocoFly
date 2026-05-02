import { PrismaClient } from '@prisma/client';

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
  console.log(`  ✅ Updated ${updated} existing categories`);

  // 2. Reset autoincrement sequence to max existing id
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('categories', 'id'), (SELECT COALESCE(MAX(id), 0) FROM categories));`
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
  console.log(`  ✅ Created ${created} new categories`);

  // 3. Verify
  const total = await prisma.category.count({ where: { isActive: true } });
  console.log(`\n🎉 Total active categories: ${total}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
