import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkBids() {
  const bids = await prisma.bid.findMany({
    where: { auctionId: 'db657740-bf81-4d16-a829-6b16f9f8bb61' },
    orderBy: { createdAt: 'desc' }
  });
  
  for (const b of bids) {
    console.log(`Bid: ${b.id} | Amount: ${b.amount} | Created: ${b.createdAt.toISOString()}`);
  }
}

checkBids().then(() => prisma.$disconnect());
