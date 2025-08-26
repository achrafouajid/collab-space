import { useState, useEffect, useCallback, useRef } from 'react';

interface NetworkStatus {
  isOnline: boolean;
  isSlowConnection: boolean;
  connectionType: string;
  lastOnlineAt: Date | null;
  retryAttempts: number;
}

interface UseNetworkStatusOptions {
  pingUrl?: string;
  pingInterval?: number;
  timeoutDuration?: number;
  maxRetries?: number;
}

export const useNetworkStatus = (options: UseNetworkStatusOptions = {}) => {
  const {
    pingUrl = '/api/v1/sync/health',
    pingInterval = 30000, 
    timeoutDuration = 5000,
    maxRetries = 3
  } = options;

  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    isSlowConnection: false,
    connectionType: 'unknown',
    lastOnlineAt: navigator.onLine ? new Date() : null,
    retryAttempts: 0
  });

  const pingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check connection quality by measuring response time
  const checkConnectionQuality = useCallback(async (): Promise<{
    isOnline: boolean;
    isSlowConnection: boolean;
    responseTime: number;
  }> => {
    const startTime = Date.now();
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutDuration);

      const response = await fetch(pingUrl, {
        method: 'HEAD',
        signal: controller.signal,
        cache: 'no-cache',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;
      const isSlowConnection = responseTime > 3000; // Consider slow if > 3 seconds

      return {
        isOnline: response.ok,
        isSlowConnection,
        responseTime
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        isOnline: false,
        isSlowConnection: true,
        responseTime
      };
    }
  }, [pingUrl, timeoutDuration]);

  // Get connection type from Network Information API
  const getConnectionType = useCallback((): string => {
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;

    if (connection) {
      return connection.effectiveType || connection.type || 'unknown';
    }
    return 'unknown';
  }, []);

  // Retry connection check with exponential backoff
  const retryConnection = useCallback(async (attempt: number = 0) => {
    if (attempt >= maxRetries) {
      setNetworkStatus(prev => ({ ...prev, retryAttempts: attempt }));
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, attempt), 30000); // Max 30 seconds
    
    retryTimeoutRef.current = setTimeout(async () => {
      const { isOnline, isSlowConnection } = await checkConnectionQuality();
      
      if (isOnline) {
        setNetworkStatus(prev => ({
          ...prev,
          isOnline: true,
          isSlowConnection,
          lastOnlineAt: new Date(),
          retryAttempts: 0,
          connectionType: getConnectionType()
        }));
      } else {
        setNetworkStatus(prev => ({ ...prev, retryAttempts: attempt + 1 }));
        retryConnection(attempt + 1);
      }
    }, delay);
  }, [maxRetries, checkConnectionQuality, getConnectionType]);

  // Periodic ping to check connection quality
  const startPeriodicPing = useCallback(() => {
    const performPing = async () => {
      if (!navigator.onLine) return;

      const { isOnline, isSlowConnection } = await checkConnectionQuality();
      
      setNetworkStatus(prev => ({
        ...prev,
        isOnline,
        isSlowConnection,
        connectionType: getConnectionType(),
        ...(isOnline && { lastOnlineAt: new Date(), retryAttempts: 0 })
      }));

      // If offline, start retry mechanism
      if (!isOnline) {
        retryConnection(0);
      }
    };

    // Initial ping
    performPing();

    // Setup periodic ping
    pingTimeoutRef.current = setInterval(performPing, pingInterval);
  }, [checkConnectionQuality, getConnectionType, retryConnection, pingInterval]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: true,
        lastOnlineAt: new Date(),
        retryAttempts: 0,
        connectionType: getConnectionType()
      }));

      // Verify connection quality when coming back online
      checkConnectionQuality().then(({ isSlowConnection }) => {
        setNetworkStatus(prev => ({ ...prev, isSlowConnection }));
      });
    };

    const handleOffline = () => {
      setNetworkStatus(prev => ({
        ...prev,
        isOnline: false,
        isSlowConnection: true
      }));

      // Start retry mechanism
      retryConnection(0);
    };

    // Handle connection change (mobile)
    const handleConnectionChange = () => {
      setNetworkStatus(prev => ({
        ...prev,
        connectionType: getConnectionType()
      }));
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Start periodic ping
    startPeriodicPing();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }

      if (pingTimeoutRef.current) {
        clearInterval(pingTimeoutRef.current);
      }

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [checkConnectionQuality, getConnectionType, retryConnection, startPeriodicPing]);

  // Manual retry function
  const manualRetry = useCallback(async () => {
    setNetworkStatus(prev => ({ ...prev, retryAttempts: 0 }));
    const { isOnline, isSlowConnection } = await checkConnectionQuality();
    
    setNetworkStatus(prev => ({
      ...prev,
      isOnline,
      isSlowConnection,
      connectionType: getConnectionType(),
      ...(isOnline && { lastOnlineAt: new Date() })
    }));

    return isOnline;
  }, [checkConnectionQuality, getConnectionType]);

  // Connection quality indicator
  const getConnectionQualityText = useCallback(() => {
    if (!networkStatus.isOnline) return 'Offline';
    if (networkStatus.isSlowConnection) return 'Slow Connection';
    
    switch (networkStatus.connectionType) {
      case '4g': return 'Fast Connection';
      case '3g': return 'Good Connection';
      case '2g': return 'Slow Connection';
      case 'slow-2g': return 'Very Slow Connection';
      default: return 'Connected';
    }
  }, [networkStatus]);

  return {
    ...networkStatus,
    connectionQuality: getConnectionQualityText(),
    manualRetry,
    isRetrying: networkStatus.retryAttempts > 0,
    canRetry: !networkStatus.isOnline && networkStatus.retryAttempts < maxRetries
  };
};