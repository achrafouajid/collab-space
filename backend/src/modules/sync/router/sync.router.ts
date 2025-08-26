// src/modules/sync/router/sync.router.ts
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { SyncController } from '../controller/sync.controller';
import { authenticateToken } from '../../../middleware/auth.middleware';
import { cacheMiddleware } from '../../../middleware/caching.middleware';

const router = Router();

const syncLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 100, 
  message: {
    error: 'Too many sync requests, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(syncLimiter);

/**
 * @swagger
 * /sync/health:
 *   get:
 *     summary: Health check for sync service
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Sync service health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                     database:
 *                       type: string
 *                     sync:
 *                       type: string
 */
router.get('/health', cacheMiddleware.noCache(), SyncController.healthCheck);

/**
 * @swagger
 * /sync/timestamp:
 *   get:
 *     summary: Get server timestamp for clock synchronization
 *     tags: [Sync]
 *     responses:
 *       200:
 *         description: Server timestamp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     unixTimestamp:
 *                       type: number
 */
router.get('/timestamp', cacheMiddleware.noCache(), SyncController.getServerTimestamp);

/**
 * @swagger
 * /sync/pull:
 *   get:
 *     summary: Pull data changes from server
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: lastSyncTimestamp
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Last sync timestamp
 *       - in: query
 *         name: entityTypes
 *         schema:
 *           type: string
 *         description: Comma-separated list of entity types
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *         description: Maximum number of records to return
 *     responses:
 *       200:
 *         description: Successfully pulled data changes
 *         headers:
 *           X-Sync-Timestamp:
 *             description: Server timestamp when data was pulled
 *             schema:
 *               type: string
 *               format: date-time
 *           X-Has-More:
 *             description: Whether there are more records available
 *             schema:
 *               type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/pull', authenticateToken, cacheMiddleware.noCache(), SyncController.pullData);

/**
 * @swagger
 * /sync/push:
 *   post:
 *     summary: Push data changes to server
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - records
 *               - syncToken
 *             properties:
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     entityType:
 *                       type: string
 *                     entityId:
 *                       type: string
 *                       format: uuid
 *                     action:
 *                       type: string
 *                       enum: [CREATE, UPDATE, DELETE]
 *                     data:
 *                       type: object
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *                     version:
 *                       type: number
 *               syncToken:
 *                 type: object
 *                 properties:
 *                   userId:
 *                     type: string
 *                     format: uuid
 *                   lastSyncTimestamp:
 *                     type: string
 *                     format: date-time
 *                   entityVersions:
 *                     type: object
 *     responses:
 *       200:
 *         description: Successfully pushed data changes
 *         headers:
 *           X-Sync-Timestamp:
 *             description: Server timestamp after push
 *             schema:
 *               type: string
 *               format: date-time
 *           X-Accepted-Count:
 *             description: Number of accepted records
 *             schema:
 *               type: integer
 *           X-Rejected-Count:
 *             description: Number of rejected records
 *             schema:
 *               type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Invalid sync token
 */
router.post('/push', authenticateToken, SyncController.pushData);

/**
 * @swagger
 * /sync/status:
 *   get:
 *     summary: Get sync status for current user
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sync status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                       format: uuid
 *                     lastSyncTimestamp:
 *                       type: string
 *                       format: date-time
 *                     pendingChanges:
 *                       type: integer
 *                     isOnline:
 *                       type: boolean
 *                     syncInProgress:
 *                       type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/status', authenticateToken, cacheMiddleware.shortCache(), SyncController.getSyncStatus);

/**
 * @swagger
 * /sync/resolve-conflict:
 *   post:
 *     summary: Resolve sync conflict
 *     tags: [Sync]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - recordId
 *               - strategy
 *             properties:
 *               recordId:
 *                 type: string
 *                 format: uuid
 *               strategy:
 *                 type: string
 *                 enum: [SERVER_WINS, CLIENT_WINS, MERGE]
 *               mergedData:
 *                 type: object
 *                 description: Required when strategy is MERGE
 *     responses:
 *       200:
 *         description: Conflict resolved successfully
 *       400:
 *         description: Invalid request data
 *       401:
 *         description: Unauthorized
 */
router.post('/resolve-conflict', authenticateToken, SyncController.resolveConflict);

export default router;