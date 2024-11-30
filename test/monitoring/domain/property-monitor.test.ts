import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { PropertyMonitor } from '../../../src/monitoring/domain/property-monitor';
import { MonitoringFactory } from '../../../src/monitoring/providers/monitoring-factory';
import { MockMonitoringProvider } from '../test-utils';
import { HealthStatus } from '../../../src/monitoring/domain/types';

jest.mock('../../../src/monitoring/providers/monitoring-factory');

describe('PropertyMonitor', () => {
  let monitor: PropertyMonitor;
  let mockProvider: MockMonitoringProvider;

  beforeEach(() => {
    mockProvider = new MockMonitoringProvider();
    (MonitoringFactory.getInstance as jest.Mock).mockReturnValue({
      getCurrentProvider: () => mockProvider
    });
    monitor = PropertyMonitor.getInstance();
  });

  describe('recordViewRate', () => {
    it('should record property view rate', async () => {
      await monitor.recordViewRate('property-123', 10);
      
      const metrics = mockProvider.getMetricsByDomain('PROPERTY');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'view_rate',
        value: 10,
        labels: { property_id: 'property-123' }
      });
    });
  });

  describe('recordConversionRate', () => {
    it('should record property conversion rate', async () => {
      await monitor.recordConversionRate('property-123', 0.75);
      
      const metrics = mockProvider.getMetricsByDomain('PROPERTY');
      expect(metrics).toHaveLength(1);
      expect(metrics[0]).toMatchObject({
        name: 'conversion_rate',
        value: 0.75,
        labels: { property_id: 'property-123' }
      });
    });
  });

  describe('recordPropertyHealth', () => {
    it('should record property health status', async () => {
      await monitor.recordPropertyHealth(
        'property-123',
        HealthStatus.HEALTHY,
        'Property is performing well'
      );
      
      const healthChecks = mockProvider.getHealthChecksByDomain('PROPERTY');
      expect(healthChecks).toHaveLength(1);
      expect(healthChecks[0]).toMatchObject({
        component: 'property_property-123',
        status: HealthStatus.HEALTHY,
        message: 'Property is performing well'
      });
    });
  });

  describe('measurePropertyOperation', () => {
    it('should measure operation duration and record span', async () => {
      const result = await monitor.measurePropertyOperation(
        'property-123',
        'view',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return 'success';
        }
      );

      expect(result).toBe('success');
      
      const spans = mockProvider.getSpansByDomain('PROPERTY');
      expect(spans).toHaveLength(1);
      expect(spans[0]).toMatchObject({
        name: 'property_property-123_view',
        endTime: expect.any(Date)
      });
    });

    it('should handle operation errors', async () => {
      const error = new Error('Operation failed');
      
      await expect(
        monitor.measurePropertyOperation('property-123', 'view', async () => {
          throw error;
        })
      ).rejects.toThrow(error);

      const spans = mockProvider.getSpansByDomain('PROPERTY');
      expect(spans).toHaveLength(1);
      expect(spans[0].endTime).toBeDefined();
    });
  });
});
