import { describe, it, beforeEach, afterEach, expect, jest } from '@jest/globals';
import { PropertyMonitor } from '../../../src/monitoring/domain/property-monitor';
import { RecommendationMonitor } from '../../../src/monitoring/domain/recommendation-monitor';
import { BookingMonitor } from '../../../src/monitoring/domain/booking-monitor';
import { TenantMonitor } from '../../../src/monitoring/domain/tenant-monitor';
import { HealthStatus } from '../../../src/monitoring/domain/types';
import { StackdriverProvider } from '../../../src/monitoring/providers/stackdriver-provider';

describe('Monitoring System Baseline Performance Tests', () => {
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

  describe('Single Operation Performance', () => {
    it('should measure individual operation latency', async () => {
      const startTime = process.hrtime();

      await Promise.all([
        propertyMonitor.recordPropertyHealth('test-property', HealthStatus.HEALTHY, 'OK'),
        recommendationMonitor.recordAccuracy('test-model', 0.95),
        bookingMonitor.recordBookingSuccess('test-booking'),
        tenantMonitor.recordTenantActivity('test-tenant')
      ]);

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalMs = seconds * 1000 + nanoseconds / 1e6;

      expect(totalMs).toBeLessThan(1000); // Should complete within 1 second
    });
  });

  describe('Batch Operation Performance', () => {
    it('should handle multiple concurrent operations efficiently', async () => {
      const operations = {
        property: () => propertyMonitor.recordPropertyHealth('test-property', HealthStatus.HEALTHY, 'OK'),
        recommendation: () => recommendationMonitor.recordAccuracy('test-model', 0.95),
        booking: () => bookingMonitor.recordBookingSuccess('test-booking'),
        tenant: () => tenantMonitor.recordTenantActivity('test-tenant')
      };

      const startTime = process.hrtime();

      // Run 100 operations of each type concurrently
      await Promise.all(
        Array(100)
          .fill(null)
          .flatMap(() => Object.values(operations).map(op => op()))
      );

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const totalMs = seconds * 1000 + nanoseconds / 1e6;

      // Batch operations should complete within reasonable time
      expect(totalMs).toBeLessThan(5000); // Should complete within 5 seconds
    });
  });

  describe('Resource Usage', () => {
    it('should maintain reasonable memory usage', async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Perform intensive monitoring operations
      await Promise.all([
        ...Array(1000).fill(null).map(() => 
          propertyMonitor.recordPropertyHealth('test-property', HealthStatus.HEALTHY, 'OK')
        ),
        ...Array(1000).fill(null).map(() => 
          recommendationMonitor.recordAccuracy('test-model', 0.95)
        ),
        ...Array(1000).fill(null).map(() => 
          bookingMonitor.recordBookingSuccess('test-booking')
        ),
        ...Array(1000).fill(null).map(() => 
          tenantMonitor.recordTenantActivity('test-tenant')
        )
      ]);

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});
