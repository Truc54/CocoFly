const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function toSlug(str) {
  return str.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/[^a-z0-9]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

async function seed() {
  const categories = [
    { id: 1, name: "Điện tử", description: "Các thiết bị điện tử", isActive: true },
    { id: 2, name: "Thời trang", description: "Quần áo, phụ kiện", isActive: true },
    { id: 3, name: "Đồ gia dụng", description: "Đồ dùng trong nhà", isActive: true },
    { id: 4, name: "Xe cộ", description: "Ô tô, xe máy", isActive: true },
    { id: 5, name: "Sưu tầm", description: "Đồ cổ, tem", isActive: true },
    { id: 6, name: "Nghệ thuật", description: "Tranh ảnh, điêu khắc", isActive: true },
    { id: 7, name: "Khác", description: "Mọi thứ khác", isActive: true },
  ];

  for (const c of categories) {
    const data = { ...c, slug: toSlug(c.name) };
    await prisma.category.upsert({
      where: { id: c.id },
      update: data,
      create: data,
    });
  }
  console.log("Seeded categories successfully.");
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
