import { PrismaClient } from '@prisma/client';

export interface ProjectsQueryParams {
  page: number;
  limit: number;
}

export interface ProjectsResponse {
  projects: any[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class ProjectService {
  private prisma = new PrismaClient();

  async getProjectsByUser(userId: string, { page, limit }: ProjectsQueryParams): Promise<ProjectsResponse> {
    const skip = (page - 1) * limit;

    const total = await this.prisma.projectAssignment.count({
      where: { userId },
    });

    const assignments = await this.prisma.projectAssignment.findMany({
      where: { userId },
      skip,
      take: limit,
      include: {
        project: true, 
      },
      orderBy: {
        project: { createdAt: 'desc' },
      },
    });

    const projects = assignments.map((a) => a.project);

    const totalPages = Math.ceil(total / limit);

    return {
      projects,
      meta: { page, limit, total, totalPages },
    };
  }
}
