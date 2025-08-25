import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface DashboardStatistics {
  totalUsers: number;
  activeUsers: number;
  newUsersToday: number;
  systemStatus: string;
  totalProducts?: number;
  totalOrders?: number;
}

export interface RecentActivity {
  id: string;
  type: 'user_registered' | 'user_login' | 'user_updated' | 'system_update';
  title: string;
  description: string;
  time: Date;
  userId?: string;
  userName?: string;
}

export class DashboardService {
  async getStatistics(): Promise<DashboardStatistics> {
    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      totalProducts,
      totalOrders
    ] = await Promise.all([
      // Total users
      prisma.user.count(),
      
      // Active users
      prisma.user.count({
        where: { isActive: true }
      }),
      
      // New users today
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0))
          }
        }
      }),
      
      // Total products
      prisma.product.count(),
      
      // Total orders
      prisma.order.count()
    ]);

    return {
      totalUsers,
      activeUsers,
      newUsersToday,
      systemStatus: 'online',
      totalProducts,
      totalOrders,
    };
  }

  async getRecentActivity(limit: number = 10): Promise<RecentActivity[]> {
    // Get recent user registrations
    const recentUsers = await prisma.user.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        email: true,
      }
    });

    // Convert users to activities
    const activities: RecentActivity[] = recentUsers.map(user => ({
      id: `user_${user.id}`,
      type: 'user_registered',
      title: 'New user registered',
      description: `${user.firstName} ${user.lastName} created a new account`,
      time: user.createdAt,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
    }));

    // Add some mock system activities for demonstration
    const systemActivities: RecentActivity[] = [
      {
        id: 'sys_1',
        type: 'system_update',
        title: 'System maintenance',
        description: 'Database optimization completed successfully',
        time: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      },
      {
        id: 'sys_2',
        type: 'system_update',
        title: 'Security update',
        description: 'Security patches applied to the system',
        time: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      }
    ];

    // Combine and sort all activities
    const allActivities = [...activities, ...systemActivities]
      .sort((a, b) => b.time.getTime() - a.time.getTime())
      .slice(0, limit);

    return allActivities;
  }
} 