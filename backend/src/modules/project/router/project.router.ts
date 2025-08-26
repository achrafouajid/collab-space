import { Router } from "express";
import { ProjectController } from "../controller/project.controller";
import { authenticateToken } from "../../../middleware/auth.middleware";
import { validateRequest } from "../../../middleware/validation.middleware";
import { createProjectSchema } from "../dto/project.dto";

const router = Router();
const controller = new ProjectController();

/**
 * @route   GET /projects/my-projects
 * @desc    Get all projects assigned to the logged-in user
 * @access  Private
 */
router.get(
  "/my-projects",
  authenticateToken,
  controller.getUserProjects.bind(controller)
);

/**
 * @route   POST /projects
 * @desc    Create a new project
 * @access  Private
 */
router.post(
  "/",
  authenticateToken,
  validateRequest({ body: createProjectSchema }),
  controller.createProject.bind(controller)
);

export default router;
