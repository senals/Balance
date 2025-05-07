import { AppState, AppStateStatus, NativeEventSubscription } from 'react-native';
import { storage } from './storage';
import { dataService } from './dataService';

interface LocationSettings {
  trackLocation: boolean;
  locationInterval: number;
}

interface UserSettings {
  trackLocation?: boolean;
  locationInterval?: number;
  [key: string]: any;
}

interface Transaction {
  id: string;
  amount: number;
  type: string;
  timestamp: number;
}

interface Api {
  sync: (changes: Transaction[]) => Promise<void>;
  addTransaction: (transaction: Transaction) => Promise<void>;
  configure: (config: { batchInterval: number; maxBatchSize: number; enableOfflineQueue: boolean }) => void;
}

export class BatteryOptimizationService {
  private static instance: BatteryOptimizationService;
  private appStateSubscription: NativeEventSubscription | null = null;
  private isBackgroundSyncScheduled = false;
  private lastSyncTime = 0;
  private readonly SYNC_INTERVAL = 15 * 60 * 1000; // 15 minutes

  private constructor() {
    this.initialize();
  }

  public static getInstance(): BatteryOptimizationService {
    if (!BatteryOptimizationService.instance) {
      BatteryOptimizationService.instance = new BatteryOptimizationService();
    }
    return BatteryOptimizationService.instance;
  }

  private initialize() {
    // Monitor app state changes
    this.appStateSubscription = AppState.addEventListener('change', this.handleAppStateChange);
    
    // Initialize performance monitoring
    this.initializePerformanceMonitoring();
  }

  private handleAppStateChange = async (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background') {
      // When app goes to background, schedule a sync if needed
      this.scheduleBackgroundSync();
    } else if (nextAppState === 'active') {
      // When app becomes active, cancel any pending syncs
      this.cancelBackgroundSync();
    }
  };

  private scheduleBackgroundSync() {
    if (!this.isBackgroundSyncScheduled) {
      const timeSinceLastSync = Date.now() - this.lastSyncTime;
      
      // Only schedule sync if enough time has passed
      if (timeSinceLastSync >= this.SYNC_INTERVAL) {
        this.isBackgroundSyncScheduled = true;
        
        // Use setTimeout instead of setInterval to avoid continuous background execution
        setTimeout(async () => {
          try {
            await this.performBackgroundSync();
          } catch (error) {
            console.error('Background sync failed:', error);
          } finally {
            this.isBackgroundSyncScheduled = false;
            this.lastSyncTime = Date.now();
          }
        }, 5000); // Wait 5 seconds before starting sync
      }
    }
  }

  private cancelBackgroundSync() {
    this.isBackgroundSyncScheduled = false;
  }

  private async performBackgroundSync() {
    // Get pending changes from local storage
    const pendingChanges = await storage.getPendingChanges();
    
    if (pendingChanges.length > 0) {
      // Batch the changes to minimize network requests
      const batchedChanges = this.batchChanges(pendingChanges);
      
      // Process batched changes
      for (const batch of batchedChanges) {
        await dataService.syncChanges(batch);
      }
    }
  }

  private batchChanges(changes: any[]): any[][] {
    const BATCH_SIZE = 10;
    const batches: any[][] = [];
    
    for (let i = 0; i < changes.length; i += BATCH_SIZE) {
      batches.push(changes.slice(i, i + BATCH_SIZE));
    }
    
    return batches;
  }

  private initializePerformanceMonitoring() {
    // Monitor memory usage
    const memoryCheckInterval = setInterval(() => {
      const memoryUsage = process.memoryUsage();
      if (memoryUsage.heapUsed > 100 * 1024 * 1024) { // 100MB threshold
        this.cleanupResources();
      }
    }, 60000); // Check every minute

    // Clean up interval on service destruction
    return () => clearInterval(memoryCheckInterval);
  }

  private cleanupResources() {
    // Clear any cached data that's not immediately needed
    storage.clearCache();
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }
  }

  public async optimizeLocationServices(userId: string): Promise<void> {
    try {
      const settings = await storage.get<UserSettings>(`settings_${userId}`);
      if (settings && settings.trackLocation !== undefined) {
        const locationSettings = settings as LocationSettings;
        if (!locationSettings.trackLocation) {
          // Disable location tracking
          return;
        }

        // Optimize location interval
        const interval = locationSettings.locationInterval || 300000; // 5 minutes default
        if (interval < 300000) {
          // Increase interval to save battery
          await storage.set(`settings_${userId}`, {
            ...settings,
            locationInterval: 300000
          });
        }
      }
    } catch (error) {
      console.error('Failed to optimize location services:', error);
    }
  }

  public async optimizeNetworkRequests() {
    // Implement request batching and caching
    const api = dataService.getApi();
    if (api) {
      // Configure request batching through the data service
      dataService.configureApi({
        isBatchingEnabled: true
      });
    }
  }

  public destroy() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
    this.cancelBackgroundSync();
  }
}

// Export singleton instance
export const batteryOptimizationService = BatteryOptimizationService.getInstance(); 