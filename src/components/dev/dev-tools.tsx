"use client";

import { useState, useEffect } from 'react';
import { PerformanceMonitor } from '@/components/ui/performance-monitor';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  Monitor, 
  Bug, 
  Zap, 
  Settings, 
  X, 
  Maximize2, 
  Minimize2,
  RefreshCw,
  Activity,
  Database,
  Wifi,
  HardDrive,
  Clock
} from 'lucide-react';

interface DevToolsProps {
  enabled?: boolean;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  defaultExpanded?: boolean;
}

interface DevToolsState {
  isExpanded: boolean;
  activeTab: 'performance' | 'errors' | 'network' | 'storage';
  showPerformanceOverlay: boolean;
  performanceThreshold: {
    minFps: number;
    maxMemoryMB: number;
  };
}

interface NetworkInfo {
  online: boolean;
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  saveData?: boolean;
}

interface StorageInfo {
  localStorage: number;
  sessionStorage: number;
  indexedDB?: number;
  quota?: number;
  usage?: number;
}

export function DevTools({ 
  enabled = process.env.NODE_ENV === 'development',
  position = 'bottom-right',
  defaultExpanded = false 
}: DevToolsProps) {
  const { toast } = useToast();
  const [state, setState] = useState<DevToolsState>({
    isExpanded: defaultExpanded,
    activeTab: 'performance',
    showPerformanceOverlay: false,
    performanceThreshold: { minFps: 30, maxMemoryMB: 100 }
  });

  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({ online: navigator.onLine });
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    localStorage: 0,
    sessionStorage: 0
  });
  const [errors, setErrors] = useState<Array<{ 
    id: string;
    message: string; 
    stack?: string; 
    timestamp: Date;
    type: 'error' | 'warning' | 'info';
  }>>([]);

  // Position classes
  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4'
  };

  // Update network info
  useEffect(() => {
    const updateNetworkInfo = () => {
      const connection = (navigator as any).connection;
      setNetworkInfo({
        online: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
        saveData: connection?.saveData
      });
    };

    updateNetworkInfo();
    
    const handleOnline = () => updateNetworkInfo();
    const handleOffline = () => updateNetworkInfo();
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    if ('connection' in navigator) {
      (navigator as any).connection.addEventListener('change', updateNetworkInfo);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('connection' in navigator) {
        (navigator as any).connection.removeEventListener('change', updateNetworkInfo);
      }
    };
  }, []);

  // Update storage info
  useEffect(() => {
    const updateStorageInfo = async () => {
      try {
        const localStorage = JSON.stringify(window.localStorage).length;
        const sessionStorage = JSON.stringify(window.sessionStorage).length;
        
        let quota, usage;
        if ('storage' in navigator && 'estimate' in navigator.storage) {
          const estimate = await navigator.storage.estimate();
          quota = estimate.quota;
          usage = estimate.usage;
        }

        setStorageInfo({
          localStorage: Math.round(localStorage / 1024), // KB
          sessionStorage: Math.round(sessionStorage / 1024), // KB
          quota: quota ? Math.round(quota / 1024 / 1024) : undefined, // MB
          usage: usage ? Math.round(usage / 1024 / 1024) : undefined // MB
        });
      } catch (error) {
        console.warn('Could not get storage info:', error);
      }
    };

    updateStorageInfo();
    const interval = setInterval(updateStorageInfo, 5000);
    return () => clearInterval(interval);
  }, []);

  // Error monitoring
  useEffect(() => {
    if (!enabled) return;

    const handleError = (event: ErrorEvent) => {
      const error = {
        id: Date.now().toString(),
        message: event.message,
        stack: event.error?.stack,
        timestamp: new Date(),
        type: 'error' as const
      };
      
      setErrors(prev => [error, ...prev.slice(0, 9)]); // Keep last 10 errors
      
      toast({
        variant: 'error',
        title: 'JavaScript Error',
        description: event.message.substring(0, 100),
      });
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      const error = {
        id: Date.now().toString(),
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: new Date(),
        type: 'error' as const
      };
      
      setErrors(prev => [error, ...prev.slice(0, 9)]);
      
      toast({
        variant: 'error',
        title: 'Promise Rejection',
        description: (event.reason?.message || 'Unhandled rejection').substring(0, 100),
      });
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [enabled, toast]);

  if (!enabled) return null;

  const handleClearErrors = () => {
    setErrors([]);
    toast({
      variant: 'success',
      title: 'Errors Cleared',
      description: 'All error logs have been cleared'
    });
  };

  const handleClearStorage = (type: 'localStorage' | 'sessionStorage' | 'all') => {
    try {
      if (type === 'localStorage' || type === 'all') {
        window.localStorage.clear();
      }
      if (type === 'sessionStorage' || type === 'all') {
        window.sessionStorage.clear();
      }
      
      toast({
        variant: 'success',
        title: 'Storage Cleared',
        description: `${type === 'all' ? 'All storage' : type} has been cleared`
      });
    } catch (error) {
      toast({
        variant: 'error',
        title: 'Clear Failed',
        description: 'Failed to clear storage'
      });
    }
  };

  return (
    <>
      {state.showPerformanceOverlay && (
        <PerformanceMonitor
          enabled={enabled}
          showDebugOverlay
          threshold={state.performanceThreshold}
        />
      )}
      
      <div className={cn(
        'fixed z-50 bg-gray-900/95 backdrop-blur-sm rounded-lg border border-gray-700 font-mono text-sm',
        positionClasses[position],
        state.isExpanded ? 'w-80' : 'w-12'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-2 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Monitor className="w-4 h-4 text-blue-400" />
            {state.isExpanded && (
              <span className="text-white font-semibold">Dev Tools</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {state.isExpanded && (
              <button
                onClick={() => setState(prev => ({ 
                  ...prev, 
                  showPerformanceOverlay: !prev.showPerformanceOverlay 
                }))}
                className={cn(
                  'p-1 rounded hover:bg-gray-700 transition-colors',
                  state.showPerformanceOverlay ? 'text-green-400' : 'text-gray-400'
                )}
                title="Toggle Performance Overlay"
              >
                <Activity className="w-4 h-4" />
              </button>
            )}
            
            <button
              onClick={() => setState(prev => ({ ...prev, isExpanded: !prev.isExpanded }))}
              className="p-1 text-gray-400 hover:text-white transition-colors"
            >
              {state.isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {state.isExpanded && (
          <>
            {/* Tabs */}
            <div className="flex border-b border-gray-700">
              {[
                { id: 'performance', icon: Zap, label: 'Perf' },
                { id: 'errors', icon: Bug, label: 'Errors' },
                { id: 'network', icon: Wifi, label: 'Net' },
                { id: 'storage', icon: HardDrive, label: 'Store' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setState(prev => ({ ...prev, activeTab: tab.id as any }))}
                  className={cn(
                    'flex-1 flex items-center justify-center gap-1 p-2 transition-colors',
                    state.activeTab === tab.id 
                      ? 'bg-blue-600/20 text-blue-400 border-b-2 border-blue-400' 
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  )}
                >
                  <tab.icon className="w-3 h-3" />
                  <span className="text-xs">{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Content */}
            <div className="p-3 max-h-64 overflow-y-auto">
              {state.activeTab === 'performance' && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">FPS Threshold</label>
                    <input
                      type="number"
                      value={state.performanceThreshold.minFps}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        performanceThreshold: { ...prev.performanceThreshold, minFps: parseInt(e.target.value) }
                      }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Memory Threshold (MB)</label>
                    <input
                      type="number"
                      value={state.performanceThreshold.maxMemoryMB}
                      onChange={(e) => setState(prev => ({
                        ...prev,
                        performanceThreshold: { ...prev.performanceThreshold, maxMemoryMB: parseInt(e.target.value) }
                      }))}
                      className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs"
                    />
                  </div>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full p-2 bg-blue-600 hover:bg-blue-700 rounded text-xs flex items-center justify-center gap-1 transition-colors"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Force Reload
                  </button>
                </div>
              )}

              {state.activeTab === 'errors' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-400">Recent Errors ({errors.length})</span>
                    {errors.length > 0 && (
                      <button
                        onClick={handleClearErrors}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {errors.length === 0 ? (
                      <div className="text-xs text-gray-500 text-center py-4">No errors logged</div>
                    ) : (
                      errors.map(error => (
                        <div key={error.id} className="p-2 bg-red-900/20 border border-red-800 rounded">
                          <div className="text-xs text-red-400 font-medium">{error.message}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {error.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {state.activeTab === 'network' && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      networkInfo.online ? 'bg-green-400' : 'bg-red-400'
                    )} />
                    <span className="text-xs text-white">
                      {networkInfo.online ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  
                  {networkInfo.effectiveType && (
                    <div className="text-xs text-gray-400">
                      Type: <span className="text-white">{networkInfo.effectiveType}</span>
                    </div>
                  )}
                  
                  {networkInfo.downlink && (
                    <div className="text-xs text-gray-400">
                      Speed: <span className="text-white">{networkInfo.downlink} Mbps</span>
                    </div>
                  )}
                  
                  {networkInfo.rtt && (
                    <div className="text-xs text-gray-400">
                      Latency: <span className="text-white">{networkInfo.rtt}ms</span>
                    </div>
                  )}
                  
                  {networkInfo.saveData && (
                    <div className="text-xs text-yellow-400">Data Saver: On</div>
                  )}
                </div>
              )}

              {state.activeTab === 'storage' && (
                <div className="space-y-2">
                  <div className="text-xs text-gray-400">
                    LocalStorage: <span className="text-white">{storageInfo.localStorage}KB</span>
                  </div>
                  
                  <div className="text-xs text-gray-400">
                    SessionStorage: <span className="text-white">{storageInfo.sessionStorage}KB</span>
                  </div>
                  
                  {storageInfo.usage && storageInfo.quota && (
                    <div className="text-xs text-gray-400">
                      Total Usage: <span className="text-white">
                        {storageInfo.usage}MB / {storageInfo.quota}MB
                      </span>
                    </div>
                  )}
                  
                  <div className="flex gap-1 pt-2">
                    <button
                      onClick={() => handleClearStorage('localStorage')}
                      className="flex-1 p-1 bg-red-600/20 border border-red-600 rounded text-xs text-red-400 hover:bg-red-600/30 transition-colors"
                    >
                      Clear Local
                    </button>
                    
                    <button
                      onClick={() => handleClearStorage('sessionStorage')}
                      className="flex-1 p-1 bg-red-600/20 border border-red-600 rounded text-xs text-red-400 hover:bg-red-600/30 transition-colors"
                    >
                      Clear Session
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}

// Error boundary wrapper for dev tools
export function DevToolsProvider({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      {children}
      <DevTools />
    </ErrorBoundary>
  );
}