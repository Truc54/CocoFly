import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

export class CategoryController {
  async getCategories(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const isFeatured = req.query.featured === 'true';
      let data;

      if (isFeatured) {
        // Run optimized database-level JOIN and GROUP BY using Postgres Raw SQL
        data = await prisma.$queryRaw<any[]>`
          SELECT 
            c.id, 
            c.name, 
            c.slug, 
            c.description, 
            c.icon_url as "iconUrl", 
            c.parent_id as "parentId",
            c.sort_order as "sortOrder",
            COALESCE(COUNT(a.id)::int, 0) as "activeAuctionsCount"
          FROM categories c
          LEFT JOIN items i ON i.category_id = c.id
          LEFT JOIN auctions a ON a.item_id = i.id AND a.status::text = 'active'
          WHERE c.is_active = true
          GROUP BY c.id
          ORDER BY "activeAuctionsCount" DESC, c.sort_order ASC;
        `;
      } else {
        const categories = await prisma.category.findMany({
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            iconUrl: true,
            parentId: true,
            sortOrder: true,
          },
        });

        // Get count of active auctions per category for general list consistency
        const activeAuctions = await prisma.auction.findMany({
          where: { status: 'active' },
          select: {
            item: {
              select: {
                categoryId: true,
              },
            },
          },
        });

        const counts: Record<number, number> = {};
        activeAuctions.forEach((auction) => {
          if (auction.item) {
            const catId = auction.item.categoryId;
            counts[catId] = (counts[catId] || 0) + 1;
          }
        });

        data = categories.map((cat) => ({
          ...cat,
          activeAuctionsCount: counts[cat.id] || 0,
        }));
      }

      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
