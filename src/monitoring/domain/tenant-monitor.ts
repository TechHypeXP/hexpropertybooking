import { MonitoringDomain, MetricType, HealthStatus } from './types';
import { MonitoringFactory } from '../providers/monitoring-factory';

export class TenantMonitor {
  private static instance: TenantMonitor;
  private factory: MonitoringFactory;

  private constructor() {
    this.factory = MonitoringFactory.getInstance();
  }

  static getInstance(): TenantMonitor {
    if (!TenantMonitor.instance) {
      TenantMonitor.instance = new TenantMonitor();
    }
    return TenantMonitor.instance;
  }

  async recordSearchPattern(tenantId: string, pattern: string): Promise<void> {
    await this.factory.getCurrentProvider().recordMetric({
      domain: MonitoringDomain.TENANT,
      name: 'search_pattern',
      type: MetricType.COUNTER,
      value: 1,
      labels: { tenant_id: tenantId, pattern },
      timestamp: new Date()
    });
  }

  async recordSessionDuration(tenantId: string, duration: number): Promise<void> {
    await this.factory.getCurrentProvider().recordHistogram(
      'session_duration',
      duration,
      { tenant_id: tenantId }
    );
  }

  async recordFeatureUsage(tenantId: string, feature: string): Promise<void> {
    await this.factory.getCurrentProvider().recordMetric({
      domain: MonitoringDomain.TENANT,
      name: 'feature_usage',
      type: MetricType.COUNTER,
      value: 1,
      labels: { tenant_id: tenantId, feature },
      timestamp: new Date()
    });
  }

  async recordTenantHealth(tenantId: string, status: HealthStatus, message?: string): Promise<void> {
    await this.factory.getCurrentProvider().recordHealthCheck({
      domain: MonitoringDomain.TENANT,
      component: `tenant_${tenantId}`,
      status,
      message,
      timestamp: new Date()
    });
  }

  async measureTenantOperation<T>(tenantId: string, operation: string, func: () => Promise<T>): Promise<T> {
    const span = this.factory.getCurrentProvider().startSpan(
      MonitoringDomain.TENANT,
      `tenant_${tenantId}_${operation}`
    );

    try {
      const result = await func();
      return result;
    } finally {
      await this.factory.getCurrentProvider().endSpan({
        ...span,
        endTime: new Date()
      });
    }
  }
}
