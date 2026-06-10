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
}
