import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import {
  SyncRecord,
  SyncToken,
  PullRequest,
  PullResponse,
  PushRequest,
  PushResponse,
  ConflictResolution,
  SyncEntityType,
  EntitySyncConfig,
  SyncStatus
} from '../types/sync.types';

export class SyncService {
  private prisma: PrismaClient;
  private entityConfigs: Map<SyncEntityType, EntitySyncConfig>;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.entityConfigs = new Map();
    this.initializeEntityConfigs();
  }

  private initializeEntityConfigs(): void {
    this.entityConfigs.set(SyncEntityType.USER, {
      entityType: SyncEntityType.USER,
      tableName: 'user',
      excludeFields: ['password', 'refreshToken'],
    });

    this.entityConfigs.set(SyncEntityType.TASK, {
      entityType: SyncEntityType.TASK,
      tableName: 'task',
      includes: ['assignee', 'project'],
    });

    this.entityConfigs.set(SyncEntityType.PROJECT, {
      entityType: SyncEntityType.PROJECT,
      tableName: 'project',
      includes: ['members'],
    });

  }

 
  private generateChecksum(data: any): string {
    const content = JSON.stringify(data);
    return crypto.createHash('md5').update(content).digest('hex');
  }


  private async createSyncToken(userId: string): Promise<SyncToken> {
    const lastSyncTimestamp = new Date();
    
    const entityVersions: Record<string, number> = {};
    
    for (const [entityType] of this.entityConfigs) {
      const latestRecord = await this.prisma.syncLog.findFirst({
        where: {
          entityType: entityType,
          userId: userId,
        },
        orderBy: {
          version: 'desc',
        },
      });
      
      entityVersions[entityType] = latestRecord?.version || 0;
    }

    return {
      userId,
      lastSyncTimestamp,
      entityVersions,
    };
  }

 
  async pullData(userId: string, request: PullRequest): Promise<PullResponse> {
    const {
      lastSyncTimestamp,
      entityTypes = Array.from(this.entityConfigs.keys()),
      limit = 100,
    } = request;

    const records: SyncRecord[] = [];
    const since = lastSyncTimestamp ? new Date(lastSyncTimestamp) : new Date(0);

    for (const entityType of entityTypes) {
      const config = this.entityConfigs.get(entityType as SyncEntityType);
      if (!config) continue;

      const syncRecords = await this.prisma.syncLog.findMany({
        where: {
          entityType: entityType,
          timestamp: {
            gt: since,
          },
          userId: {
            not: userId,
          },
        },
        orderBy: {
          timestamp: 'asc',
        },
        take: limit,
      });

      for (const syncRecord of syncRecords) {
        let entityData = null;

        if (syncRecord.action !== 'DELETE') {
          entityData = await this.getEntityData(
            config.tableName,
            syncRecord.entityId,
            config
          );
        }

        records.push({
          id: syncRecord.id,
          entityType: syncRecord.entityType,
          entityId: syncRecord.entityId,
          action: syncRecord.action as any,
          data: entityData,
          timestamp: syncRecord.timestamp,
          userId: syncRecord.userId,
          version: syncRecord.version,
        });
      }
    }

    const syncToken = await this.createSyncToken(userId);
    
    return {
      records,
      syncToken,
      hasMore: records.length === limit,
      serverTimestamp: new Date(),
    };
  }

  // Push data changes to server
   
  async pushData(userId: string, request: PushRequest): Promise<PushResponse> {
    const { records, syncToken } = request;
    const accepted: string[] = [];
    const rejected: Array<{ id: string; reason: string; conflictData?: any }> = [];

    for (const record of records) {
      try {
        const conflict = await this.detectConflict(record, syncToken);
        
        if (conflict) {
          rejected.push({
            id: record.id,
            reason: 'CONFLICT',
            conflictData: conflict,
          });
          continue;
        }

        await this.applyChange(record, userId);

        await this.logSyncRecord(record, userId);
        
        accepted.push(record.id);
      } catch (error) {
        rejected.push({
          id: record.id,
          reason: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
        });
      }
    }

    const newSyncToken = await this.createSyncToken(userId);

    return {
      accepted,
      rejected,
      syncToken: newSyncToken,
      serverTimestamp: new Date(),
    };
  }

  // Get entity data with configuration

  private async getEntityData(
    tableName: string,
    entityId: string,
    config: EntitySyncConfig
  ): Promise<any> {
    const model = (this.prisma as any)[tableName];
    if (!model) throw new Error(`Model ${tableName} not found`);

    const includeOptions: any = {};
    if (config.includes) {
      config.includes.forEach(include => {
        includeOptions[include] = true;
      });
    }

    const data = await model.findUnique({
      where: { id: entityId },
      include: Object.keys(includeOptions).length > 0 ? includeOptions : undefined,
    });

    if (data && config.excludeFields) {
      config.excludeFields.forEach(field => {
        delete data[field];
      });
    }

    return data;
  }

  // Detect conflicts with server data
 
  private async detectConflict(
    record: SyncRecord,
    syncToken: SyncToken
  ): Promise<any> {
    const config = this.entityConfigs.get(record.entityType as SyncEntityType);
    if (!config) return null;

    const latestSyncRecord = await this.prisma.syncLog.findFirst({
      where: {
        entityType: record.entityType,
        entityId: record.entityId,
      },
      orderBy: {
        version: 'desc',
      },
    });

    const serverVersion = latestSyncRecord?.version || 0;
    const clientVersion = syncToken.entityVersions[record.entityType] || 0;

    if (serverVersion > clientVersion) {
      const serverData = await this.getEntityData(
        config.tableName,
        record.entityId,
        config
      );

      return {
        serverVersion,
        clientVersion,
        serverData,
        clientData: record.data,
      };
    }

    return null;
  }

  // Apply change to database

  private async applyChange(record: SyncRecord, userId: string): Promise<void> {
    const config = this.entityConfigs.get(record.entityType as SyncEntityType);
    if (!config) throw new Error(`Entity type ${record.entityType} not configured`);

    const model = (this.prisma as any)[config.tableName];
    if (!model) throw new Error(`Model ${config.tableName} not found`);

    const { action, entityId, data } = record;

    switch (action) {
      case 'CREATE':
        await model.create({
          data: {
            ...data,
            id: entityId,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
        break;

      case 'UPDATE':
        await model.update({
          where: { id: entityId },
          data: {
            ...data,
            updatedAt: new Date(),
          },
        });
        break;

      case 'DELETE':
        if (config.softDelete) {
          await model.update({
            where: { id: entityId },
            data: {
              deleted: true,
              deletedAt: new Date(),
            },
          });
        } else {
          await model.delete({
            where: { id: entityId },
          });
        }
        break;

      default:
        throw new Error(`Unknown action: ${action}`);
    }
  }

  //Log sync record for audit and version tracking
 
  private async logSyncRecord(record: SyncRecord, userId: string): Promise<void> {
    const latestRecord = await this.prisma.syncLog.findFirst({
      where: {
        entityType: record.entityType,
        entityId: record.entityId,
      },
      orderBy: {
        version: 'desc',
      },
    });

    const nextVersion = (latestRecord?.version || 0) + 1;

    await this.prisma.syncLog.create({
      data: {
        id: record.id,
        entityType: record.entityType,
        entityId: record.entityId,
        action: record.action,
        data: record.data,
        userId: userId,
        timestamp: new Date(),
        version: nextVersion,
        checksum: this.generateChecksum(record.data),
      },
    });
  }

  //Get sync status for user
 
  async getSyncStatus(userId: string): Promise<SyncStatus> {
    // Get last sync timestamp
    const lastSync = await this.prisma.syncLog.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' },
    });

    const pendingChanges = 0; 

    return {
      userId,
      lastSyncTimestamp: lastSync?.timestamp || new Date(0),
      pendingChanges,
      isOnline: true, 
      syncInProgress: false, 
    };
  }

  // Resolve conflict manually

  async resolveConflict(
    userId: string,
    resolution: ConflictResolution
  ): Promise<void> {
    const { recordId, strategy, mergedData } = resolution;

    const syncRecord = await this.prisma.syncLog.findUnique({
      where: { id: recordId },
    });

    if (!syncRecord) {
      throw new Error('Sync record not found');
    }

    let finalData: any;

    switch (strategy) {
      case 'SERVER_WINS':
        return;

      case 'CLIENT_WINS':
        finalData = syncRecord.data;
        break;

      case 'MERGE':
        if (!mergedData) {
          throw new Error('Merged data required for MERGE strategy');
        }
        finalData = mergedData;
        break;

      default:
        throw new Error(`Unknown resolution strategy: ${strategy}`);
    }

    await this.applyChange({
      ...syncRecord,
      data: finalData,
    } as SyncRecord, userId);

    await this.logSyncRecord({
      ...syncRecord,
      data: finalData,
      id: crypto.randomUUID(), 
    } as SyncRecord, userId);
  }
}