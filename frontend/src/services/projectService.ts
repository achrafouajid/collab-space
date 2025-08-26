import api, { ApiResponse } from './api';

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
  progress: number;
  dueDate: string;
  metrics: {
    completed: number;
    inProgress: number;
    overdue: number;
  };
  team: { id: string; firstName: string; lastName: string }[];
}

export interface CreateProjectData {
  name: string;
  description: string;
  status?: 'PLANNING' | 'IN_PROGRESS' | 'COMPLETED';
  dueDate: string;
}

export interface ProjectsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}

export interface ProjectsResponse {
  projects: Project[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

class ProjectService {
  // Fetch projects assigned to the logged-in user
  async getUserProjects(params: ProjectsQueryParams = {}): Promise<ProjectsResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params.page) queryParams.append('page', params.page.toString());
      if (params.limit) queryParams.append('limit', params.limit.toString());
      if (params.search) queryParams.append('search', params.search);
      if (params.status) queryParams.append('status', params.status);

      const token = localStorage.getItem('accessToken');

      const response = await api.get<ApiResponse<Project[]>>(`/projects/my-projects?${queryParams.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data) {
        return {
            projects: response.data.data,
            meta: {
              page: params.page !== undefined ? params.page : 1,
              limit: params.limit !== undefined ? params.limit : 20,
              total: response.data.meta?.total ?? response.data.data.length,
              totalPages: response.data.meta?.totalPages ?? 1,
            },
          };
      } else {
        throw new Error(response.data.message || 'Failed to fetch projects');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch projects';
      throw new Error(message);
    }
  }

  // Create a new project
  async createProject(projectData: CreateProjectData): Promise<Project> {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await api.post<ApiResponse<Project>>('/projects', projectData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to create project');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to create project';
      throw new Error(message);
    }
  }

  // Get project by ID
  async getProjectById(id: string): Promise<Project> {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await api.get<ApiResponse<Project>>(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to fetch project');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to fetch project';
      throw new Error(message);
    }
  }

  // Update project
  async updateProject(id: string, projectData: Partial<CreateProjectData>): Promise<Project> {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await api.put<ApiResponse<Project>>(`/projects/${id}`, projectData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success && response.data.data) {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update project');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to update project';
      throw new Error(message);
    }
  }

  // Delete project
  async deleteProject(id: string): Promise<void> {
    try {
      const token = localStorage.getItem('accessToken');

      const response = await api.delete<ApiResponse>(`/projects/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete project');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || error.message || 'Failed to delete project';
      throw new Error(message);
    }
  }
}

// Export singleton instance
export const projectService = new ProjectService();
export default projectService;
