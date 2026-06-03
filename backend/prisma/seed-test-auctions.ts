import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning up previous test auctions and items...");
  
  // Clean up existing test auctions/items to avoid duplicates/errors
  const testItems = await prisma.item.findMany({
    where: {
      title: {
        startsWith: "Test Auction Item",
      },
    },
    select: { id: true },
  });

  const testItemIds = testItems.map((item) => item.id);

  if (testItemIds.length > 0) {
    // Delete related auctions first due to foreign keys
    const deletedAuctions = await prisma.auction.deleteMany({
      where: {
        itemId: { in: testItemIds },
      },
    });
    console.log(`Deleted ${deletedAuctions.count} existing test auctions.`);

    // Delete items
    const deletedItems = await prisma.item.deleteMany({
      where: {
        id: { in: testItemIds },
      },
    });
    console.log(`Deleted ${deletedItems.count} existing test items.`);
  }

  // 1. Get or create a seller
  let seller = await prisma.user.findFirst({
    where: { role: "seller" },
  });

  if (!seller) {
    seller = await prisma.user.create({
      data: {
        email: "test-seller-" + Date.now() + "@example.com",
        fullName: "Test Seller",
        role: "seller",
        accountStatus: "active",
      },
    });
    console.log("Created test seller:", seller.email);
  } else {
    console.log("Using existing seller:", seller.email);
  }

  // 2. Get or create a category
  let category = await prisma.category.findFirst({
    where: { isActive: true },
  });

  if (!category) {
    category = await prisma.category.create({
      data: {
        name: "Test Category",
        slug: "test-category-" + Date.now(),
      },
    });
    console.log("Created test category:", category.name);
  } else {
    console.log("Using existing category:", category.name);
  }

  const now = new Date();

  // 3. Seed 15 Ongoing (Active) Auctions
  console.log("Seeding 15 active (ongoing) test auctions...");
  for (let i = 1; i <= 15; i++) {
    const itemTitle = `Test Auction Item (Ongoing) #${i}`;
    
    const item = await prisma.item.create({
      data: {
        sellerId: seller.id,
        categoryId: category.id,
        title: itemTitle,
        description: `This is a mock ongoing auction item #${i} for testing purposes.`,
        condition: "good",
        status: "in_auction",
        brand: "MockBrand",
        location: "Ho Chi Minh City, Vietnam",
      },
    });

    // End time is in the future: from 1 day to 7 days from now
    const endTime = new Date(now.getTime() + i * 12 * 60 * 60 * 1000); 

    await prisma.auction.create({
      data: {
        itemId: item.id,
        sellerId: seller.id,
        startingPrice: 100000,
        currentPrice: 100000,
        buyoutPrice: 500000 + (i * 20000),
        bidIncrement: 20000,
        auctionType: "english",
        status: "active",
        scheduledStart: now,
        startTime: now,
        endTime: endTime,
        autoExtend: true,
        autoExtendMinutes: 5,
        autoExtendThreshold: 5,
      },
    });

    console.log(`  - Created active auction: "${itemTitle}" (Ends at: ${endTime.toISOString()})`);
  }

  // 4. Seed 5 Upcoming (Scheduled) Auctions
  console.log("Seeding 5 upcoming (scheduled) test auctions...");
  for (let i = 1; i <= 5; i++) {
    const itemTitle = `Test Auction Item (Upcoming) #${i}`;

    const item = await prisma.item.create({
      data: {
        sellerId: seller.id,
        categoryId: category.id,
        title: itemTitle,
        description: `This is a mock upcoming/scheduled auction item #${i} for testing purposes.`,
        condition: "like_new",
        status: "in_auction",
        brand: "MockBrand",
        location: "Hanoi, Vietnam",
      },
    });

    // Start time is in the future: from 1 to 5 days from now
    const scheduledStart = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
    // End time is 3 days after start time
    const endTime = new Date(scheduledStart.getTime() + 3 * 24 * 60 * 60 * 1000);

    await prisma.auction.create({
      data: {
        itemId: item.id,
        sellerId: seller.id,
        startingPrice: 200000,
        currentPrice: 200000,
        buyoutPrice: 1000000 + (i * 50000),
        bidIncrement: 50000,
        auctionType: "english",
        status: "scheduled",
        scheduledStart: scheduledStart,
        startTime: null, // Scheduled auctions haven't started yet
        endTime: endTime,
        autoExtend: true,
        autoExtendMinutes: 5,
        autoExtendThreshold: 5,
      },
    });

    console.log(`  - Created scheduled auction: "${itemTitle}" (Starts at: ${scheduledStart.toISOString()})`);
  }

  console.log("Seeding complete successfully! Generated 20 auctions total.");
}

main()
  .catch((e) => {
    console.error("Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

