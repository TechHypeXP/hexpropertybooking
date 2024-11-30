import { describe, it, beforeEach, expect, jest } from '@jest/globals';
import { MetricBatchProcessor } from '../../../src/monitoring/advanced/metric-batch-processor';
import { MonitoringOptimizer } from '../../../src/monitoring/advanced/monitoring-optimizer';
import { PerformanceAnalyzer } from '../../../src/monitoring/advanced/performance-analyzer';
import { MetricData, OptimizationConfig } from '../../../src/monitoring/domain/types';

describe('Monitoring System Optimization Tests', () => {
  let batchProcessor: MetricBatchProcessor;
  let optimizer: MonitoringOptimizer;
  let performanceAnalyzer: PerformanceAnalyzer;

  beforeEach(() => {
    batchProcessor = new MetricBatchProcessor();
    optimizer = new MonitoringOptimizer();
    performanceAnalyzer = new PerformanceAnalyzer();
  });

  describe('Batch Processing Optimization', () => {
    it('should optimize batch processing performance', async () => {
      const metrics: MetricData[] = Array(100).fill(null).map((_, i) => ({
        name: `metric_${i}`,
        value: Math.random(),
        timestamp: new Date(),
        labels: { test: 'true' }
      }));

      const startTime = process.hrtime();
      await batchProcessor.process(metrics);
      const [seconds, nanoseconds] = process.hrtime(startTime);
      const processingTime = seconds * 1000 + nanoseconds / 1e6;

      expect(processingTime).toBeLessThan(1000); // Should process within 1 second
    });

    it('should determine optimal batch size', async () => {
      const optimalSize = optimizer.getOptimalBatchSize();
      expect(optimalSize).toBeGreaterThan(0);
      expect(optimalSize).toBeLessThan(10000); // Reasonable upper limit
    });
  });

  describe('Resource Optimization', () => {
    it('should optimize memory usage', async () => {
      const config: OptimizationConfig = {
        memoryThreshold: 80, // 80% memory threshold
        cpuThreshold: 70,    // 70% CPU threshold
        batchSize: 100,
        samplingRate: 0.1
      };

      optimizer.updateConfig(config);

      const metrics: MetricData[] = Array(1000).fill(null).map((_, i) => ({
        name: `metric_${i}`,
        value: Math.random(),
        timestamp: new Date(),
        labels: { test: 'true' }
      }));

      const initialMemory = process.memoryUsage().heapUsed;
      await batchProcessor.process(metrics);
      const finalMemory = process.memoryUsage().heapUsed;

      const memoryIncrease = (finalMemory - initialMemory) / 1024 / 1024; // MB
      expect(memoryIncrease).toBeLessThan(50); // Less than 50MB increase
    });

    it('should optimize CPU usage', async () => {
      const config: OptimizationConfig = {
        memoryThreshold: 80,
        cpuThreshold: 70,
        batchSize: 50,
        samplingRate: 0.2
      };

      optimizer.updateConfig(config);

      const metrics: MetricData[] = Array(500).fill(null).map((_, i) => ({
        name: `metric_${i}`,
        value: Math.random(),
        timestamp: new Date(),
        labels: { test: 'true' }
      }));

      const startUsage = process.cpuUsage();
      await batchProcessor.process(metrics);
      const endUsage = process.cpuUsage(startUsage);

      const totalCPUMs = (endUsage.user + endUsage.system) / 1000; // Convert to ms
      expect(totalCPUMs).toBeLessThan(1000); // Less than 1 second CPU time
    });
  });

  describe('Performance Analysis', () => {
    it('should analyze and optimize performance metrics', async () => {
      performanceAnalyzer.updateMetrics({
        batchProcessingTime: 100,
        memoryUsage: 50,
        cpuUsage: 30,
        errorRate: 0.01
      });

      const config = optimizer.getCurrentConfig();
      expect(config).toBeDefined();
      expect(config.samplingRate).toBeGreaterThan(0);
      expect(config.samplingRate).toBeLessThanOrEqual(1);
    });
  });
});
