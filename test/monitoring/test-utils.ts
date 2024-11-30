import { MonitoringProvider } from '../../src/monitoring/providers/base-provider';
import { Metric, ErrorEvent, HealthCheck, Span, MonitoringDomain, MetricType, HealthStatus } from '../../src/monitoring/domain/types';

export class MockMonitoringProvider implements MonitoringProvider {
  metrics: Metric[] = [];
  errors: ErrorEvent[] = [];
  healthChecks: HealthCheck[] = [];
  spans: Span[] = [];

  async recordMetric(metric: Metric): Promise<void> {
    this.metrics.push(metric);
  }

  async recordHistogram(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    await this.recordMetric({
      domain: MonitoringDomain.PROPERTY,
      name,
      type: MetricType.HISTOGRAM,
      value,
      labels,
      timestamp: new Date()
    });
  }

  async recordError(error: ErrorEvent): Promise<void> {
    this.errors.push(error);
  }

  startSpan(domain: MonitoringDomain, name: string): Span {
    const span: Span = {
      domain,
      name,
      startTime: new Date()
    };
    this.spans.push(span);
    return span;
  }

  async endSpan(span: Span): Promise<void> {
    const index = this.spans.findIndex(s => s.name === span.name);
    if (index !== -1) {
      this.spans[index] = { ...span, endTime: new Date() };
    }
  }

  async recordHealthCheck(check: HealthCheck): Promise<void> {
    this.healthChecks.push(check);
  }

  async initialize(): Promise<void> {}
  async shutdown(): Promise<void> {}

  reset(): void {
    this.metrics = [];
    this.errors = [];
    this.healthChecks = [];
    this.spans = [];
  }

  getMetricsByDomain(domain: MonitoringDomain): Metric[] {
    return this.metrics.filter(m => m.domain === domain);
  }

  getHealthChecksByDomain(domain: MonitoringDomain): HealthCheck[] {
    return this.healthChecks.filter(h => h.domain === domain);
  }

  getSpansByDomain(domain: MonitoringDomain): Span[] {
    return this.spans.filter(s => s.domain === domain);
  }
}
