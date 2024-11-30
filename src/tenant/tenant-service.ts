import { useTenantMonitoring } from '../monitoring/hooks';
import { HealthStatus } from '../monitoring/domain/types';

export class TenantService {
  private static instance: TenantService;
  private tenantMonitor = useTenantMonitoring();

  private constructor() {}

  static getInstance(): TenantService {
    if (!TenantService.instance) {
      TenantService.instance = new TenantService();
    }
    return TenantService.instance;
  }

  async searchProperties(tenantId: string, searchCriteria: any): Promise<void> {
    return this.tenantMonitor.measureOperation(tenantId, 'search', async () => {
      try {
        const startTime = Date.now();
        
        // Search logic here
        
        await this.tenantMonitor.recordMetrics(tenantId, {
          searchPattern: JSON.stringify(searchCriteria),
          sessionDuration: Date.now() - startTime
        });
        
        await this.tenantMonitor.recordHealth(tenantId, HealthStatus.HEALTHY);
      } catch (error) {
        await this.tenantMonitor.recordHealth(tenantId, HealthStatus.UNHEALTHY, error.message);
        throw error;
      }
    });
  }

  async updatePreferences(tenantId: string, preferences: any): Promise<void> {
    return this.tenantMonitor.measureOperation(tenantId, 'update_preferences', async () => {
      try {
        // Update preferences logic here
        
        await this.tenantMonitor.recordMetrics(tenantId, {
          featureUsage: 'update_preferences'
        });
        
        await this.tenantMonitor.recordHealth(tenantId, HealthStatus.HEALTHY);
      } catch (error) {
        await this.tenantMonitor.recordHealth(tenantId, HealthStatus.UNHEALTHY, error.message);
        throw error;
      }
    });
  }

  async recordFeatureUsage(tenantId: string, feature: string): Promise<void> {
    await this.tenantMonitor.recordMetrics(tenantId, {
      featureUsage: feature
    });
  }
}
