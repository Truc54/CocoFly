import { AuctionService } from './src/services/auction.service';

const service = new AuctionService();

async function test() {
  const auctionId = 'db657740-bf81-4d16-a829-6b16f9f8bb61';
  const userId = '1fdae343-b917-423c-9944-7902fc9e97b8';
  
  const status = await service.getUserBidStatus(auctionId, userId);
  console.log('Status for user:', status);
}

test();
