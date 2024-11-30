import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { MonitoringService } from '../../../src/monitoring/monitoring-service';
import { PropertyMonitor } from '../../../src/monitoring/domain/property-monitor';
import { RecommendationMonitor } from '../../../src/monitoring/domain/recommendation-monitor';
import { AlertManager } from '../../../src/monitoring/advanced/alert-manager';
import { MonitoringOptimizer } from '../../../src/monitoring/advanced/monitoring-optimizer';
import { MetricBatchProcessor } from '../../../src/monitoring/advanced/batch-processor';
import { MonitoringDomain, HealthStatus, MetricType } from '../../../src/monitoring/domain/types';
import { MockMonitoringProvider } from '../test-utils';

describe('Monitoring System Integration', () => {
  let monitoringService: MonitoringService;
  let propertyMonitor: PropertyMonitor;
  let recommendationMonitor: RecommendationMonitor;
  let alertManager: AlertManager;
  let optimizer: MonitoringOptimizer;
  let batchProcessor: MetricBatchProcessor;
  let mockProvider: MockMonitoringProvider;

  beforeEach(() => {
    jest.useFakeTimers();
    mockProvider = new MockMonitoringProvider();
    monitoringService = MonitoringService.getInstance();
    jest.spyOn(monitoringService, 'getCurrentProvider').mockReturnValue(mockProvider);

    propertyMonitor = PropertyMonitor.getInstance();
    recommendationMonitor = RecommendationMonitor.getInstance();
    alertManager = AlertManager.getInstance();
    optimizer = MonitoringOptimizer.getInstance();
    batchProcessor = MetricBatchProcessor.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('End-to-End Monitoring Flow', () => {
    it('should handle complete monitoring lifecycle', async () => {
      // 1. Record property metrics
      await propertyMonitor.recordViewRate('property-123', 100);
      await propertyMonitor.recordConversionRate('property-123', 0.8);

      // 2. Record recommendation metrics
      await recommendationMonitor.recordModelAccuracy(0.95);
      await recommendationMonitor.recordPredictionLatency(50);

      // 3. Process metrics batch
      jest.advanceTimersByTime(5000); // Trigger batch flush

      // 4. Verify metrics were recorded
      const propertyMetrics = mockProvider.getMetricsByDomain(MonitoringDomain.PROPERTY);
      const recommendationMetrics = mockProvider.getMetricsByDomain(MonitoringDomain.RECOMMENDATION);

      expect(propertyMetrics).toHaveLength(2);
      expect(recommendationMetrics).toHaveLength(2);

      // 5. Verify alert evaluation
      await alertManager.evaluateMetric(
        MonitoringDomain.RECOMMENDATION,
        'model_accuracy',
        0.65
      );

      const healthChecks = mockProvider.getHealthChecksByDomain(MonitoringDomain.RECOMMENDATION);
      expect(healthChecks).toHaveLength(1);
      expect(healthChecks[0].status).toBe(HealthStatus.DEGRADED);

      // 6. Verify optimization adjustments
      await optimizer.optimizeMonitoring(MonitoringDomain.PROPERTY);
      const optimizationMetrics = mockProvider.metrics.filter(m => m.name === 'monitoring_sampling_rate');
      expect(optimizationMetrics).toHaveLength(1);
    });

    it('should handle high-load scenarios', async () => {
      const operations = Array(1000).fill(null).map((_, i) => 
        propertyMonitor.measurePropertyOperation(`property-${i}`, 'view', async () => {
          await new Promise(resolve => setTimeout(resolve, 1));
          return true;
        })
      );

      await Promise.all(operations);

      const spans = mockProvider.getSpansByDomain(MonitoringDomain.PROPERTY);
      expect(spans).toHaveLength(1000);
      expect(spans.every(s => s.endTime)).toBe(true);
    });

    it('should maintain monitoring during errors', async () => {
      // 1. Simulate failed operation
      try {
        await propertyMonitor.measurePropertyOperation('property-123', 'view', async () => {
          throw new Error('Operation failed');
        });
      } catch (error) {
        // Expected error
      }

      // 2. Verify error was recorded
      expect(mockProvider.errors).toHaveLength(1);
      expect(mockProvider.errors[0].message).toBe('Operation failed');

      // 3. Verify monitoring continues to work
      await propertyMonitor.recordViewRate('property-123', 100);
      expect(mockProvider.metrics).toHaveLength(1);
    });

    it('should handle graceful shutdown', async () => {
      // 1. Record some metrics
      await propertyMonitor.recordViewRate('property-123', 100);
      await recommendationMonitor.recordModelAccuracy(0.95);

      // 2. Initiate shutdown
      await batchProcessor.shutdown();

      // 3. Verify all metrics were flushed
      expect(mockProvider.metrics).toHaveLength(2);
    });
  });

  describe('Cross-Domain Monitoring', () => {
    it('should track related metrics across domains', async () => {
      // 1. Record recommendation event
      await recommendationMonitor.recordRecommendationEvent({
        propertyId: 'property-123',
        userId: 'user-456',
        success: true,
        latency: 100
      });

      // 2. Record property conversion
      await propertyMonitor.recordConversionRate('property-123', 0.8);

      // 3. Verify cross-domain correlation
      const recommendationMetrics = mockProvider.getMetricsByDomain(MonitoringDomain.RECOMMENDATION);
      const propertyMetrics = mockProvider.getMetricsByDomain(MonitoringDomain.PROPERTY);

      expect(recommendationMetrics).toHaveLength(2); // success and latency
      expect(propertyMetrics).toHaveLength(1);

      // 4. Verify labels maintain correlation
      const recommendationMetric = recommendationMetrics.find(m => m.name === 'recommendation_success');
      expect(recommendationMetric.labels).toMatchObject({
        property_id: 'property-123',
        user_id: 'user-456'
      });
    });
  });
});
