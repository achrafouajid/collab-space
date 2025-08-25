import redisClient from '../../../config/redis';
import { UserResponseDto } from '../dto/user.dto';

export class UserCache {
  private readonly USER_KEY_PREFIX = 'user:';
  private readonly USER_LIST_KEY_PREFIX = 'users:';
  private readonly TTL = 3600; // 1 hour in seconds

  private getUserKey(id: string): string {
    return `${this.USER_KEY_PREFIX}${id}`;
  }

  private getUserListKey(query: string): string {
    return `${this.USER_LIST_KEY_PREFIX}${query}`;
  }

  async getUser(id: string): Promise<UserResponseDto | null> {
    try {
      const cached = await redisClient.get(this.getUserKey(id));
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Error getting user from cache:', error);
      return null;
    }
  }

  async setUser(id: string, user: UserResponseDto): Promise<void> {
    try {
      await redisClient.set(
        this.getUserKey(id),
        JSON.stringify(user),
        this.TTL
      );
    } catch (error) {
      console.error('Error setting user in cache:', error);
    }
  }

  async getUserList(query: string): Promise<any | null> {
    try {
      const cached = await redisClient.get(this.getUserListKey(query));
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Error getting user list from cache:', error);
      return null;
    }
  }

  async setUserList(query: string, data: any): Promise<void> {
    try {
      await redisClient.set(
        this.getUserListKey(query),
        JSON.stringify(data),
        this.TTL
      );
    } catch (error) {
      console.error('Error setting user list in cache:', error);
    }
  }

  async deleteUser(id: string): Promise<void> {
    try {
      await redisClient.del(this.getUserKey(id));
      // Also clear user list caches
      await this.clearUserListCaches();
    } catch (error) {
      console.error('Error deleting user from cache:', error);
    }
  }

  async clearUserCaches(id?: string): Promise<void> {
    try {
      if (id) {
        await redisClient.del(this.getUserKey(id));
      }
      await this.clearUserListCaches();
    } catch (error) {
      console.error('Error clearing user caches:', error);
    }
  }

  private async clearUserListCaches(): Promise<void> {
    try {
      // Get all user list keys and delete them
      const client = redisClient.getClient();
      const keys = await client.keys(`${this.USER_LIST_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Error clearing user list caches:', error);
    }
  }
} 