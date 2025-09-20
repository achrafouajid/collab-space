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

  updateTask = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const taskId = req.task!.id;
      const updateData: UpdateTaskDto = req.body;

      const updatedTask = await this.taskService.updateTask(taskId, updateData);
      
      // Update cache
      await this.taskCache.setTask(taskId, updatedTask);

      ResponseUtil.success(res, updatedTask, 'Task updated successfully');
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

} 