import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User } from '@prisma/client';
import { config } from '../../../config/server';
import { UserRepository } from '../repository/user.repository';
import {
  CreateUserDto,
  UpdateUserDto,
  LoginUserDto,
  ChangePasswordDto,
  GetUsersQueryDto,
  UserResponseDto,
} from '../dto/user.dto';
import {
  NotFoundError,
  ConflictError,
  AuthenticationError,
  ValidationError,
} from '../../../utils/error-handler';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async register(userData: CreateUserDto): Promise<{
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
  }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, config.BCRYPT_ROUNDS);

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    return {
      user: this.mapToResponseDto(user),
      accessToken,
      refreshToken,
    };
  }

  async createUser(userData: CreateUserDto): Promise<UserResponseDto> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, config.BCRYPT_ROUNDS);

    // Create user
    const user = await this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return this.mapToResponseDto(user);
  }

  async login(credentials: LoginUserDto): Promise<{
    user: UserResponseDto;
    accessToken: string;
    refreshToken: string;
  }> {
    // Find user by email
    const user = await this.userRepository.findByEmail(credentials.email);
    if (!user) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
    if (!isPasswordValid) {
      throw new AuthenticationError('Invalid email or password');
    }

    // Generate tokens
    const { accessToken, refreshToken } = this.generateTokens(user);

    return {
      user: this.mapToResponseDto(user),
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
      
      // Find user to ensure they still exist and are active
      const user = await this.userRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Generate new tokens
      return this.generateTokens(user);
    } catch (error) {
      throw new AuthenticationError('Invalid refresh token');
    }
  }

  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapToResponseDto(user);
  }

  async updateProfile(userId: string, updateData: UpdateUserDto): Promise<UserResponseDto> {
    // Check if user exists
    const existingUser = await this.userRepository.findById(userId);
    if (!existingUser) {
      throw new NotFoundError('User not found');
    }

    // Check email uniqueness if email is being updated
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await this.userRepository.existsByEmail(updateData.email, userId);
      if (emailExists) {
        throw new ConflictError('Email is already in use');
      }
    }

    // Update user
    const updatedUser = await this.userRepository.update(userId, updateData);
    return this.mapToResponseDto(updatedUser);
  }

  async changePassword(userId: string, passwordData: ChangePasswordDto): Promise<void> {
    // Find user
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new ValidationError('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, config.BCRYPT_ROUNDS);

    // Update password
    await this.userRepository.updatePassword(userId, hashedNewPassword);
  }

  async getUsers(query: GetUsersQueryDto): Promise<{
    users: UserResponseDto[];
    meta: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const result = await this.userRepository.findMany(query);
    
    return {
      users: result.users.map(user => this.mapToResponseDto(user)),
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    };
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.mapToResponseDto(user);
  }

  async deleteUser(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await this.userRepository.delete(id);
  }

  private generateTokens(user: User): { accessToken: string; refreshToken: string } {
    const payload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN,
    });

    const refreshToken = jwt.sign(payload, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN,
    });

    return { accessToken, refreshToken };
  }

  private mapToResponseDto(user: User): UserResponseDto {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
} 