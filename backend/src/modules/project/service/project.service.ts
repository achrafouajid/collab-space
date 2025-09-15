import { PrismaClient } from '@prisma/client';
import { CreateProjectDto, ProjectResponseDto } from '../dto/project.dto';
import { ConflictError } from '@/utils/AppError';
import { ProjectRepository } from '../repository/project.repository';

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
  private projectRepository: ProjectRepository;

  constructor() {
    this.projectRepository = new ProjectRepository();
  }

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

  async createProject(userData: CreateProjectDto): Promise<ProjectResponseDto> {
    const existingProject = await this.projectRepository.findById(projectData.projectId);
    if (existingProject) {
      throw new ConflictError('Project already exists');
    }


    // Create project
    const project = await this.projectRepository.create({
      ...projectData,
    });

    return this.mapToResponseDto(project);
  }
}
