import React, { useState } from 'react';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useSyncStatus } from '../../hooks/useSyncStatus';

interface OfflineStatusProps {
  className?: string;
  showDetails?: boolean;
  position?: 'top' | 'bottom' | 'inline';
}

export const OfflineStatus: React.FC<OfflineStatusProps> = ({ 
  className = '',
  showDetails = false,
  position = 'top'
}) => {
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const { 
    isOnline, 
    isSlowConnection, 
    connectionQuality, 
    manualRetry, 
    isRetrying, 
    canRetry,
    lastOnlineAt,
    retryAttempts 
  } = useNetworkStatus();
  
  const {
    isSyncing,
    lastSyncAt,
    pendingChanges,
    syncProgress,
    triggerSync,
    conflicts
  } = useSyncStatus();

  // Don't show if online and no pending changes
  if (isOnline && !isSlowConnection && !isSyncing && pendingChanges === 0 && conflicts.length === 0) {
    return null;
  }

  const getStatusColor = () => {
    if (!isOnline) return 'bg-red-500';
    if (conflicts.length > 0) return 'bg-yellow-500';
    if (isSlowConnection) return 'bg-orange-500';
    if (isSyncing) return 'bg-blue-500';
    if (pendingChanges > 0) return 'bg-indigo-500';
    return 'bg-green-500';
  };

  const getStatusText = () => {
    if (!isOnline) return 'Offline';
    if (conflicts.length > 0) return `${conflicts.length} Conflicts`;
    if (isSyncing) return 'Syncing...';
    if (pendingChanges > 0) return `${pendingChanges} Pending`;
    return connectionQuality;
  };

  const getStatusIcon = () => {
    if (!isOnline) return '📴';
    if (conflicts.length > 0) return '⚠️';
    if (isSyncing) return '🔄';
    if (pendingChanges > 0) return '⏳';
    if (isSlowConnection) return '🐌';
    return '✅';
  };

  const handleManualSync = async () => {
    if (isOnline) {
      await triggerSync();
    } else {
      await manualRetry();
    }
  };

  const positionClasses = {
    top: 'fixed top-0 left-0 right-0 z-50',
    bottom: 'fixed bottom-0 left-0 right-0 z-50',
    inline: 'relative'
  };

  const formatLastSync = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`${positionClasses[position]} ${className}`}>
      <div 
        className={`${getStatusColor()} text-white px-4 py-2 flex items-center justify-between cursor-pointer transition-all duration-300`}
        onClick={() => setShowSyncDetails(!showSyncDetails)}
      >
        <div className="flex items-center space-x-2">
          <span className="text-lg" role="img" aria-label="status">
            {getStatusIcon()}
          </span>
          <span className="text-sm font-medium">
            {getStatusText()}
          </span>
          {isSyncing && syncProgress > 0 && (
            <div className="flex items-center space-x-2">
              <div className="w-16 bg-white/20 rounded-full h-2">
                <div 
                  className="bg-white h-2 rounded-full transition-all duration-300"
                  style={{ width: `${syncProgress}%` }}
                />
              </div>
              <span className="text-xs">{Math.round(syncProgress)}%</span>
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {(canRetry || (isOnline && pendingChanges > 0)) && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleManualSync();
              }}
              disabled={isRetrying || isSyncing}
              className="text-xs bg-white/20 hover:bg-white/30 px-2 py-1 rounded transition-colors disabled:opacity-50"
              aria-label={isOnline ? 'Sync now' : 'Retry connection'}
            >
              {isRetrying || isSyncing ? '⏳' : isOnline ? 'Sync' : 'Retry'}
            </button>
          )}
          <span className="text-xs">
            {showSyncDetails ? '▼' : '▲'}
          </span>
        </div>
      </div>

      {showSyncDetails && (showDetails || !isOnline || pendingChanges > 0 || conflicts.length > 0) && (
        <div className="bg-white border-x border-b border-gray-200 shadow-lg">
          <div className="p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Connection:</span>
              <span className={`font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {connectionQuality}
                {isSlowConnection && isOnline && ' (Slow)'}
              </span>
            </div>

            {!isOnline && lastOnlineAt && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Last Online:</span>
                <span className="font-medium text-gray-800">
                  {formatLastSync(lastOnlineAt)}
                </span>
              </div>
            )}

            {retryAttempts > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Retry Attempts:</span>
                <span className="font-medium text-orange-600">
                  {retryAttempts} / 3
                </span>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span className="text-gray-600">Last Sync:</span>
              <span className="font-medium text-gray-800">
                {formatLastSync(lastSyncAt)}
              </span>
            </div>

            {pendingChanges > 0 && (
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Pending Changes:</span>
                <span className="font-medium text-indigo-600">
                  {pendingChanges} items
                </span>
              </div>
            )}

            {conflicts.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Conflicts:</span>
                  <span className="font-medium text-yellow-600">
                    {conflicts.length} items
                  </span>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                  <p className="text-xs text-yellow-800">
                    Some items have conflicts that need manual resolution.
                  </p>
                  <button className="text-xs text-yellow-700 underline mt-1">
                    View Conflicts
                  </button>
                </div>
              </div>
            )}

            <div className="flex space-x-2 pt-2 border-t">
              <button
                onClick={() => handleManualSync()}
                disabled={isRetrying || isSyncing}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white text-xs py-2 px-3 rounded transition-colors"
              >
                {isSyncing ? 'Syncing...' : isOnline ? 'Sync Now' : 'Retry Connection'}
              </button>
              
              {pendingChanges > 0 && (
                <button
                  onClick={() => {/* Handle view pending changes */}}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs py-2 px-3 rounded transition-colors"
                >
                  View Pending
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};