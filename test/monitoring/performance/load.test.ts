import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import { PropertyMonitor } from '../../../src/monitoring/domain/property-monitor';
import { RecommendationMonitor } from '../../../src/monitoring/domain/recommendation-monitor';
import { BookingMonitor } from '../../../src/monitoring/domain/booking-monitor';
import { TenantMonitor } from '../../../src/monitoring/domain/tenant-monitor';
import { HealthStatus } from '../../../src/monitoring/domain/types';
import { StackdriverProvider } from '../../../src/monitoring/providers/stackdriver-provider';

describe('Monitoring System Load Tests', () => {
  let propertyMonitor: PropertyMonitor;
  let recommendationMonitor: RecommendationMonitor;
  let bookingMonitor: BookingMonitor;
  let tenantMonitor: TenantMonitor;
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
  });

  describe('High Load Performance', () => {
    it('should handle high concurrent load', async () => {
      const operations = {
        property: () => propertyMonitor.recordPropertyHealth('test-property', HealthStatus.HEALTHY, 'OK'),
        recommendation: () => recommendationMonitor.recordAccuracy('test-model', 0.95),
        booking: () => bookingMonitor.recordBookingSuccess('test-booking'),
        tenant: () => tenantMonitor.recordTenantActivity('test-tenant')
      };

      const startTime = process.hrtime();

      // Run 1000 operations of each type concurrently
      await Promise.all(
        Array(1000)
          .fill(null)
          .flatMap(() => Object.values(operations).map(op => op()))
      );

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalMs = seconds * 1000 + nanoseconds / 1e6;

      // High load operations should complete within reasonable time
      expect(totalMs).toBeLessThan(10000); // Should complete within 10 seconds
    });
  });

  describe('Sustained Load Performance', () => {
    it('should maintain performance under sustained load', async () => {
      const iterations = 10;
      const operationsPerIteration = 100;
      const timings: number[] = [];

      for (let i = 0; i < iterations; i++) {
        const startTime = process.hrtime();

        await Promise.all([
          ...Array(operationsPerIteration).fill(null).map(() =>
            propertyMonitor.recordPropertyHealth('test-property', HealthStatus.HEALTHY, 'OK')
          ),
          ...Array(operationsPerIteration).fill(null).map(() =>
            recommendationMonitor.recordAccuracy('test-model', 0.95)
          ),
          ...Array(operationsPerIteration).fill(null).map(() =>
            bookingMonitor.recordBookingSuccess('test-booking')
          ),
          ...Array(operationsPerIteration).fill(null).map(() =>
            tenantMonitor.recordTenantActivity('test-tenant')
          )
        ]);

        const [seconds, nanoseconds] = process.hrtime(startTime);
        timings.push(seconds * 1000 + nanoseconds / 1e6);
      }

      // Calculate performance degradation
      const firstTiming = timings[0];
      const lastTiming = timings[timings.length - 1];
      const degradation = (lastTiming - firstTiming) / firstTiming;

      // Performance should not degrade more than 20%
      expect(degradation).toBeLessThan(0.2);
    });
  });

  describe('Error Handling Under Load', () => {
    it('should handle errors gracefully under load', async () => {
      const errorCount = { value: 0 };
      const totalOperations = 1000;

      const operations = Array(totalOperations).fill(null).map(async (_, index) => {
        try {
          if (index % 2 === 0) {
            // Simulate error conditions
            await propertyMonitor.recordPropertyHealth('invalid-property', HealthStatus.UNHEALTHY, 'Error');
          } else {
            await propertyMonitor.recordPropertyHealth('test-property', HealthStatus.HEALTHY, 'OK');
          }
        } catch (error) {
          errorCount.value++;
        }
      });

      await Promise.all(operations);

      // Error rate should be reasonable
      const errorRate = errorCount.value / totalOperations;
      expect(errorRate).toBeLessThan(0.1); // Less than 10% error rate
    });
  });
});
