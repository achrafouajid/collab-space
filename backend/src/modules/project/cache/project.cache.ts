import redisClient from '../../../config/redis';
import { ProjectResponseDto } from '../dto/project.dto';

export class ProjectCache {
  private readonly PROJECT_KEY_PREFIX = 'project:';
  private readonly PROJECT_LIST_KEY_PREFIX = 'projects:';
  private readonly TTL = 3600;

  private getProjectKey(id: string): string {
    return `${this.PROJECT_KEY_PREFIX}${id}`;
  }

  private getProjectListKey(query: string): string {
    return `${this.PROJECT_LIST_KEY_PREFIX}${query}`;
  }

  async getProject(id: string): Promise<ProjectResponseDto | null> {
    try {
      const cached = await redisClient.get(this.getProjectKey(id));
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Error getting project from cache:', error);
      return null;
    }
  }

  async setProject(id: string, project: ProjectResponseDto): Promise<void> {
    try {
      await redisClient.set(
        this.getProjectKey(id),
        JSON.stringify(project),
        this.TTL
      );
    } catch (error) {
      console.error('Error setting project in cache:', error);
    }
  }

  async getProjectList(query: string): Promise<any | null> {
    try {
      const cached = await redisClient.get(this.getProjectListKey(query));
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      console.error('Error getting project list from cache:', error);
      return null;
    }
  }

  async setProjectList(query: string, data: any): Promise<void> {
    try {
      await redisClient.set(
        this.getProjectListKey(query),
        JSON.stringify(data),
        this.TTL
      );
    } catch (error) {
      console.error('Error setting project list in cache:', error);
    }
  }

  async deleteProject(id: string): Promise<void> {
    try {
      await redisClient.del(this.getProjectKey(id));
      // Also clear project list caches
      await this.clearProjectListCaches();
    } catch (error) {
      console.error('Error deleting project from cache:', error);
    }
  }

  async clearProjectCaches(id?: string): Promise<void> {
    try {
      if (id) {
        await redisClient.del(this.getProjectKey(id));
      }
      await this.clearProjectListCaches();
    } catch (error) {
      console.error('Error clearing project caches:', error);
    }
  }

  private async clearProjectListCaches(): Promise<void> {
    try {
      // Get all project list keys and delete them
      const client = redisClient.getClient();
      const keys = await client.keys(`${this.PROJECT_LIST_KEY_PREFIX}*`);
      if (keys.length > 0) {
        await client.del(keys);
      }
    } catch (error) {
      console.error('Error clearing project list caches:', error);
    }
  }
} 