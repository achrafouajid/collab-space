import redisClient from '../../../config/redis';
import { TaskResponseDto } from '../dto/task.dto';

export class TaskCache {
  private readonly TASK_KEY_PREFIX = 'task:';
  private readonly TASK_LIST_KEY_PREFIX = 'tasks:';
  private readonly TTL = 3600;

  private getTaskKey(id: string): string {
    return `${this.TASK_KEY_PREFIX}${id}`;
  }

  private getTaskListKey(query: string): string {
    return `${this.TASK_LIST_KEY_PREFIX}${query}`;
  }

  async getTask(id: string): Promise<TaskResponseDto | null> {
    try {
      const cached = await redisClient.get(this.getTaskKey(id));
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Error getting task from cache:', error);
      return null;
    }
  }

  async setTask(id: string, task: TaskResponseDto): Promise<void> {
    try {
      await redisClient.set(
        this.getTaskKey(id),
        JSON.stringify(task),
        this.TTL
      );
    } catch (error) {
      console.error('Error setting task in cache:', error);
    }
  }

  async getTaskList(query: string): Promise<any | null> {
    try {
      const cached = await redisClient.get(this.getTaskListKey(query));
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Error getting task list from cache:', error);
      return null;
    }
  }

  async setTaskList(query: string, data: any): Promise<void> {
    try {
      await redisClient.set(
        this.getTaskListKey(query),
        JSON.stringify(data),
        this.TTL
      );
    } catch (error) {
      console.error('Error setting task list in cache:', error);
    }
  }

  async deleteTask(id: string): Promise<void> {
    try {
      await redisClient.del(this.getTaskKey(id));
      // Also clear task list caches
      await this.clearTaskListCaches();
    } catch (error) {
      console.error('Error deleting task from cache:', error);
    }
  }

  async clearTaskCaches(id?: string): Promise<void> {
    try {
      if (id) {
        await redisClient.del(this.getTaskKey(id));
      }
      await this.clearTaskListCaches();
    } catch (error) {
      console.error('Error clearing task caches:', error);
    }
  }

  private async clearTaskListCaches(): Promise<void> {
    try {
      // Get all task list keys and delete them
      const client = redisClient.getClient();
      const keys = await client.keys(`${this.TASK_LIST_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Error clearing task list caches:', error);
    }
  }
} 