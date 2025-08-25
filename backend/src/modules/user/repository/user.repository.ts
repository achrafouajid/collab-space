import { User, Prisma } from '@prisma/client';
import prisma from '../../../config/prisma';
import { CreateUserDto, UpdateUserDto, GetUsersQueryDto } from '../dto/user.dto';

export class UserRepository {
  async create(data: CreateUserDto & { password: string }): Promise<User> {
    return await prisma.user.create({
      data,
    });
  }

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  async findMany(query: GetUsersQueryDto): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page || 1;
    const limit = Math.min(query.limit || 10, 100); // Max 100 items per page
    const skip = (page - 1) * limit;

    // Build where clause
    const where: Prisma.UserWhereInput = {};

    if (query.search) {
      where.OR = [
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.role) {
      where.role = query.role;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, data: UpdateUserDto): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  async updatePassword(id: string, hashedPassword: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { password: hashedPassword },
    });
  }

  async delete(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async hardDelete(id: string): Promise<User> {
    return await prisma.user.delete({
      where: { id },
    });
  }

  async exists(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    return !!user;
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const where: Prisma.UserWhereInput = { email };
    
    if (excludeId) {
      where.NOT = { id: excludeId };
    }

    const user = await prisma.user.findFirst({
      where,
      select: { id: true },
    });
    
    return !!user;
  }
} 