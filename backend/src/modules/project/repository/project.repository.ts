import prisma from "../../../config/prisma";
import { CreateProjectDto } from "../dto/project.dto";

export class ProjectRepository {
  async findProjectsByUser(userId: string) {
    return prisma.project.findMany({
      where: { assignments: { some: { userId } } },
      include: { assignments: { include: { user: true } }, tasks: true },
    });
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    return prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        dueDate: dto.dueDate,
        assignments: {
          create: { userId, role: "OWNER" }, // creator is OWNER
        },
      },
    });
  }
}
