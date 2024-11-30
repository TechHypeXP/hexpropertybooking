import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import { MonitoringService } from '../../../src/monitoring/monitoring-service';
import { PropertyMonitor } from '../../../src/monitoring/domain/property-monitor';
import { RecommendationMonitor } from '../../../src/monitoring/domain/recommendation-monitor';
import { BookingMonitor } from '../../../src/monitoring/domain/booking-monitor';
import { TenantMonitor } from '../../../src/monitoring/domain/tenant-monitor';
import { MetricBatchProcessor } from '../../../src/monitoring/advanced/metric-batch-processor';
import { MonitoringOptimizer } from '../../../src/monitoring/advanced/monitoring-optimizer';
import { PerformanceAnalyzer } from '../../../src/monitoring/advanced/performance-analyzer';
import { HealthStatus, OptimizationConfig } from '../../../src/monitoring/domain/types';
import { StackdriverProvider } from '../../../src/monitoring/providers/stackdriver-provider';
import { performance } from 'perf_hooks';

describe('Monitoring System Integration Performance Tests', () => {
  let propertyMonitor: PropertyMonitor;
  let recommendationMonitor: RecommendationMonitor;
  let bookingMonitor: BookingMonitor;
  let tenantMonitor: TenantMonitor;
  let batchProcessor: MetricBatchProcessor;
  let optimizer: MonitoringOptimizer;
  let performanceAnalyzer: PerformanceAnalyzer;
  let provider: StackdriverProvider;

  beforeEach(() => {
    provider = new StackdriverProvider({
      projectId: 'test-project',
      credentials: {}
    });

    propertyMonitor = new PropertyMonitor(provider);
    recommendationMonitor = new RecommendationMonitor(provider);
    bookingMonitor = new BookingMonitor(provider);
    tenantMonitor = new TenantMonitor(provider);
    batchProcessor = new MetricBatchProcessor();
    optimizer = new MonitoringOptimizer();
    performanceAnalyzer = new PerformanceAnalyzer();
  });

  describe('End-to-End Performance', () => {
    it('should maintain performance during complex monitoring scenarios', async () => {
      const operations = {
        property: () => propertyMonitor.recordPropertyHealth('test-property', HealthStatus.HEALTHY, 'OK'),
        accuracy: () => recommendationMonitor.recordAccuracy('test-model', 0.8 + Math.random() * 0.2),
        latency: () => recommendationMonitor.recordLatency('test-model', 50 + Math.random() * 100),
        booking: () => bookingMonitor.recordBookingSuccess('test-booking'),
        tenant: () => tenantMonitor.recordTenantActivity('test-tenant')
      };

      const startTime = performance.now();

      // Run multiple operations concurrently
      await Promise.all(
        Array(100)
          .fill(null)
          .flatMap(() => Object.values(operations).map(op => op()))
      );

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('System Resource Usage', () => {
    it('should efficiently manage system resources during peak load', async () => {
      const config: OptimizationConfig = {
        memoryThreshold: 80,
        cpuThreshold: 70,
        batchSize: 100,
        samplingRate: 0.5
      };

      optimizer.updateConfig(config);

      const initialMemory = process.memoryUsage().heapUsed;
      const startUsage = process.cpuUsage();

      // Simulate peak load with mixed operations
      const operations = Array(1000).fill(null).map((_, index) => {
        const op = {
          type: index % 5,
          value: Math.random() * 100
        };

        switch (op.type) {
          case 0:
            return propertyMonitor.recordPropertyHealth('test-property', HealthStatus.HEALTHY, 'OK');
          case 1:
            return recommendationMonitor.recordAccuracy('test-model', op.value / 100);
          case 2:
            return bookingMonitor.recordBookingSuccess('test-booking');
          case 3:
            return tenantMonitor.recordTenantActivity('test-tenant');
          default:
            return recommendationMonitor.recordLatency('test-model', op.value);
        }
      });

      await Promise.all(operations);

      const endUsage = process.cpuUsage(startUsage);
      const finalMemory = process.memoryUsage().heapUsed;

      const config = optimizer.getCurrentConfig();
      expect(config.samplingRate).toBeGreaterThan(0);

      const cpuMs = (endUsage.user + endUsage.system) / 1000;
      expect(cpuMs).toBeLessThan(5000); // Less than 5 seconds CPU time

      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024;
      expect(memoryIncrease).toBeLessThan(100); // Less than 100MB increase
    });
  });

  describe('Error Recovery', () => {
    it('should maintain performance during error scenarios', async () => {
      const startTime = performance.now();

      // Mix of successful and error-inducing operations
      const operations = [
        propertyMonitor.recordPropertyHealth('test-property', HealthStatus.HEALTHY, 'OK'),
        recommendationMonitor.recordAccuracy('test-model', 0.95),
        propertyMonitor.recordPropertyHealth('invalid-property', HealthStatus.UNHEALTHY, 'Error'),
        bookingMonitor.recordBookingSuccess('test-booking'),
        tenantMonitor.recordTenantActivity('test-tenant')
      ];

      try {
        await Promise.all(operations);
      } catch (error) {
        // Errors expected
      }

      const duration = performance.now() - startTime;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds despite errors
    });
  });
});
