import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface OfflineDBSchema extends DBSchema {
  tasks: {
    key: string;
    value: {
      id: string;
      title: string;
      description?: string;
      status: string;
      assigneeId?: string;
      projectId: string;
      priority: string;
      dueDate?: string;
      createdAt: string;
      updatedAt: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
      lastSyncedAt?: string;
    };
    indexes: {
      'by-project': string;
      'by-status': string;
      'by-sync-status': string;
    };
  };
  projects: {
    key: string;
    value: {
      id: string;
      name: string;
      description?: string;
      status: string;
      createdAt: string;
      updatedAt: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
      lastSyncedAt?: string;
    };
    indexes: {
      'by-status': string;
      'by-sync-status': string;
    };
  };
  messages: {
    key: string;
    value: {
      id: string;
      content: string;
      authorId: string;
      roomId: string;
      timestamp: string;
      syncStatus: 'synced' | 'pending' | 'conflict';
      lastSyncedAt?: string;
    };
    indexes: {
      'by-room': string;
      'by-timestamp': string;
      'by-sync-status': string;
    };
  };
  syncQueue: {
    key: string;
    value: {
      id: string;
      entityType: string;
      entityId: string;
      action: 'CREATE' | 'UPDATE' | 'DELETE';
      data: any;
      timestamp: string;
      retryCount: number;
      lastRetry?: string;
    };
    indexes: {
      'by-entity-type': string;
      'by-timestamp': string;
    };
  };
  metadata: {
    key: string;
    value: {
      key: string;
      value: any;
      timestamp: string;
    };
  };
}

class OfflineDB {
  private dbName = 'pern-offline-db';
  private version = 1;
  private db: IDBPDatabase<OfflineDBSchema> | null = null;

  async init(): Promise<IDBPDatabase<OfflineDBSchema>> {
    if (this.db) return this.db;

    this.db = await openDB<OfflineDBSchema>(this.dbName, this.version, {
      upgrade(db) {
        // Tasks store
        if (!db.objectStoreNames.contains('tasks')) {
          const taskStore = db.createObjectStore('tasks', { keyPath: 'id' });
          taskStore.createIndex('by-project', 'projectId');
          taskStore.createIndex('by-status', 'status');
          taskStore.createIndex('by-sync-status', 'syncStatus');
        }

        // Projects store
        if (!db.objectStoreNames.contains('projects')) {
          const projectStore = db.createObjectStore('projects', { keyPath: 'id' });
          projectStore.createIndex('by-status', 'status');
          projectStore.createIndex('by-sync-status', 'syncStatus');
        }

        // Messages store
        if (!db.objectStoreNames.contains('messages')) {
          const messageStore = db.createObjectStore('messages', { keyPath: 'id' });
          messageStore.createIndex('by-room', 'roomId');
          messageStore.createIndex('by-timestamp', 'timestamp');
          messageStore.createIndex('by-sync-status', 'syncStatus');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('syncQueue')) {
          const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id' });
          syncStore.createIndex('by-entity-type', 'entityType');
          syncStore.createIndex('by-timestamp', 'timestamp');
        }

        // Metadata store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }
      },
    });

    return this.db;
  }

  // Generic CRUD operations
  async create<T extends keyof OfflineDBSchema>(
    storeName: T,
    data: OfflineDBSchema[T]['value']
  ): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).add(data);
    await tx.done;
  }

  async read<T extends keyof OfflineDBSchema>(
    storeName: T,
    key: string
  ): Promise<OfflineDBSchema[T]['value'] | undefined> {
    const db = await this.init();
    return db.get(storeName, key);
  }

  async readAll<T extends keyof OfflineDBSchema>(
    storeName: T
  ): Promise<OfflineDBSchema[T]['value'][]> {
    const db = await this.init();
    return db.getAll(storeName);
  }

  async update<T extends keyof OfflineDBSchema>(
    storeName: T,
    data: OfflineDBSchema[T]['value']
  ): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).put(data);
    await tx.done;
  }

  async delete<T extends keyof OfflineDBSchema>(
    storeName: T,
    key: string
  ): Promise<void> {
    const db = await this.init();
    const tx = db.transaction(storeName, 'readwrite');
    await tx.objectStore(storeName).delete(key);
    await tx.done;
  }

  // Sync-specific operations
  async addToSyncQueue(item: OfflineDBSchema['syncQueue']['value']): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('syncQueue', 'readwrite');
    await tx.objectStore('syncQueue').add(item);
    await tx.done;
  }

  async getSyncQueue(): Promise<OfflineDBSchema['syncQueue']['value'][]> {
    const db = await this.init();
    return db.getAll('syncQueue');
  }

  async clearSyncQueue(): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('syncQueue', 'readwrite');
    await tx.objectStore('syncQueue').clear();
    await tx.done;
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('syncQueue', 'readwrite');
    await tx.objectStore('syncQueue').delete(id);
    await tx.done;
  }

  // Metadata operations
  async setMetadata(key: string, value: any): Promise<void> {
    const db = await this.init();
    const tx = db.transaction('metadata', 'readwrite');
    await tx.objectStore('metadata').put({
      key,
      value,
      timestamp: new Date().toISOString()
    });
    await tx.done;
  }

  async getMetadata(key: string): Promise<any> {
    const db = await this.init();
    const result = await db.get('metadata', key);
    return result?.value;
  }

  // Query operations with indexes
  async getTasksByProject(projectId: string): Promise<OfflineDBSchema['tasks']['value'][]> {
    const db = await this.init();
    return db.getAllFromIndex('tasks', 'by-project', projectId);
  }

  async getTasksByStatus(status: string): Promise<OfflineDBSchema['tasks']['value'][]> {
    const db = await this.init();
    return db.getAllFromIndex('tasks', 'by-status', status);
  }

  async getUnsyncedData<T extends keyof OfflineDBSchema>(
    storeName: T
  ): Promise<OfflineDBSchema[T]['value'][]> {
    const db = await this.init();
    if (storeName === 'syncQueue') {
      return db.getAll(storeName);
    }
    
    // For other stores, get items with pending sync status
    const store = db.transaction(storeName).objectStore(storeName);
    if (store.indexNames.contains('by-sync-status')) {
      return db.getAllFromIndex(storeName as any, 'by-sync-status' as any, 'pending');
    }
    return [];
  }

  // Cleanup operations
  async cleanupOldData(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<void> {
    const cutoff = new Date(Date.now() - maxAge).toISOString();
    const db = await this.init();

    // Clean up old synced messages
    const tx = db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    const index = store.index('by-timestamp');
    
    let cursor = await index.openCursor(IDBKeyRange.upperBound(cutoff));
while (cursor) {
  if (cursor.value.syncStatus === 'synced') {
    await cursor.delete();
  }
  cursor = await cursor.continue();
}
    await tx.done;
  }

  // Database utilities
  async getDatabaseSize(): Promise<{ storeName: string; count: number }[]> {
    const db = await this.init();
    const stores = ['tasks', 'projects', 'messages', 'syncQueue', 'metadata'] as const;
    const sizes = [];

    for (const storeName of stores) {
      const count = await db.count(storeName);
      sizes.push({ storeName, count });
    }

    return sizes;
  }

  async clearAllData(): Promise<void> {
    const db = await this.init();
    const stores = ['tasks', 'projects', 'messages', 'syncQueue', 'metadata'] as const;
    
    const tx = db.transaction(stores, 'readwrite');
    await Promise.all(stores.map(store => tx.objectStore(store).clear()));
    await tx.done;
  }
}

// Export singleton instance
export const offlineDB = new OfflineDB();

export type { OfflineDBSchema };