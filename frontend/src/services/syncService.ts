import { offlineDB } from '../utils/db';

interface SyncRecord {
  id: string;
  entityType: string;
  entityId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  data: any;
  timestamp: string;
  version: number;
}

interface PullResponse {
  records: SyncRecord[];
  syncToken: {
    userId: string;
    lastSyncTimestamp: Date;
    entityVersions: Record<string, number>;
  };
  hasMore: boolean;
  serverTimestamp: Date;
}

interface PushResponse {
  accepted: string[];
  rejected: Array<{
    id: string;
    reason: string;
    conflictData?: any;
  }>;
  syncToken: {
    userId: string;
    lastSyncTimestamp: Date;
    entityVersions: Record<string, number>;
  };
  serverTimestamp: Date;
}

interface ConflictResolution {
  recordId: string;
  strategy: 'SERVER_WINS' | 'CLIENT_WINS' | 'MERGE';
  mergedData?: any;
}

class SyncService {
  private baseUrl = '/api/v1/sync';

  private async fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    const token = localStorage.getItem('token');
    
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
        ...options.headers,
      },
    });
  }

  async pullChanges(lastSyncTimestamp?: string): Promise<PullResponse> {
    try {
      const params = new URLSearchParams();
      if (lastSyncTimestamp) {
        params.append('lastSyncTimestamp', lastSyncTimestamp);
      }
      params.append('limit', '100');

      const response = await this.fetchWithAuth(`${this.baseUrl}/pull?${params}`);
      
      if (!response.ok) {
        throw new Error(`Pull failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Apply pulled changes to local database
      for (const record of result.data.records) {
        await this.applyServerChange(record);
      }

      return result.data;
    } catch (error) {
      console.error('Failed to pull changes:', error);
      throw error;
    }
  }

  async pushChanges(records: any[]): Promise<PushResponse> {
    try {
      const syncToken = await this.getSyncToken();
      
      const pushData = {
        records: records.map(record => ({
          id: record.id,
          entityType: record.entityType,
          entityId: record.entityId,
          action: record.action,
          data: record.data,
          timestamp: record.timestamp,
          version: 1 // Simplified versioning
        })),
        syncToken
      };

      const response = await this.fetchWithAuth(`${this.baseUrl}/push`, {
        method: 'POST',
        body: JSON.stringify(pushData),
      });

      if (!response.ok) {
        throw new Error(`Push failed: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Update sync token
      await this.storeSyncToken(result.data.syncToken);

      return result.data;
    } catch (error) {
      console.error('Failed to push changes:', error);
      throw error;
    }
  }

  async resolveConflict(resolution: ConflictResolution): Promise<void> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/resolve-conflict`, {
        method: 'POST',
        body: JSON.stringify(resolution),
      });

      if (!response.ok) {
        throw new Error(`Conflict resolution failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      throw error;
    }
  }

  async getSyncStatus(): Promise<any> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/status`);
      
      if (!response.ok) {
        throw new Error(`Failed to get sync status: ${response.statusText}`);
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error('Failed to get sync status:', error);
      throw error;
    }
  }

  private async applyServerChange(record: SyncRecord): Promise<void> {
    try {
      const { entityType, entityId, action, data } = record;

      switch (entityType) {
        case 'task':
          await this.applyTaskChange(entityId, action, data);
          break;
        case 'project':
          await this.applyProjectChange(entityId, action, data);
          break;
        case 'message':
          await this.applyMessageChange(entityId, action, data);
          break;
        default:
          console.warn(`Unknown entity type: ${entityType}`);
      }
    } catch (error) {
      console.error('Failed to apply server change:', error);
      throw error;
    }
  }

  private async applyTaskChange(entityId: string, action: string, data: any): Promise<void> {
    switch (action) {
      case 'CREATE':
      case 'UPDATE':
        const taskData = {
          id: entityId,
          ...data,
          syncStatus: 'synced' as const,
          lastSyncedAt: new Date().toISOString()
        };
        await offlineDB.update('tasks', taskData);
        break;
      case 'DELETE':
        await offlineDB.delete('tasks', entityId);
        break;
    }
  }

  private async applyProjectChange(entityId: string, action: string, data: any): Promise<void> {
    switch (action) {
      case 'CREATE':
      case 'UPDATE':
        const projectData = {
          id: entityId,
          ...data,
          syncStatus: 'synced' as const,
          lastSyncedAt: new Date().toISOString()
        };
        await offlineDB.update('projects', projectData);
        break;
      case 'DELETE':
        await offlineDB.delete('projects', entityId);
        break;
    }
  }

  private async applyMessageChange(entityId: string, action: string, data: any): Promise<void> {
    switch (action) {
      case 'CREATE':
      case 'UPDATE':
        const messageData = {
          id: entityId,
          ...data,
          syncStatus: 'synced' as const,
          lastSyncedAt: new Date().toISOString()
        };
        await offlineDB.update('messages', messageData);
        break;
      case 'DELETE':
        await offlineDB.delete('messages', entityId);
        break;
    }
  }

  private async getSyncToken(): Promise<any> {
    const token = await offlineDB.getMetadata('syncToken');
    if (token) {
      return token;
    }

    // Generate initial sync token
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    return {
      userId: user?.id || '',
      lastSyncTimestamp: new Date(0),
      entityVersions: {}
    };
  }

  private async storeSyncToken(token: any): Promise<void> {
    await offlineDB.setMetadata('syncToken', token);
  }

  async getServerTimestamp(): Promise<Date> {
    try {
      const response = await this.fetchWithAuth(`${this.baseUrl}/timestamp`);
      
      if (!response.ok) {
        throw new Error(`Failed to get server timestamp: ${response.statusText}`);
      }

      const result = await response.json();
      return new Date(result.data.timestamp);
    } catch (error) {
      console.error('Failed to get server timestamp:', error);
      return new Date(); // Fallback to local time
    }
  }
}

export const syncService = new SyncService();