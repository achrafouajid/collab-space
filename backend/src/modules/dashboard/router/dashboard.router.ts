import { Router } from 'express';
import { DashboardController } from '../controller/dashboard.controller';
import { authenticateToken } from '../../../middleware/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

/**
 * @swagger
 * /dashboard/statistics:
 *   get:
 *     summary: Get dashboard statistics
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalUsers:
 *                       type: number
 *                     activeUsers:
 *                       type: number
 *                     newUsersToday:
 *                       type: number
 *                     systemStatus:
 *                       type: string
 *                     totalProducts:
 *                       type: number
 *                     totalOrders:
 *                       type: number
 *       401:
 *         description: Unauthorized
 */
router.get('/statistics', authenticateToken, dashboardController.getStatistics);

/**
 * @swagger
 * /dashboard/activity:
 *   get:
 *     summary: Get recent activity
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of activities to return
 *     responses:
 *       200:
 *         description: Recent activities retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/activity', authenticateToken, dashboardController.getRecentActivity);

export default router; 