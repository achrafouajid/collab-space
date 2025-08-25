import { Request, Response, NextFunction } from 'express';
import { UserService } from '../service/user.service';
import { UserCache } from '../cache/user.cache';
import { ResponseUtil } from '../../../utils/response';
import { AuthRequest } from '../../../middleware/auth.middleware';
import {
  CreateUserDto,
  LoginUserDto,
  UpdateUserDto,
  ChangePasswordDto,
  GetUsersQueryDto,
} from '../dto/user.dto';

export class UserController {
  private userService: UserService;
  private userCache: UserCache;

  constructor() {
    this.userService = new UserService();
    this.userCache = new UserCache();
  }

  // Authentication endpoints
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body;
      const result = await this.userService.register(userData);

      ResponseUtil.created(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentials: LoginUserDto = req.body;
      const result = await this.userService.login(credentials);

      ResponseUtil.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { refreshToken } = req.body;
      const result = await this.userService.refreshToken(refreshToken);

      ResponseUtil.success(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  };

  // Profile endpoints
  getProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;

      // Try to get from cache first
      let user = await this.userCache.getUser(userId);
      
      if (!user) {
        user = await this.userService.getProfile(userId);
        // Cache the result
        await this.userCache.setUser(userId, user);
      }

      ResponseUtil.success(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const updateData: UpdateUserDto = req.body;

      const updatedUser = await this.userService.updateProfile(userId, updateData);
      
      // Update cache
      await this.userCache.setUser(userId, updatedUser);

      ResponseUtil.success(res, updatedUser, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  };

  changePassword = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = req.user!.id;
      const passwordData: ChangePasswordDto = req.body;

      await this.userService.changePassword(userId, passwordData);

      ResponseUtil.success(res, undefined, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  };

  // Admin endpoints
  createUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: CreateUserDto = req.body;
      const newUser = await this.userService.createUser(userData);

      ResponseUtil.created(res, newUser, 'User created successfully');
    } catch (error) {
      next(error);
    }
  };

  getUsers = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query: GetUsersQueryDto = req.query as any;
      
      // Create cache key from query
      const cacheKey = JSON.stringify(query);
      
      // Try to get from cache first
      let result = await this.userCache.getUserList(cacheKey);
      
      if (!result) {
        result = await this.userService.getUsers(query);
        // Cache the result
        await this.userCache.setUserList(cacheKey, result);
      }

      ResponseUtil.success(res, result.users, 'Users retrieved successfully', 200, result.meta);
    } catch (error) {
      next(error);
    }
  };

  getUserById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      // Try to get from cache first
      let user = await this.userCache.getUser(id);
      
      if (!user) {
        user = await this.userService.getUserById(id);
        // Cache the result
        await this.userCache.setUser(id, user);
      }

      ResponseUtil.success(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  deleteUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;

      await this.userService.deleteUser(id);
      
      // Clear cache
      await this.userCache.clearUserCaches(id);

      ResponseUtil.success(res, undefined, 'User deleted successfully');
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
      const isAvailable = !(await this.userService['userRepository'].existsByEmail(email));

      ResponseUtil.success(res, { available: isAvailable }, 'Email availability checked');
    } catch (error) {
      next(error);
    }
  };
} 