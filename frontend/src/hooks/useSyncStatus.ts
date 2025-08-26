import { useState, useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { offlineDB } from '../utils/db';
import { RootState } from '../state/store';
import { syncService } from '../services/syncService';

interface SyncConflict {
  id: string;
  entityType: string;
  entityId: string;
  serverData: any;
  localData: any;
  timestamp: string;
}

interface SyncStatus {
  isSyncing: boolean;
  lastSyncAt: Date | null;
  pendingChanges: number;
  syncProgress: number;
  conflicts: SyncConflict[];
  syncError: string | null;
}

export const useSyncStatus = () => {
  const dispatch = useDispatch();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  
  const [status, setStatus] = useState<SyncStatus>({
    isSyncing: false,
    lastSyncAt: null,
    pendingChanges: 0,
    syncProgress: 0,
    conflicts: [],
    syncError: null
  });

  // Load initial sync status
  useEffect(() => {
    const loadSyncStatus = async () => {
      try {
        const lastSync = await offlineDB.getMetadata('lastSyncAt');
        const pendingQueue = await offlineDB.getSyncQueue();
        const conflicts = await offlineDB.getMetadata('syncConflicts') || [];

        setStatus(prev => ({
          ...prev,
          lastSyncAt: lastSync ? new Date(lastSync) : null,
          pendingChanges: pendingQueue.length,
          conflicts
        }));
      } catch (error) {
        console.error('Failed to load sync status:', error);
      }
    };

    if (isAuthenticated) {
      loadSyncStatus();
    }
  }, [isAuthenticated]);

  // Update pending changes when queue changes
  const updatePendingChanges = useCallback(async () => {
    try {
      const queue = await offlineDB.getSyncQueue();
      setStatus(prev => ({ ...prev, pendingChanges: queue.length }));
    } catch (error) {
      console.error('Failed to update pending changes:', error);
    }
  }, []);

  // Trigger manual sync
  const triggerSync = useCallback(async (): Promise<boolean> => {
    if (!isAuthenticated || status.isSyncing) return false;

    setStatus(prev => ({ 
      ...prev, 
      isSyncing: true, 
      syncProgress: 0,
      syncError: null 
    }));

    try {
      // Step 1: Pull changes from server (30%)
      setStatus(prev => ({ ...prev, syncProgress: 10 }));
      const pullResult = await syncService.pullChanges();
      setStatus(prev => ({ ...prev, syncProgress: 30 }));

      // Step 2: Push local changes (70%)
      const queue = await offlineDB.getSyncQueue();
      if (queue.length > 0) {
        setStatus(prev => ({ ...prev, syncProgress: 40 }));
        const pushResult = await syncService.pushChanges(queue);
        setStatus(prev => ({ ...prev, syncProgress: 70 }));

        // Handle conflicts
        if (pushResult.rejected.length > 0) {
          const conflicts: SyncConflict[] = pushResult.rejected
            .filter(item => item.reason === 'CONFLICT')
            .map(item => ({
              id: item.id,
              entityType: queue.find(q => q.id === item.id)?.entityType || 'unknown',
              entityId: queue.find(q => q.id === item.id)?.entityId || '',
              serverData: item.conflictData?.serverData,
              localData: item.conflictData?.clientData,
              timestamp: new Date().toISOString()
            }));

          await offlineDB.setMetadata('syncConflicts', conflicts);
          setStatus(prev => ({ ...prev, conflicts }));
        }

        // Remove successful items from queue
        for (const acceptedId of pushResult.accepted) {
          await offlineDB.removeSyncQueueItem(acceptedId);
        }
      }

      // Step 3: Finalize (100%)
      setStatus(prev => ({ ...prev, syncProgress: 90 }));
      
      const now = new Date();
      await offlineDB.setMetadata('lastSyncAt', now.toISOString());
      
      setStatus(prev => ({
        ...prev,
        syncProgress: 100,
        lastSyncAt: now,
        isSyncing: false
      }));

      await updatePendingChanges();
      
      // Reset progress after a short delay
      setTimeout(() => {
        setStatus(prev => ({ ...prev, syncProgress: 0 }));
      }, 1000);

      return true;
    } catch (error) {
      console.error('Sync failed:', error);
      setStatus(prev => ({
        ...prev,
        isSyncing: false,
        syncProgress: 0,
        syncError: error instanceof Error ? error.message : 'Sync failed'
      }));
      return false;
    }
  }, [isAuthenticated, status.isSyncing, updatePendingChanges]);

  // Add item to sync queue
  const addToSyncQueue = useCallback(async (
    entityType: string,
    entityId: string,
    action: 'CREATE' | 'UPDATE' | 'DELETE',
    data: any
  ) => {
    try {
      const queueItem = {
        id: crypto.randomUUID(),
        entityType,
        entityId,
        action,
        data,
        timestamp: new Date().toISOString(),
        retryCount: 0
      };

      await offlineDB.addToSyncQueue(queueItem);
      await updatePendingChanges();
    } catch (error) {
      console.error('Failed to add to sync queue:', error);
    }
  }, [updatePendingChanges]);

  // Resolve conflict
  const resolveConflict = useCallback(async (
    conflictId: string,
    resolution: 'SERVER_WINS' | 'CLIENT_WINS' | 'MERGE',
    mergedData?: any
  ): Promise<boolean> => {
    try {
      const conflicts = status.conflicts;
      const conflict = conflicts.find(c => c.id === conflictId);
      if (!conflict) return false;

      // Send resolution to server
      await syncService.resolveConflict({
        recordId: conflictId,
        strategy: resolution,
        mergedData
      });

      // Remove conflict from local list
      const updatedConflicts = conflicts.filter(c => c.id !== conflictId);
      await offlineDB.setMetadata('syncConflicts', updatedConflicts);
      
      setStatus(prev => ({
        ...prev,
        conflicts: updatedConflicts
      }));

      return true;
    } catch (error) {
      console.error('Failed to resolve conflict:', error);
      return false;
    }
  }, [status.conflicts]);

  // Auto-sync on network reconnection
  useEffect(() => {
    const handleOnline = () => {
      if (isAuthenticated && status.pendingChanges > 0) {
        // Trigger sync after a short delay to allow network to stabilize
        setTimeout(() => {
          triggerSync();
        }, 2000);
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isAuthenticated, status.pendingChanges, triggerSync]);

  // Periodic auto-sync when online
  useEffect(() => {
    if (!isAuthenticated || !navigator.onLine) return;

    const interval = setInterval(() => {
      if (status.pendingChanges > 0 && !status.isSyncing) {
        triggerSync();
      }
    }, 5 * 60 * 1000); // Every 5 minutes

    return () => clearInterval(interval);
  }, [isAuthenticated, status.pendingChanges, status.isSyncing, triggerSync]);

  return {
    ...status,
    triggerSync,
    addToSyncQueue,
    resolveConflict,
    updatePendingChanges
  };
};