import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { MetricBatchProcessor } from '../../../src/monitoring/advanced/batch-processor';
import { MonitoringService } from '../../../src/monitoring/monitoring-service';
import { MonitoringDomain, MetricType } from '../../../src/monitoring/domain/types';

jest.mock('../../../src/monitoring/monitoring-service');

describe('MetricBatchProcessor', () => {
  let processor: MetricBatchProcessor;
  let mockMonitoringService: jest.Mocked<MonitoringService>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockMonitoringService = {
      getCurrentProvider: jest.fn().mockReturnValue({
        recordMetric: jest.fn().mockResolvedValue(undefined)
      })
    } as any;

    (MonitoringService.getInstance as jest.Mock).mockReturnValue(mockMonitoringService);
    processor = MetricBatchProcessor.getInstance();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('addMetric', () => {
    it('should batch metrics until threshold', async () => {
      const metric = {
        domain: MonitoringDomain.PROPERTY,
        name: 'test_metric',
        type: MetricType.COUNTER,
        value: 1,
        timestamp: new Date()
      };

      // Add metrics just below batch size
      for (let i = 0; i < 99; i++) {
        await processor.addMetric(metric);
      }

      expect(mockMonitoringService.getCurrentProvider().recordMetric).not.toHaveBeenCalled();

      // Add final metric to trigger batch
      await processor.addMetric(metric);

      expect(mockMonitoringService.getCurrentProvider().recordMetric).toHaveBeenCalledTimes(100);
    });

    it('should flush metrics on interval', async () => {
      const metric = {
        domain: MonitoringDomain.PROPERTY,
        name: 'test_metric',
        type: MetricType.COUNTER,
        value: 1,
        timestamp: new Date()
      };

      await processor.addMetric(metric);
      expect(mockMonitoringService.getCurrentProvider().recordMetric).not.toHaveBeenCalled();

      jest.advanceTimersByTime(5000); // Flush interval

      expect(mockMonitoringService.getCurrentProvider().recordMetric).toHaveBeenCalledTimes(1);
    });
  });

  describe('shutdown', () => {
    it('should flush remaining metrics', async () => {
      const metric = {
        domain: MonitoringDomain.PROPERTY,
        name: 'test_metric',
        type: MetricType.COUNTER,
        value: 1,
        timestamp: new Date()
      };

      await processor.addMetric(metric);
      expect(mockMonitoringService.getCurrentProvider().recordMetric).not.toHaveBeenCalled();

      await processor.shutdown();

      expect(mockMonitoringService.getCurrentProvider().recordMetric).toHaveBeenCalledTimes(1);
    });

    it('should handle flush errors gracefully', async () => {
      const metric = {
        domain: MonitoringDomain.PROPERTY,
        name: 'test_metric',
        type: MetricType.COUNTER,
        value: 1,
        timestamp: new Date()
      };

      mockMonitoringService.getCurrentProvider().recordMetric.mockRejectedValue(new Error('Flush failed'));

      await processor.addMetric(metric);
      await processor.shutdown();

      // Metrics should be requeued
      expect(mockMonitoringService.getCurrentProvider().recordMetric).toHaveBeenCalledTimes(1);
    });
  });
});
