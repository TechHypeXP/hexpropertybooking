import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { MonitoringOptimizer } from '../../../src/monitoring/advanced/monitoring-optimizer';
import { MonitoringService } from '../../../src/monitoring/monitoring-service';
import { MetricBatchProcessor } from '../../../src/monitoring/advanced/batch-processor';
import { PerformanceAnalyzer } from '../../../src/monitoring/advanced/performance-analyzer';
import { MonitoringDomain } from '../../../src/monitoring/domain/types';

jest.mock('../../../src/monitoring/monitoring-service');
jest.mock('../../../src/monitoring/advanced/batch-processor');
jest.mock('../../../src/monitoring/advanced/performance-analyzer');

describe('MonitoringOptimizer', () => {
  let optimizer: MonitoringOptimizer;
  let mockMonitoringService: jest.Mocked<MonitoringService>;
  let mockBatchProcessor: jest.Mocked<MetricBatchProcessor>;
  let mockPerformanceAnalyzer: jest.Mocked<PerformanceAnalyzer>;

  beforeEach(() => {
    mockMonitoringService = {
      getCurrentProvider: jest.fn().mockReturnValue({
        recordMetric: jest.fn().mockResolvedValue(undefined)
      })
    } as any;

    mockBatchProcessor = {
      shutdown: jest.fn().mockResolvedValue(undefined)
    } as any;

    mockPerformanceAnalyzer = {
      getMetrics: jest.fn().mockReturnValue({
        p99: 75,
        mean: 50
      })
    } as any;

    (MonitoringService.getInstance as jest.Mock).mockReturnValue(mockMonitoringService);
    (MetricBatchProcessor.getInstance as jest.Mock).mockReturnValue(mockBatchProcessor);
    (PerformanceAnalyzer.getInstance as jest.Mock).mockReturnValue(mockPerformanceAnalyzer);

    optimizer = MonitoringOptimizer.getInstance();
  });

  describe('updateConfig', () => {
    it('should update configuration and apply optimizations', () => {
      optimizer.updateConfig({
        batchingEnabled: false,
        performanceAnalysisEnabled: false
      });

      expect(mockBatchProcessor.shutdown).toHaveBeenCalled();
    });
  });

  describe('optimizeMonitoring', () => {
    it('should adjust sampling rate based on performance metrics', async () => {
      mockPerformanceAnalyzer.getMetrics.mockReturnValue({
        p99: 150, // High latency
        mean: 100
      });

      await optimizer.optimizeMonitoring(MonitoringDomain.PROPERTY);

      expect(mockMonitoringService.getCurrentProvider().recordMetric).toHaveBeenCalledWith(
        expect.objectContaining({
          domain: MonitoringDomain.PROPERTY,
          name: 'monitoring_sampling_rate',
          value: expect.any(Number)
        })
      );
    });

    it('should not adjust sampling when adaptive thresholds disabled', async () => {
      optimizer.updateConfig({ adaptiveThresholds: false });

      await optimizer.optimizeMonitoring(MonitoringDomain.PROPERTY);

      expect(mockMonitoringService.getCurrentProvider().recordMetric).not.toHaveBeenCalled();
    });
  });

  describe('analyzeMonitoringImpact', () => {
    it('should measure monitoring system impact', async () => {
      const impact = await optimizer.analyzeMonitoringImpact();

      expect(impact).toMatchObject({
        cpuImpact: expect.any(Number),
        memoryImpact: expect.any(Number),
        networkImpact: expect.any(Number)
      });
    });
  });

  describe('getOptimizationStats', () => {
    it('should return current optimization configuration and impact', () => {
      const stats = optimizer.getOptimizationStats();

      expect(stats).toMatchObject({
        batchingEnabled: expect.any(Boolean),
        samplingRate: expect.any(Number),
        performanceAnalysisEnabled: expect.any(Boolean),
        adaptiveThresholds: expect.any(Boolean),
        currentImpact: {
          cpu: expect.any(Number),
          memory: expect.any(Number),
          network: expect.any(Number)
        }
      });
    });
  });
});
