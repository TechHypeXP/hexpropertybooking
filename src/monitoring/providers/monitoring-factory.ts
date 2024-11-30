import { z } from 'zod';
import { MonitoringProvider, HealthStatus } from '../domain/types';
import { StackdriverProvider } from './stackdriver-provider';
import { PrometheusProvider } from './prometheus-provider';

const MonitoringConfigSchema = z.object({
  provider: z.enum(['primary', 'secondary']),
  projectId: z.string().optional(),
  errorTracking: z.object({
    provider: z.enum(['sentry', 'gcops']),
    config: z.record(z.unknown())
  }),
  performance: z.object({
    provider: z.enum(['gcops', 'grafana']),
    config: z.record(z.unknown())
  }),
  metrics: z.object({
    provider: z.enum(['stackdriver', 'prometheus']),
    config: z.record(z.unknown())
  })
});

export type MonitoringConfig = z.infer<typeof MonitoringConfigSchema>;

interface HealthCheckResult {
  status: HealthStatus;
  message?: string;
  details?: Record<string, any>;
}

export class MonitoringFactory {
  private static instance: MonitoringFactory;
  private currentProvider?: MonitoringProvider;
  private config?: MonitoringConfig;
  private providerHealth: HealthCheckResult = {
    status: HealthStatus.UNHEALTHY
  };

  private constructor() {}

  static getInstance(): MonitoringFactory {
    if (!MonitoringFactory.instance) {
      MonitoringFactory.instance = new MonitoringFactory();
    }
    return MonitoringFactory.instance;
  }

  async validateConfig(config: MonitoringConfig): Promise<void> {
    try {
      // Validate schema
      MonitoringConfigSchema.parse(config);

      // Validate provider-specific configurations
      if (config.metrics.provider === 'stackdriver' && !config.projectId) {
        throw new Error('Stackdriver provider requires projectId');
      }

      // Validate provider compatibility
      if (config.metrics.provider === 'stackdriver' && 
          config.errorTracking.provider !== 'gcops') {
        console.warn('Stackdriver metrics provider works best with GCOPS error tracking');
      }

      console.log('[MonitoringFactory] Configuration validated successfully');
    } catch (error) {
      console.error('[MonitoringFactory] Configuration validation failed:', error);
      throw error;
    }
  }

  async initialize(config: MonitoringConfig): Promise<void> {
    try {
      this.config = MonitoringConfigSchema.parse(config);
      await this.switchProvider(this.config.provider);
    } catch (error) {
      console.error('[MonitoringFactory] Failed to initialize:', error);
      throw error;
    }
  }

  async switchProvider(type: 'primary' | 'secondary'): Promise<void> {
    if (!this.config) {
      throw new Error('Monitoring not initialized');
    }

    try {
      // Shutdown current provider if exists
      if (this.currentProvider) {
        await this.currentProvider.shutdown();
      }

      // Create and initialize new provider
      this.currentProvider = this.createProvider(type);
      await this.currentProvider.initialize();

      // Update health status
      this.providerHealth = await this.checkProviderHealth();

      console.log(`[MonitoringFactory] Switched to ${type} provider successfully`);
    } catch (error) {
      console.error(`[MonitoringFactory] Failed to switch to ${type} provider:`, error);
      throw error;
    }
  }

  async checkProviderHealth(): Promise<HealthCheckResult> {
    if (!this.currentProvider) {
      return {
        status: HealthStatus.UNHEALTHY,
        message: 'No provider initialized'
      };
    }

    try {
      // Basic connectivity check
      await this.currentProvider.recordMetric({
        name: 'monitoring_health_check',
        value: 1,
        timestamp: new Date(),
        labels: { provider: this.config?.metrics.provider }
      });

      this.providerHealth = {
        status: HealthStatus.HEALTHY,
        message: 'Provider is healthy',
        details: {
          provider: this.config?.metrics.provider,
          timestamp: new Date()
        }
      };
    } catch (error) {
      this.providerHealth = {
        status: HealthStatus.UNHEALTHY,
        message: 'Provider health check failed',
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        }
      };
    }

    return this.providerHealth;
  }

  getCurrentProvider(): MonitoringProvider {
    if (!this.currentProvider) {
      throw new Error('No monitoring provider initialized');
    }
    return this.currentProvider;
  }

  async shutdown(): Promise<void> {
    if (this.currentProvider) {
      await this.currentProvider.shutdown();
      this.currentProvider = undefined;
      this.config = undefined;
      this.providerHealth = {
        status: HealthStatus.UNHEALTHY,
        message: 'Provider shut down'
      };
    }
  }

  private createProvider(type: 'primary' | 'secondary'): MonitoringProvider {
    if (!this.config) {
      throw new Error('Configuration not initialized');
    }

    const { metrics } = this.config;
    switch (metrics.provider) {
      case 'stackdriver':
        return new StackdriverProvider({
          projectId: this.config.projectId!,
          credentials: metrics.config
        });
      case 'prometheus':
        return new PrometheusProvider();
      default:
        throw new Error(`Unsupported metrics provider: ${metrics.provider}`);
    }
  }
}
