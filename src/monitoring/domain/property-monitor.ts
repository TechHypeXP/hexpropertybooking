import { MonitoringDomain, MetricType, HealthStatus } from './types';
import { MonitoringFactory } from '../providers/monitoring-factory';

export class PropertyMonitor {
  private static instance: PropertyMonitor;
  private factory: MonitoringFactory;

  private constructor() {
    this.factory = MonitoringFactory.getInstance();
  }

  static getInstance(): PropertyMonitor {
    if (!PropertyMonitor.instance) {
      PropertyMonitor.instance = new PropertyMonitor();
    }
    return PropertyMonitor.instance;
  }

  async recordViewRate(propertyId: string, views: number): Promise<void> {
    await this.factory.getCurrentProvider().recordMetric({
      domain: MonitoringDomain.PROPERTY,
      name: 'view_rate',
      type: MetricType.COUNTER,
      value: views,
      labels: { property_id: propertyId },
      timestamp: new Date()
    });
  }

  async recordConversionRate(propertyId: string, rate: number): Promise<void> {
    await this.factory.getCurrentProvider().recordMetric({
      domain: MonitoringDomain.PROPERTY,
      name: 'conversion_rate',
      type: MetricType.GAUGE,
      value: rate,
      labels: { property_id: propertyId },
      timestamp: new Date()
    });
  }

  async recordSearchPosition(propertyId: string, position: number): Promise<void> {
    await this.factory.getCurrentProvider().recordMetric({
      domain: MonitoringDomain.PROPERTY,
      name: 'search_position',
      type: MetricType.GAUGE,
      value: position,
      labels: { property_id: propertyId },
      timestamp: new Date()
    });
  }

  async recordPropertyHealth(propertyId: string, status: HealthStatus, message?: string): Promise<void> {
    await this.factory.getCurrentProvider().recordHealthCheck({
      domain: MonitoringDomain.PROPERTY,
      component: `property_${propertyId}`,
      status,
      message,
      timestamp: new Date()
    });
  }

  async measurePropertyOperation<T>(propertyId: string, operation: string, func: () => Promise<T>): Promise<T> {
    const span = this.factory.getCurrentProvider().startSpan(
      MonitoringDomain.PROPERTY,
      `property_${propertyId}_${operation}`
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
