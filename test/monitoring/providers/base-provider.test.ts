import { describe, it, beforeEach, expect } from '@jest/globals';
import { BaseMonitoringProvider } from '../../../src/monitoring/providers/base-provider';
import { MonitoringDomain, MetricType, HealthStatus } from '../../../src/monitoring/domain/types';

class TestProvider extends BaseMonitoringProvider {
  protected name = 'TestProvider';
  metrics = [];
  errors = [];
  healthChecks = [];
  spans = [];

  async initialize(): Promise<void> {}
  async shutdown(): Promise<void> {}

  protected async exportMetric(metric: any): Promise<void> {
    this.metrics.push(metric);
  }

  protected async exportError(error: any): Promise<void> {
    this.errors.push(error);
  }

  protected async exportSpan(span: any): Promise<void> {
    this.spans.push(span);
  }

  protected async exportHealthCheck(check: any): Promise<void> {
    this.healthChecks.push(check);
  }
}

describe('BaseMonitoringProvider', () => {
  let provider: TestProvider;

  beforeEach(() => {
    provider = new TestProvider();
  });

  describe('recordMetric', () => {
    it('should validate and export metric', async () => {
      const metric = {
        domain: MonitoringDomain.PROPERTY,
        name: 'test_metric',
        type: MetricType.COUNTER,
        value: 1,
        timestamp: new Date()
      };

      await provider.recordMetric(metric);
      expect(provider.metrics).toHaveLength(1);
      expect(provider.metrics[0]).toMatchObject(metric);
    });

    it('should throw error for invalid metric', async () => {
      const invalidMetric = {
        domain: 'INVALID_DOMAIN',
        name: 'test_metric',
        type: 'INVALID_TYPE',
        value: 'not_a_number',
        timestamp: 'not_a_date'
      };

      await expect(provider.recordMetric(invalidMetric)).rejects.toThrow();
    });
  });

  describe('recordHealthCheck', () => {
    it('should validate and export health check', async () => {
      const check = {
        domain: MonitoringDomain.PROPERTY,
        component: 'test_component',
        status: HealthStatus.HEALTHY,
        timestamp: new Date()
      };

      await provider.recordHealthCheck(check);
      expect(provider.healthChecks).toHaveLength(1);
      expect(provider.healthChecks[0]).toMatchObject(check);
    });
  });

  describe('span management', () => {
    it('should create and end span correctly', async () => {
      const span = provider.startSpan(MonitoringDomain.PROPERTY, 'test_span');
      expect(span.startTime).toBeDefined();
      expect(span.endTime).toBeUndefined();

      await provider.endSpan({ ...span, endTime: new Date() });
      expect(provider.spans).toHaveLength(1);
      expect(provider.spans[0].endTime).toBeDefined();
    });
  });
});
