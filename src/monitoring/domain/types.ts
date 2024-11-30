import { z } from 'zod';

export enum MonitoringDomain {
  PROPERTY = 'PROPERTY',
  TENANT = 'TENANT',
  BOOKING = 'BOOKING',
  RECOMMENDATION = 'RECOMMENDATION',
}

export enum MetricType {
  COUNTER = 'COUNTER',
  GAUGE = 'GAUGE',
  HISTOGRAM = 'HISTOGRAM',
  SUMMARY = 'SUMMARY',
}

export enum AlertSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum HealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  UNHEALTHY = 'UNHEALTHY',
}

export interface Metric {
  name: string;
  value: number;
  timestamp: number;
  labels?: Record<string, string>;
  unit?: string;
}

export interface Span {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  attributes?: Record<string, string | number | boolean>;
  parentId?: string;
}

export interface MetricSchema {
  name: string;
  description: string;
  unit: string;
  type: 'counter' | 'gauge' | 'histogram';
  labels?: string[];
}

export interface ErrorEventSchema {
  name: string;
  message: string;
  stack?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  context?: Record<string, any>;
}

export interface HealthCheckSchema {
  entityId: string;
  status: HealthStatus;
  message: string;
  timestamp: number;
  details?: Record<string, any>;
}

export interface SpanSchema {
  name: string;
  type: string;
  description: string;
  attributes?: Record<string, string>;
}

export const MetricZodSchema = z.object({
  domain: z.nativeEnum(MonitoringDomain),
  name: z.string(),
  type: z.nativeEnum(MetricType),
  value: z.number(),
  labels: z.record(z.string()).optional(),
  timestamp: z.date(),
});

export const ErrorEventZodSchema = z.object({
  domain: z.nativeEnum(MonitoringDomain),
  error: z.instanceof(Error),
  severity: z.nativeEnum(AlertSeverity),
  context: z.record(z.unknown()).optional(),
  timestamp: z.date(),
});

export const HealthCheckZodSchema = z.object({
  domain: z.nativeEnum(MonitoringDomain),
  component: z.string(),
  status: z.nativeEnum(HealthStatus),
  message: z.string().optional(),
  timestamp: z.date(),
});

export const SpanZodSchema = z.object({
  domain: z.nativeEnum(MonitoringDomain),
  name: z.string(),
  startTime: z.date(),
  endTime: z.date().optional(),
  attributes: z.record(z.unknown()).optional(),
  parentSpanId: z.string().optional(),
});

export type MetricZod = z.infer<typeof MetricZodSchema>;
export type ErrorEventZod = z.infer<typeof ErrorEventZodSchema>;
export type HealthCheckZod = z.infer<typeof HealthCheckZodSchema>;
export type SpanZod = z.infer<typeof SpanZodSchema>;

export interface MonitoringProvider {
  // Metric Recording
  recordMetric(metric: MetricZod): Promise<void>;
  recordHistogram(name: string, value: number, labels?: Record<string, string>): Promise<void>;
  
  // Error Tracking
  recordError(error: ErrorEventZod): Promise<void>;
  
  // Performance Monitoring
  startSpan(domain: MonitoringDomain, name: string): SpanZod;
  endSpan(span: SpanZod): Promise<void>;
  recordLatency(domain: MonitoringDomain, name: string, duration: number): Promise<void>;
  
  // Health Checks
  recordHealthCheck(check: HealthCheckZod): Promise<void>;
  
  // Provider Management
  initialize(): Promise<void>;
  shutdown(): Promise<void>;
}
