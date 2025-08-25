import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../service/dashboard.service';
import { ResponseUtil } from '../../../utils/response';
import { AuthRequest } from '../../../middleware/auth.middleware';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getStatistics = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.dashboardService.getStatistics();
      ResponseUtil.success(res, stats, 'Dashboard statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getRecentActivity = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const activities = await this.dashboardService.getRecentActivity(limit);
      ResponseUtil.success(res, activities, 'Recent activities retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
} 