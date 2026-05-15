import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const auction = await prisma.auction.findUnique({
    where: { id: 'db657740-bf81-4d16-a829-6b16f9f8bb61' },
    select: { bidIncrement: true }
  });
  console.log(auction);
}

check().finally(() => prisma.$disconnect());
