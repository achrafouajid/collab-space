import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../service/auth.service';
import { ResponseUtil } from '../../../utils/response';
import { RegisterDto, LoginDto } from '../dto/auth.dto';
import { AuthRequest } from '../../../middleware/auth.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userData: RegisterDto = req.body;
      const result = await this.authService.register(userData);

      ResponseUtil.created(res, result, 'User registered successfully');
    } catch (error) {
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const credentials: LoginDto = req.body;
      const result = await this.authService.login(credentials);

      ResponseUtil.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = req.token;
      if (token) {
        await this.authService.logout(token);
      }

      ResponseUtil.success(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  };
} 