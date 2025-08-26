
export interface SyncMetadata {
    lastModified: Date;
    version: number;
    checksum?: string;
  }
  
  export interface SyncRecord {
    id: string;
    entityType: string;
    entityId: string;
    action: 'CREATE' | 'UPDATE' | 'DELETE';
    data: any;
    timestamp: Date;
    userId: string;
    version: number;
  }
  
  export interface SyncToken {
    userId: string;
    lastSyncTimestamp: Date;
    entityVersions: Record<string, number>;
  }
  
  export interface PullRequest {
    lastSyncTimestamp?: string;
    entityTypes?: string[];
    limit?: number;
  }
  
  export interface PullResponse {
    records: SyncRecord[];
    syncToken: SyncToken;
    hasMore: boolean;
    serverTimestamp: Date;
  }
  
  export interface PushRequest {
    records: SyncRecord[];
    syncToken: SyncToken;
  }
  
  export interface PushResponse {
    accepted: string[];
    rejected: Array<{
      id: string;
      reason: string;
      conflictData?: any;
    }>;
    syncToken: SyncToken;
    serverTimestamp: Date;
  }
  
  export interface ConflictResolution {
    recordId: string;
    strategy: 'SERVER_WINS' | 'CLIENT_WINS' | 'MERGE';
    mergedData?: any;
  }
  
  export interface SyncStatus {
    userId: string;
    lastSyncTimestamp: Date;
    pendingChanges: number;
    isOnline: boolean;
    syncInProgress: boolean;
  }
  
  export enum SyncEntityType {
    USER = 'user',
    TASK = 'task',
    PROJECT = 'project',
    MESSAGE = 'message',
    FILE = 'file'
  }
  
  export interface EntitySyncConfig {
    entityType: SyncEntityType;
    tableName: string;
    includes?: string[];
    excludeFields?: string[];
    softDelete?: boolean;
  }