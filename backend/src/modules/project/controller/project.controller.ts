import { Request, Response } from "express";
import { ProjectService } from "../service/project.service";
import { AuthRequest } from "../../../middleware/auth.middleware";
import { ResponseUtil } from "../../../utils/response";

export class ProjectController {
  private projectService = new ProjectService();

  // GET /projects/my-projects
  async getUserProjects(req: AuthRequest, res: Response) {
    try {
      const page = Number(req.query.page) || 1;
      const limit = Number(req.query.limit) || 20;
      const userId = req.user!.id;

      const projects = await this.projectService.getProjectsByUser(userId, { page, limit });

      ResponseUtil.success(res, projects);
    } catch (error: any) {
    }
  }

  // POST /projects
  async createProject(req: AuthRequest, res: Response) {
    try {
      const userId = req.user!.id;
      const projectData = req.body;

      const newProject = await this.projectService.createProject(userId, projectData);

      ResponseUtil.success(res, newProject, "Project created successfully");
    } catch (error: any) {
    }
  }
}
