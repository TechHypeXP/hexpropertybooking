import { MonitoringConfig } from './providers/monitoring-factory';

export const defaultMonitoringConfig: MonitoringConfig = {
  provider: 'primary',
  projectId: process.env.GOOGLE_CLOUD_PROJECT,
  errorTracking: {
    provider: 'sentry',
    config: {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV
    }
  },
  performance: {
    provider: 'gcops',
    config: {
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      serviceContext: {
        service: 'hexproperty-booking',
        version: process.env.APP_VERSION
      }
    }
  },
  metrics: {
    provider: 'stackdriver',
    config: {
      projectId: process.env.GOOGLE_CLOUD_PROJECT,
      metricPrefix: 'hexproperty'
    }
  }
};

export const secondaryMonitoringConfig: MonitoringConfig = {
  provider: 'secondary',
  errorTracking: {
    provider: 'gcops',
    config: {
      logName: 'hexproperty-errors'
    }
  },
  performance: {
    provider: 'grafana',
    config: {
      endpoint: process.env.GRAFANA_ENDPOINT,
      apiKey: process.env.GRAFANA_API_KEY
    }
  },
  metrics: {
    provider: 'prometheus',
    config: {
      endpoint: process.env.PROMETHEUS_ENDPOINT
    }
  }
};
