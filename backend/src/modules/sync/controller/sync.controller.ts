import { Request, Response } from 'express';
import { z } from 'zod';
import { SyncService } from '../service/sync.service';
import { ResponseUtil } from '../../../utils/response';
import { AuthenticatedRequest } from '../../auth/types/auth.types';
import prisma from '../../../config/prisma';

// Initialize sync service
const syncService = new SyncService(prisma);

const pullRequestSchema = z.object({
  lastSyncTimestamp: z.string().optional(),
  entityTypes: z.array(z.string()).optional(),
  limit: z.number().min(1).max(1000).optional(),
});

const syncRecordSchema = z.object({
  id: z.string().uuid(),
  entityType: z.string(),
  entityId: z.string().uuid(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']),
  data: z.any(),
  timestamp: z.string().transform(str => new Date(str)),
  version: z.number().min(0),
});

const pushRequestSchema = z.object({
  records: z.array(syncRecordSchema),
  syncToken: z.object({
    userId: z.string().uuid(),
    lastSyncTimestamp: z.string().transform(str => new Date(str)),
    entityVersions: z.record(z.number()),
  }),
});

const conflictResolutionSchema = z.object({
  recordId: z.string().uuid(),
  strategy: z.enum(['SERVER_WINS', 'CLIENT_WINS', 'MERGE']),
  mergedData: z.any().optional(),
});

export class SyncController {
  static async pullData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const pullRequest = pullRequestSchema.parse({
        lastSyncTimestamp: req.query.lastSyncTimestamp as string,
        entityTypes: req.query.entityTypes 
          ? (req.query.entityTypes as string).split(',')
          : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      });

      const result = await syncService.pullData(userId, pullRequest);

      res.set('X-Sync-Timestamp', result.serverTimestamp.toISOString());
      res.set('X-Has-More', result.hasMore.toString());

      ResponseUtil.success(res, result, 'Data pulled successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseUtil.badRequest(res, 'Invalid request parameters', error.errors);
      } else {
        console.error('Error pulling data:', error);
      }
    }
  }

  // POST /api/v1/sync/push
 
  static async pushData(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const pushRequest = pushRequestSchema.parse(req.body);

      if (pushRequest.syncToken.userId !== userId) {
        return ResponseUtil.forbidden(res, 'Invalid sync token');
      }

      const result = await syncService.pushData(userId, pushRequest);

      res.set('X-Sync-Timestamp', result.serverTimestamp.toISOString());
      res.set('X-Accepted-Count', result.accepted.length.toString());
      res.set('X-Rejected-Count', result.rejected.length.toString());

      ResponseUtil.success(res, result, 'Data pushed successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseUtil.badRequest(res, 'Invalid request data', error.errors);
      } else {
        console.error('Error pushing data:', error);
      }
    }
  }

  // Get sync status for user GET /api/v1/sync/status
  
  static async getSyncStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const status = await syncService.getSyncStatus(userId);
      
      ResponseUtil.success(res, status, 'Sync status retrieved successfully');
    } catch (error) {
      console.error('Error getting sync status:', error);
    }
  }

  // Resolve sync conflict POST /api/v1/sync/resolve-conflict
   
  static async resolveConflict(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      
      const resolution = conflictResolutionSchema.parse(req.body);

      await syncService.resolveConflict(userId, resolution);
      
      ResponseUtil.success(res, null, 'Conflict resolved successfully');
    } catch (error) {
      if (error instanceof z.ZodError) {
        ResponseUtil.badRequest(res, 'Invalid conflict resolution data', error.errors);
      } else {
        console.error('Error resolving conflict:', error);
      }
    }
  }

  // Get server timestamp for clock synchronization GET /api/v1/sync/timestamp

  static async getServerTimestamp(req: Request, res: Response): Promise<void> {
    try {
      const timestamp = new Date();
      
      ResponseUtil.success(res, {
        timestamp: timestamp.toISOString(),
        unixTimestamp: timestamp.getTime(),
      }, 'Server timestamp retrieved successfully');
    } catch (error) {
      console.error('Error getting server timestamp:', error);
    }
  }

  // Health check for sync service GET /api/v1/sync/health

  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      
      const health = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        database: 'connected',
        sync: 'operational',
      };
      
      ResponseUtil.success(res, health, 'Sync service is healthy');
    } catch (error) {
      console.error('Sync health check failed:', error);
    }
  }
}