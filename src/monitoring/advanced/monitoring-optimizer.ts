import { MonitoringService } from '../monitoring-service';
import { MetricBatchProcessor } from './batch-processor';
import { PerformanceAnalyzer } from './performance-analyzer';
import { MonitoringDomain } from '../domain/types';

interface OptimizationConfig {
  batchingEnabled: boolean;
  samplingRate: number;
  performanceAnalysisEnabled: boolean;
  adaptiveThresholds: boolean;
}

export class MonitoringOptimizer {
  private static instance: MonitoringOptimizer;
  private monitoringService: MonitoringService;
  private batchProcessor: MetricBatchProcessor;
  private performanceAnalyzer: PerformanceAnalyzer;
  private config: OptimizationConfig;

  private constructor() {
    this.monitoringService = MonitoringService.getInstance();
    this.batchProcessor = MetricBatchProcessor.getInstance();
    this.performanceAnalyzer = PerformanceAnalyzer.getInstance();
    
    this.config = {
      batchingEnabled: true,
      samplingRate: 1.0,
      performanceAnalysisEnabled: true,
      adaptiveThresholds: true
    };
  }

  static getInstance(): MonitoringOptimizer {
    if (!MonitoringOptimizer.instance) {
      MonitoringOptimizer.instance = new MonitoringOptimizer();
    }
    return MonitoringOptimizer.instance;
  }

  updateConfig(config: Partial<OptimizationConfig>): void {
    this.config = { ...this.config, ...config };
    this.applyOptimizations();
  }

  private applyOptimizations(): void {
    if (!this.config.batchingEnabled) {
      this.batchProcessor.shutdown();
    }

    if (!this.config.performanceAnalysisEnabled) {
      // Clear performance analysis data
      this.performanceAnalyzer = PerformanceAnalyzer.getInstance();
    }
  }

  shouldSample(): boolean {
    return Math.random() < this.config.samplingRate;
  }

  async optimizeMonitoring(domain: MonitoringDomain): Promise<void> {
    if (!this.config.adaptiveThresholds) return;

    const metrics = this.performanceAnalyzer.getMetrics(domain, 'all');
    if (!metrics) return;

    // Adjust sampling rate based on performance
    if (metrics.p99 > 100) { // High latency threshold (ms)
      this.updateConfig({
        samplingRate: Math.max(0.1, this.config.samplingRate - 0.1)
      });
    } else if (metrics.p99 < 50) { // Low latency threshold (ms)
      this.updateConfig({
        samplingRate: Math.min(1.0, this.config.samplingRate + 0.1)
      });
    }

    // Record optimization metrics
    await this.monitoringService.getCurrentProvider().recordMetric({
      domain,
      name: 'monitoring_sampling_rate',
      type: 'GAUGE',
      value: this.config.samplingRate,
      timestamp: new Date()
    });
  }

  async analyzeMonitoringImpact(): Promise<{
    cpuImpact: number;
    memoryImpact: number;
    networkImpact: number;
  }> {
    const startStats = process.cpuUsage();
    const startMem = process.memoryUsage();

    // Perform sample monitoring operations
    await this.monitoringService.getCurrentProvider().recordMetric({
      domain: MonitoringDomain.PROPERTY,
      name: 'test_metric',
      type: 'COUNTER',
      value: 1,
      timestamp: new Date()
    });

    const endStats = process.cpuUsage(startStats);
    const endMem = process.memoryUsage();

    return {
      cpuImpact: (endStats.user + endStats.system) / 1000000, // Convert to seconds
      memoryImpact: (endMem.heapUsed - startMem.heapUsed) / 1024 / 1024, // Convert to MB
      networkImpact: 0 // Would need external monitoring for accurate network impact
    };
  }

  getOptimizationStats(): OptimizationConfig & {
    currentImpact: {
      cpu: number;
      memory: number;
      network: number;
    };
  } {
    return {
      ...this.config,
      currentImpact: {
        cpu: 0, // Would need continuous monitoring
        memory: 0,
        network: 0
      }
    };
  }
}
