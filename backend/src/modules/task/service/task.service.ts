import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Task } from '@prisma/client';
import { config } from '../../../config/server';
import { TaskRepository } from '../repository/task.repository';
import {
  CreateTaskDto,
  UpdateTaskDto,
  LoginTaskDto,
  ChangePasswordDto,
  GetTasksQueryDto,
  TaskResponseDto,
} from '../dto/task.dto';
import {
  NotFoundError,
  ConflictError,
  AuthenticationError,
  ValidationError,
} from '../../../utils/error-handler';

export class TaskService {
  private taskRepository: TaskRepository;

  constructor() {
    this.taskRepository = new TaskRepository();
  }

  async register(taskData: CreateTaskDto): Promise<{
    task: TaskResponseDto;
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if task already exists
    const existingTask = await this.taskRepository.findByEmail(taskData.email);
    if (existingTask) {
      throw new ConflictError('Task with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(taskData.password, config.BCRYPT_ROUNDS);

    // Create task
    const task = await this.taskRepository.create({
      ...taskData,
      password: hashedPassword,
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(task);

    return {
      task: this.mapToResponseDto(task),
      accessToken,
      refreshToken,
    };
  }

  async createTask(taskData: CreateTaskDto): Promise<TaskResponseDto> {
    // Check if task already exists
    const existingTask = await this.taskRepository.findByEmail(taskData.email);
    if (existingTask) {
      throw new ConflictError('Task with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(taskData.password, config.BCRYPT_ROUNDS);

    // Create task
    const task = await this.taskRepository.create({
      ...taskData,
      password: hashedPassword,
    });

    return this.mapToResponseDto(task);
  }

  async login(credentials: LoginTaskDto): Promise<{
    task: TaskResponseDto;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find task by email
    const task = await this.taskRepository.findByEmail(credentials.email);
    if (!task) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if task is active
    if (!task.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, task.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(task);

    return {
      task: this.mapToResponseDto(task),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(refreshToken: string): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    try {
      const decoded = jwt.verify(refreshToken, config.JWT_REFRESH_SECRET) as any;
      
      // Find task to ensure they still exist and are active
      const task = await this.taskRepository.findById(decoded.id);
      if (!task || !task.isActive) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new tokens
      return this.generateTokens(task);
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async getProfile(taskId: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return this.mapToResponseDto(task);
  }

  async updateProfile(taskId: string, updateData: UpdateTaskDto): Promise<TaskResponseDto> {
    // Check if task exists
    const existingTask = await this.taskRepository.findById(taskId);
    if (!existingTask) {
      throw new NotFoundError('Task not found');
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingTask.email) {
      const emailExists = await this.taskRepository.existsByEmail(updateData.email, taskId);
      if (emailExists) {
        throw new ConflictError('Email is already in use');
      }
    }

    // Update task
    const updatedTask = await this.taskRepository.update(taskId, updateData);
    return this.mapToResponseDto(updatedTask);
  }

  async changePassword(taskId: string, passwordData: ChangePasswordDto): Promise<void> {
    // Find task
    const task = await this.taskRepository.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, task.password);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, config.BCRYPT_ROUNDS);

    // Update password
    await this.taskRepository.updatePassword(taskId, hashedNewPassword);
  }

  async getTasks(query: GetTasksQueryDto): Promise<{
    tasks: TaskResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const result = await this.taskRepository.findMany(query);
    
    return {
      tasks: result.tasks.map(task => this.mapToResponseDto(task)),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  async getTaskById(id: string): Promise<TaskResponseDto> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    return this.mapToResponseDto(task);
  }

  async deleteTask(id: string): Promise<void> {
    const task = await this.taskRepository.findById(id);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    await this.taskRepository.delete(id);
  }

  private generateTokens(task: Task): { accessToken: string; refreshToken: string } {
    const payload = {
      id: task.id,
      email: task.email,
      role: task.role,
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }

  private mapToResponseDto(task: Task): TaskResponseDto {
    const { password, ...taskWithoutPassword } = task;
    return taskWithoutPassword;
  }
} 