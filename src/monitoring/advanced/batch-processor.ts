import { MonitoringService } from '../monitoring-service';
import { Metric } from '../domain/types';

export class MetricBatchProcessor {
  private static instance: MetricBatchProcessor;
  private monitoringService: MonitoringService;
  private batchSize: number = 100;
  private flushIntervalMs: number = 5000;
  private metricQueue: Metric[] = [];
  private flushTimer?: NodeJS.Timeout;

  private constructor() {
    this.monitoringService = MonitoringService.getInstance();
    this.startFlushTimer();
  }

  static getInstance(): MetricBatchProcessor {
    if (!MetricBatchProcessor.instance) {
      MetricBatchProcessor.instance = new MetricBatchProcessor();
    }
    return MetricBatchProcessor.instance;
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.flushIntervalMs);
  }

  async addMetric(metric: Metric): Promise<void> {
    this.metricQueue.push(metric);
    
    if (this.metricQueue.length >= this.batchSize) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.metricQueue.length === 0) return;

    const metrics = [...this.metricQueue];
    this.metricQueue = [];

    try {
      // Process metrics in parallel batches
      const batchPromises = metrics.map(metric => 
        this.monitoringService.getCurrentProvider().recordMetric(metric)
      );
      
      await Promise.all(batchPromises);
    } catch (error) {
      console.error('Failed to flush metrics:', error);
      // Requeue failed metrics
      this.metricQueue.push(...metrics);
    }
  }

  async shutdown(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }
}
