export interface AuctionMedia {
  id: string;
  cdnUrl: string;
  sortOrder: number;
  type: string;
}

export interface AuctionSeller {
  id: string;
  fullName: string;
  avatarUrl: string | null;
  rating: number;
}

export interface BidEntry {
  id: string;
  amount: number;
  createdAt: string;
  bidder: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface AuctionDetail {
  id: string;
  status: string;
  auctionType: string;
  title: string;
  description: string;
  condition: string;
  brand: string | null;
  location: string | null;
  category: { id: number; name: string } | null;
  media: AuctionMedia[];
  currentPrice: number;
  startingPrice: number;
  buyoutPrice: number | null;
  bidIncrement: number;
  scheduledStart: string;
  endTime: string;
  autoExtend: boolean;
  autoExtendMinutes: number | null;
  autoExtendThreshold: number | null;
  totalBids: number;
  totalWatchers: number;
  chatRoomId: string | null;
  seller: AuctionSeller | null;
  recentBids: BidEntry[];
}

export interface RelatedAuction {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  category: { id: number; name: string } | null;
  currentPrice: number;
  endTime: string;
  totalBids: number;
  totalWatchers: number;
}
