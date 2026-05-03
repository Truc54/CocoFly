const { PrismaClient, AuctionStatus } = require('@prisma/client');
const p = new PrismaClient();

async function test() {
  try {
    const result = await p.auction.findMany({
      where: {
        status: AuctionStatus.active,
        item: { title: { startsWith: 'a', mode: 'insensitive' } },
      },
      select: {
        id: true,
        currentPrice: true,
        scheduledStart: true,
        status: true,
        item: {
          select: {
            title: true,
            media: { where: { sortOrder: 0 }, take: 1, select: { cdnUrl: true } },
          },
        },
      },
      take: 3,
    });
    console.log('SUCCESS:', JSON.stringify(result, null, 2));
  } catch (e) {
    console.error('ERROR:', e.message);
    console.error('STACK:', e.stack);
  } finally {
    await p.$disconnect();
  }
}

test();
