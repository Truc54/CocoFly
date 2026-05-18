import { PrismaClient, ItemStatus, AuctionStatus } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding 10 active test auctions with buyout prices...");

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
  let category = await prisma.category.findFirst();

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

  // 3. Create 10 Items and 10 Auctions
  const now = new Date();
  
  for (let i = 1; i <= 10; i++) {
    const itemTitle = `Test BuyNow Item ${Date.now()}-${i}`;
    
    // Create the item
    const item = await prisma.item.create({
      data: {
        sellerId: seller.id,
        categoryId: category.id,
        title: itemTitle,
        description: `This is a test item with buyout price created for testing. (#${i})`,
        condition: "new_item",
        status: "in_auction",
        brand: "TestBrand",
        location: "Hanoi, Vietnam",
      },
    });

    const endTime = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

    // Create the auction
    const auction = await prisma.auction.create({
      data: {
        itemId: item.id,
        sellerId: seller.id,
        startingPrice: 50000,
        currentPrice: 50000,
        buyoutPrice: 250000 + (i * 10000), // Buyout price increases slightly for each item
        bidIncrement: 10000,
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

    console.log(`Created Auction ${i}: ${itemTitle} (Buyout: ${auction.buyoutPrice})`);
  }

  console.log("Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
