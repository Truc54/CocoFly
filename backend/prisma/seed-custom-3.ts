import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Locating active seller...");
  let seller = await prisma.user.findFirst({
    where: { role: "seller", accountStatus: "active" },
  });

  if (!seller) {
    console.log("No active seller found. Creating one...");
    seller = await prisma.user.create({
      data: {
        email: "mock-seller-" + Date.now() + "@example.com",
        fullName: "Mock Seller",
        role: "seller",
        accountStatus: "active",
      },
    });
  }

  console.log("Locating active category...");
  let category = await prisma.category.findFirst({
    where: { isActive: true },
  });

  if (!category) {
    console.log("No category found. Creating one...");
    category = await prisma.category.create({
      data: {
        name: "Test Category",
        slug: "test-category-" + Date.now(),
      },
    });
  }

  // Target end time: 19:30:00 today (Vietnam Time Zone offset +07:00)
  const targetEndTime = new Date();
  targetEndTime.setHours(19, 30, 0, 0);

  console.log(`Target End Time: ${targetEndTime.toString()} (${targetEndTime.toISOString()})`);

  const titles = [
    "Đồng hồ Rolex Submariner Premium",
    "Rượu vang Chateau Margaux 2015",
    "Máy ảnh Leica M11 Classic Edition",
  ];

  const cdnUrls = [
    "https://images.unsplash.com/photo-1547996160-81dfa63595aa?q=80&w=600",
    "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?q=80&w=600",
    "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600",
  ];

  console.log("Creating 3 buyout auctions ending at 19:30...");

  for (let i = 0; i < 3; i++) {
    const item = await prisma.item.create({
      data: {
        sellerId: seller.id,
        categoryId: category.id,
        title: titles[i],
        description: `Đây là sản phẩm đấu giá cao cấp ${titles[i]} phục vụ mục đích kiểm thử các tính năng mua ngay và thông báo toàn cục.`,
        condition: "like_new",
        status: "in_auction",
        brand: "PremiumBrand",
        location: "TP. Hồ Chí Minh",
      },
    });

    // Create item media record for thumbnail display
    await prisma.itemMedia.create({
      data: {
        itemId: item.id,
        uploaderId: seller.id,
        type: "image",
        purpose: "thumbnail",
        storageKey: `mock_storage_${item.id}`,
        cdnUrl: cdnUrls[i],
        processStatus: "ready",
      },
    });

    const auction = await prisma.auction.create({
      data: {
        itemId: item.id,
        sellerId: seller.id,
        startingPrice: 1000000,
        currentPrice: 1000000,
        buyoutPrice: 5000000 + i * 1000000,
        bidIncrement: 100000,
        auctionType: "english",
        status: "active",
        scheduledStart: new Date(),
        startTime: new Date(),
        endTime: targetEndTime,
        autoExtend: true,
        autoExtendMinutes: 5,
        autoExtendThreshold: 5,
      },
    });

    console.log(`✅ Created auction: "${titles[i]}" with buyout price ${auction.buyoutPrice} ending at ${targetEndTime.toString()}`);
  }

  console.log("Successfully seeded 3 custom test auctions.");
}

main()
  .catch((e) => {
    console.error("Error seeding custom auctions:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
