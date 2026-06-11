import { Request, Response } from 'express';
import { AdminService } from '../services/admin.service';

export class AdminController {
  private adminService = new AdminService();

  // ── Dashboard Endpoints ────────────────────────────────────────────────────────────
  async getDashboardStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await this.adminService.getDashboardStats();
      res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDashboardRevenue(req: Request, res: Response): Promise<void> {
    try {
      const period = (req.query.period as 'day' | 'week' | 'month') || 'day';
      const revenue = await this.adminService.getDashboardRevenue(period);
      res.status(200).json({ success: true, data: revenue });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getDashboardActivity(req: Request, res: Response): Promise<void> {
    try {
      const activity = await this.adminService.getDashboardActivity();
      res.status(200).json({ success: true, data: activity });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── Phase 2: User Management Endpoints ─────────────────────────────────────────────
  async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, search, role, status } = req.query;
      const result = await this.adminService.getUsers({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        search: search as string,
        role: role as string,
        status: status as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const user = await this.adminService.getUserById(id);
      res.status(200).json({ success: true, data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async banUser(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { reason } = req.body;
      const actorId = (req as any).user?.userId;
      if (!actorId) {
        res.status(401).json({ success: false, message: 'Chưa xác thực' });
        return;
      }
      const user = await this.adminService.banUser(actorId, id, reason);
      res.status(200).json({ success: true, message: 'Đã khóa tài khoản thành công', data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async unbanUser(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const actorId = (req as any).user?.userId;
      if (!actorId) {
        res.status(401).json({ success: false, message: 'Chưa xác thực' });
        return;
      }
      const user = await this.adminService.unbanUser(actorId, id);
      res.status(200).json({ success: true, message: 'Đã kích hoạt lại tài khoản thành công', data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async changeRole(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const { role } = req.body;
      const actorId = (req as any).user?.userId;
      if (!actorId) {
        res.status(401).json({ success: false, message: 'Chưa xác thực' });
        return;
      }
      const user = await this.adminService.changeUserRole(actorId, id, role);
      res.status(200).json({ success: true, message: 'Đã thay đổi vai trò người dùng thành công', data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async resetStrikes(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const actorId = (req as any).user?.userId;
      if (!actorId) {
        res.status(401).json({ success: false, message: 'Chưa xác thực' });
        return;
      }
      const user = await this.adminService.resetUserStrikes(actorId, id);
      res.status(200).json({ success: true, message: 'Đã reset số gậy vi phạm thành công', data: user });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  // ── Phase 2: Auction Management Endpoints ──────────────────────────────────────────
  async getAuctions(req: Request, res: Response): Promise<void> {
    try {
      const { page, limit, status, search } = req.query;
      const result = await this.adminService.getAuctions({
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
        status: status as string,
        search: search as string,
      });
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async getAuctionById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const auction = await this.adminService.getAuctionById(id);
      res.status(200).json({ success: true, data: auction });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async forceEnd(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const actorId = (req as any).user?.userId;
      if (!actorId) {
        res.status(401).json({ success: false, message: 'Chưa xác thực' });
        return;
      }
      const result = await this.adminService.forceEndAuction(actorId, id);
      res.status(200).json({ success: true, message: 'Đã buộc kết thúc đấu giá thành công', data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id as string;
      const actorId = (req as any).user?.userId;
      if (!actorId) {
        res.status(401).json({ success: false, message: 'Chưa xác thực' });
        return;
      }
      const result = await this.adminService.cancelAuction(actorId, id);
      res.status(200).json({ success: true, message: 'Đã hủy phiên đấu giá thành công', data: result });
    } catch (error: any) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
}
