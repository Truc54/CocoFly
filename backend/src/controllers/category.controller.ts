import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

export class CategoryController {
  async getCategories(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
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
        },
      });

      res.json({ success: true, data: categories });
    } catch (error) {
      next(error);
    }
  }
}
