import client from 'prom-client';
import { BaseMonitoringProvider } from './base-provider';
import { 
  Metric, 
  ErrorEvent, 
  HealthCheck, 
  Span,
  MetricType
} from '../domain/types';

export class PrometheusProvider extends BaseMonitoringProvider {
  protected name = 'Prometheus';
  private registry: client.Registry;
  private metrics: Map<string, client.Counter | client.Gauge | client.Histogram> = new Map();

  constructor() {
    super();
    this.registry = new client.Registry();
  }

  async initialize(): Promise<void> {
    try {
      // Enable default metrics
      client.collectDefaultMetrics({ register: this.registry });
      console.log(`[${this.name}] Initialized successfully`);
    } catch (error) {
      console.error(`[${this.name}] Initialization failed:`, error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      this.registry.clear();
      console.log(`[${this.name}] Shut down successfully`);
    } catch (error) {
      console.error(`[${this.name}] Shutdown failed:`, error);
      throw error;
    }
  }

  protected async exportMetric(metric: Metric): Promise<void> {
    try {
      const metricName = `${metric.domain.toLowerCase()}_${metric.name}`;
      let prometheusMetric = this.metrics.get(metricName);

      if (!prometheusMetric) {
        prometheusMetric = this.createMetric(metric);
        this.metrics.set(metricName, prometheusMetric);
      }

      if (metric.type === MetricType.HISTOGRAM) {
        (prometheusMetric as client.Histogram).observe(metric.value);
      } else if (metric.type === MetricType.GAUGE) {
        (prometheusMetric as client.Gauge).set(metric.value);
      } else {
        (prometheusMetric as client.Counter).inc(metric.value);
      }
    } catch (error) {
      console.error(`[${this.name}] Failed to export metric:`, error);
      throw error;
    }
  }

  private createMetric(metric: Metric): client.Counter | client.Gauge | client.Histogram {
    const name = `${metric.domain.toLowerCase()}_${metric.name}`;
    const labelNames = metric.labels ? Object.keys(metric.labels) : [];

    switch (metric.type) {
      case MetricType.COUNTER:
        return new client.Counter({
          name,
          help: `Counter for ${metric.name}`,
          labelNames,
          registers: [this.registry]
        });

      case MetricType.GAUGE:
        return new client.Gauge({
          name,
          help: `Gauge for ${metric.name}`,
          labelNames,
          registers: [this.registry]
        });

      case MetricType.HISTOGRAM:
        return new client.Histogram({
          name,
          help: `Histogram for ${metric.name}`,
          labelNames,
          registers: [this.registry]
        });

      default:
        throw new Error(`Unsupported metric type: ${metric.type}`);
    }
  }

  protected async exportError(error: ErrorEvent): Promise<void> {
    const errorCounter = new client.Counter({
      name: `${error.domain.toLowerCase()}_errors_total`,
      help: 'Counter for errors',
      labelNames: ['severity', 'type'],
      registers: [this.registry]
    });

    errorCounter.inc({
      severity: error.severity,
      type: error.error.name
    });
  }

  protected async exportSpan(span: Span): Promise<void> {
    if (!span.endTime) {
      throw new Error('Span must have an end time');
    }

    const duration = span.endTime.getTime() - span.startTime.getTime();
    const histogram = new client.Histogram({
      name: `${span.domain.toLowerCase()}_${span.name}_duration_seconds`,
      help: `Duration of ${span.name}`,
      registers: [this.registry]
    });

    histogram.observe(duration / 1000); // Convert to seconds
  }

  protected async exportHealthCheck(check: HealthCheck): Promise<void> {
    const gauge = new client.Gauge({
      name: `${check.domain.toLowerCase()}_${check.component}_health`,
      help: `Health status of ${check.component}`,
      labelNames: ['status', 'message'],
      registers: [this.registry]
    });

    gauge.set(
      { 
        status: check.status, 
        message: check.message || '' 
      },
      check.status === 'HEALTHY' ? 1 : 0
    );
  }

  // Method to expose metrics for scraping
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }
}
