import { 
  MonitoringProvider, 
  Metric, 
  ErrorEvent, 
  HealthCheck, 
  Span,
  MonitoringDomain,
  MetricSchema,
  ErrorEventSchema,
  HealthCheckSchema,
  SpanSchema,
  HealthStatus
} from '../domain/types';

export interface MonitoringProvider {
  recordMetric(metric: Metric): Promise<void>;
  recordHealth(entityId: string, status: HealthStatus, message: string): Promise<void>;
  recordError(error: Error): Promise<void>;
  recordLatency(operation: string, latencyMs: number): Promise<void>;
  recordAccuracy(modelId: string, accuracy: number): Promise<void>;
  recordSuccess(operation: string, success: boolean): Promise<void>;
  recordActivity(entityId: string, activity: string): Promise<void>;
}

export abstract class BaseMonitoringProvider implements MonitoringProvider {
  protected abstract name: string;
  protected spans: Map<string, Span> = new Map();

  async recordMetric(metric: Metric): Promise<void> {
    try {
      const validatedMetric = MetricSchema.parse(metric);
      await this.exportMetric(validatedMetric);
    } catch (error) {
      console.error(`[${this.name}] Failed to record metric:`, error);
      throw error;
    }
  }

  async recordHistogram(name: string, value: number, labels?: Record<string, string>): Promise<void> {
    const metric: Metric = {
      name,
      value,
      labels,
      timestamp: new Date(),
      type: 'HISTOGRAM',
      domain: MonitoringDomain.RECOMMENDATION
    };
    await this.recordMetric(metric);
  }

  async recordError(error: ErrorEvent): Promise<void> {
    try {
      const validatedError = ErrorEventSchema.parse(error);
      await this.exportError(validatedError);
    } catch (err) {
      console.error(`[${this.name}] Failed to record error:`, err);
      throw err;
    }
  }

  startSpan(domain: MonitoringDomain, name: string): Span {
    const span: Span = {
      domain,
      name,
      startTime: new Date(),
      attributes: {}
    };
    const validatedSpan = SpanSchema.parse(span);
    this.spans.set(name, validatedSpan);
    return validatedSpan;
  }

  async endSpan(span: Span): Promise<void> {
    try {
      const existingSpan = this.spans.get(span.name);
      if (!existingSpan) {
        throw new Error(`Span ${span.name} not found`);
      }
      
      const endedSpan: Span = {
        ...existingSpan,
        endTime: new Date()
      };
      
      const validatedSpan = SpanSchema.parse(endedSpan);
      await this.exportSpan(validatedSpan);
      this.spans.delete(span.name);
    } catch (error) {
      console.error(`[${this.name}] Failed to end span:`, error);
      throw error;
    }
  }

  async recordLatency(domain: MonitoringDomain, name: string, duration: number): Promise<void> {
    const metric: Metric = {
      domain,
      name: `${name}_latency`,
      type: 'HISTOGRAM',
      value: duration,
      timestamp: new Date()
    };
    await this.recordMetric(metric);
  }

  async recordHealthCheck(check: HealthCheck): Promise<void> {
    try {
      const validatedCheck = HealthCheckSchema.parse(check);
      await this.exportHealthCheck(validatedCheck);
    } catch (error) {
      console.error(`[${this.name}] Failed to record health check:`, error);
      throw error;
    }
  }

  abstract initialize(): Promise<void>;
  abstract shutdown(): Promise<void>;
  protected abstract exportMetric(metric: Metric): Promise<void>;
  protected abstract exportError(error: ErrorEvent): Promise<void>;
  protected abstract exportSpan(span: Span): Promise<void>;
  protected abstract exportHealthCheck(check: HealthCheck): Promise<void>;
}
