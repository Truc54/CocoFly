import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBids() {
  const auctions = await prisma.auction.findMany({
    select: { id: true, currentPrice: true }
  });

  for (const a of auctions) {
    const bids = await prisma.bid.findMany({
      where: { auctionId: a.id },
      orderBy: { createdAt: 'desc' }
    });
    
    console.log(`\nAuction: ${a.id} - ${bids.length} bids. CurrentPrice: ${a.currentPrice}`);
    for (const b of bids) {
      console.log(`  Bid: ${b.id} | Amount: ${b.amount} | Auto: ${b.isAutoBid} | By: ${b.bidderId}`);
    }
  }
}

checkBids().then(() => prisma.$disconnect());
