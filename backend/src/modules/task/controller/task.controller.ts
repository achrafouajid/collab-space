import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../service/task.service';
import { TaskCache } from '../cache/task.cache';
import { ResponseUtil } from '../../../utils/response';
import { AuthRequest } from '../../../middleware/auth.middleware';
import {
  CreateTaskDto,
  LoginTaskDto,
  UpdateTaskDto,
  ChangePasswordDto,
  GetTasksQueryDto,
} from '../dto/task.dto';

export class TaskController {
  private taskService: TaskService;
  private taskCache: TaskCache;

  constructor() {
    this.taskService = new TaskService();
    this.taskCache = new TaskCache();
  }

  // Authentication endpoints
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskData: CreateTaskDto = req.body;
      const result = await this.taskService.register(taskData);

      ResponseUtil.created(res, result, 'Task registered successfully');
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentials: LoginTaskDto = req.body;
      const result = await this.taskService.login(credentials);

      ResponseUtil.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.taskService.refreshToken(refreshToken);

      ResponseUtil.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  // Profile endpoints
  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = req.task!.id;

      // Try to get from cache first
      let task = await this.taskCache.getTask(taskId);
      
      if (!task) {
        task = await this.taskService.getProfile(taskId);
        // Cache the result
        await this.taskCache.setTask(taskId, task);
      }

      ResponseUtil.success(res, task, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = req.task!.id;
      const updateData: UpdateTaskDto = req.body;

      const updatedTask = await this.taskService.updateProfile(taskId, updateData);
      
      // Update cache
      await this.taskCache.setTask(taskId, updatedTask);

      ResponseUtil.success(res, updatedTask, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = req.task!.id;
      const passwordData: ChangePasswordDto = req.body;

      await this.taskService.changePassword(taskId, passwordData);

      ResponseUtil.success(res, undefined, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  };

  // Admin endpoints
  createTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskData: CreateTaskDto = req.body;
      const newTask = await this.taskService.createTask(taskData);

      ResponseUtil.created(res, newTask, 'Task created successfully');
    } catch (error) {
      next(error);
    }
  };

  getTasks = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetTasksQueryDto = req.query as any;
      
      // Create cache key from query
      const cacheKey = JSON.stringify(query);
      
      // Try to get from cache first
      let result = await this.taskCache.getTaskList(cacheKey);
      
      if (!result) {
        result = await this.taskService.getTasks(query);
        // Cache the result
        await this.taskCache.setTaskList(cacheKey, result);
      }

      ResponseUtil.success(res, result.tasks, 'Tasks retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  getTaskById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Try to get from cache first
      let task = await this.taskCache.getTask(id);
      
      if (!task) {
        task = await this.taskService.getTaskById(id);
        // Cache the result
        await this.taskCache.setTask(id, task);
      }

      ResponseUtil.success(res, task, 'Task retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteTask = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await this.taskService.deleteTask(id);
      
      // Clear cache
      await this.taskCache.clearTaskCaches(id);

      ResponseUtil.success(res, undefined, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  // Utility endpoint
  checkEmailAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email } = req.query;
      
      if (!email || typeof email !== 'string') {
        ResponseUtil.badRequest(res, 'Email parameter is required');
        return;
      }

      // This would typically use the repository directly for a simple check
      const isAvailable = !(await this.taskService['taskRepository'].existsByEmail(email));

      ResponseUtil.success(res, { available: isAvailable }, 'Email availability checked');
    } catch (error) {
      next(error);
    }
  };
} 