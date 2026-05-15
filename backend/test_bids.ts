import prisma from './src/config/prisma';

async function main() {
  // Find auction with bids
  const auction = await prisma.auction.findFirst({
    where: { totalBids: { gt: 0 } },
    orderBy: { updatedAt: 'desc' },
    select: { id: true, status: true, totalBids: true },
  });

  if (!auction) {
    console.log("No auctions with bids found.");
    return;
  }

  console.log("Auction:", auction);

  const bids = await prisma.bid.findMany({
    where: { auctionId: auction.id },
    orderBy: { createdAt: 'desc' },
    take: 10,
    select: {
      id: true,
      amount: true,
      isAutoBid: true,
      maxAutoBid: true,
      createdAt: true,
      bidder: { select: { id: true, fullName: true } },
    },
  });

  console.log("Raw DB bids:");
  for (const b of bids) {
    console.log(`  ${b.bidder.fullName} | amount=${b.amount} | isAutoBid=${b.isAutoBid} | maxAutoBid=${b.maxAutoBid}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
