import { Monitoring } from '@google-cloud/monitoring';
import { MonitoringProvider } from './base-provider';
import { Metric, ErrorEvent, HealthCheck, Span, HealthStatus } from '../domain/types';

interface StackdriverConfig {
  projectId: string;
  credentials: any;
}

export class StackdriverProvider implements MonitoringProvider {
  private projectId: string;
  private credentials: any;
  private client: Monitoring;

  constructor(config: StackdriverConfig) {
    this.projectId = config.projectId;
    this.credentials = config.credentials;
    this.client = new Monitoring({
      projectId: this.projectId,
      credentials: this.credentials,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Verify credentials and project access
      await this.client.projectPath(this.projectId);
      console.log('[Stackdriver] Initialized successfully');
    } catch (error) {
      console.error('[Stackdriver] Initialization failed:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    try {
      await this.client.close();
      console.log('[Stackdriver] Shut down successfully');
    } catch (error) {
      console.error('[Stackdriver] Shutdown failed:', error);
      throw error;
    }
  }

  async recordMetric(metric: Metric): Promise<void> {
    const timeSeriesData = {
      metric: {
        type: `custom.googleapis.com/${metric.domain.toLowerCase()}/${metric.name}`,
        labels: metric.labels || {},
      },
      resource: {
        type: 'global',
        labels: {
          project_id: this.projectId,
        },
      },
      points: [
        {
          interval: {
            endTime: {
              seconds: Math.floor(metric.timestamp.getTime() / 1000),
              nanos: (metric.timestamp.getTime() % 1000) * 1e6,
            },
          },
          value: {
            doubleValue: metric.value,
          },
        },
      ],
    };

    try {
      await this.client
        .projectPath(this.projectId)
        .timeSeries.create({ name: timeSeriesData.metric.type, timeSeries: [timeSeriesData] });
    } catch (error) {
      console.error('[Stackdriver] Failed to record metric:', error);
      throw error;
    }
  }

  async recordHealth(entityId: string, status: HealthStatus, message: string): Promise<void> {
    const metric: Metric = {
      domain: 'health',
      name: `${entityId}_health`,
      type: 'GAUGE',
      value: status === 'HEALTHY' ? 1 : 0,
      labels: {
        status: status.toString(),
        message: message || '',
      },
      timestamp: new Date(),
    };

    await this.recordMetric(metric);
  }

  async recordError(error: ErrorEvent): Promise<void> {
    const logName = 'errors';
    const entry = {
      severity: error.severity,
      message: error.error.message,
      stack: error.error.stack,
      context: error.context || {},
      timestamp: error.timestamp,
    };

    try {
      await this.client
        .projectPath(this.projectId)
        .logs.write({ logName, entries: [entry] });
    } catch (err) {
      console.error('[Stackdriver] Failed to record error:', err);
      throw err;
    }
  }

  async recordLatency(operation: string, latencyMs: number): Promise<void> {
    const metric: Metric = {
      domain: 'latency',
      name: operation,
      type: 'GAUGE',
      value: latencyMs,
      labels: {},
      timestamp: new Date(),
    };

    await this.recordMetric(metric);
  }

  async recordAccuracy(modelId: string, accuracy: number): Promise<void> {
    const metric: Metric = {
      domain: 'accuracy',
      name: modelId,
      type: 'GAUGE',
      value: accuracy,
      labels: {},
      timestamp: new Date(),
    };

    await this.recordMetric(metric);
  }

  async recordSuccess(operation: string, success: boolean): Promise<void> {
    const metric: Metric = {
      domain: 'success',
      name: operation,
      type: 'GAUGE',
      value: success ? 1 : 0,
      labels: {},
      timestamp: new Date(),
    };

    await this.recordMetric(metric);
  }

  async recordActivity(entityId: string, activity: string): Promise<void> {
    const metric: Metric = {
      domain: 'activity',
      name: entityId,
      type: 'GAUGE',
      value: 1,
      labels: {
        activity: activity,
      },
      timestamp: new Date(),
    };

    await this.recordMetric(metric);
  }
}
