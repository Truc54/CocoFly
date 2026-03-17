/**
 * Repository Layer:
 * Responsible ONLY for database queries and interactions (e.g., using Prisma).
 * Acts as an abstraction layer between the database queries and business logic.
 * The Service layer shouldn't know HOW to query the DB, just what to ask.
 */
export class AuctionRepository {

  public async create(data: any): Promise<string> {
    // Basic DB creation logic
    // prisma.auction.create({ data })
    return 'new-auction-id';
  }

  public async saveBid(auctionId: string, bidData: any): Promise<void> {
    // prisma.bid.create({ data: { ... }})
  }

  public async findById(id: string): Promise<any> {
    // Return raw data from Postgres. Does NO formatting.
    // prisma.auction.findUnique({ where: { id }})
    return null;
  }
}
