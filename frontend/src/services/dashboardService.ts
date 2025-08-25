import api, { ApiResponse, DashboardStats, Activity } from './api';

class DashboardService {
  // Get dashboard statistics
  async getStatistics(): Promise<DashboardStats> {
    try {
      const response = await api.get<ApiResponse<DashboardStats>>('/dashboard/statistics');
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch statistics');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch statistics';
      throw new Error(message);
    }
  }

  // Get recent activities
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    try {
      const response = await api.get<ApiResponse<Activity[]>>(`/dashboard/activity?limit=${limit}`);
      
      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch activities');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch activities';
      throw new Error(message);
    }
  }
}

// Export singleton instance
export const dashboardService = new DashboardService();
export default dashboardService; 