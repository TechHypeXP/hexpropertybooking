import { MonitoringFactory } from './providers/monitoring-factory';
import { defaultMonitoringConfig } from './config';
import { PropertyMonitor } from './domain/property-monitor';
import { RecommendationMonitor } from './domain/recommendation-monitor';
import { BookingMonitor } from './domain/booking-monitor';
import { TenantMonitor } from './domain/tenant-monitor';
import { HealthStatus } from './domain/types';

interface MonitoringStatus {
  isInitialized: boolean;
  provider: 'primary' | 'secondary';
  health: HealthStatus;
  monitors: {
    property: boolean;
    recommendation: boolean;
    booking: boolean;
    tenant: boolean;
  };
}

let monitoringStatus: MonitoringStatus = {
  isInitialized: false,
  provider: 'primary',
  health: HealthStatus.UNHEALTHY,
  monitors: {
    property: false,
    recommendation: false,
    booking: false,
    tenant: false,
  },
};

export async function initializeMonitoring(isPrimary: boolean = true): Promise<void> {
  try {
    if (monitoringStatus.isInitialized) {
      console.warn('[Monitoring] Already initialized, call shutdown first to reinitialize');
      return;
    }

    const factory = MonitoringFactory.getInstance();
    const config = {
      ...defaultMonitoringConfig,
      provider: isPrimary ? 'primary' : 'secondary'
    };

    // Validate configuration
    await factory.validateConfig(config);

    // Initialize factory with validated config
    await factory.initialize(config);
    monitoringStatus.provider = isPrimary ? 'primary' : 'secondary';

    // Initialize domain monitors
    try {
      PropertyMonitor.getInstance();
      monitoringStatus.monitors.property = true;
    } catch (error) {
      console.error('[Monitoring] Failed to initialize PropertyMonitor:', error);
    }

    try {
      RecommendationMonitor.getInstance();
      monitoringStatus.monitors.recommendation = true;
    } catch (error) {
      console.error('[Monitoring] Failed to initialize RecommendationMonitor:', error);
    }

    try {
      BookingMonitor.getInstance();
      monitoringStatus.monitors.booking = true;
    } catch (error) {
      console.error('[Monitoring] Failed to initialize BookingMonitor:', error);
    }

    try {
      TenantMonitor.getInstance();
      monitoringStatus.monitors.tenant = true;
    } catch (error) {
      console.error('[Monitoring] Failed to initialize TenantMonitor:', error);
    }

    // Perform health check
    const allMonitorsInitialized = Object.values(monitoringStatus.monitors).every(status => status);
    monitoringStatus.health = allMonitorsInitialized ? HealthStatus.HEALTHY : HealthStatus.DEGRADED;
    monitoringStatus.isInitialized = true;

    console.log(`[Monitoring] Initialized successfully with ${isPrimary ? 'primary' : 'secondary'} provider`);
    console.log('[Monitoring] Status:', JSON.stringify(monitoringStatus, null, 2));
  } catch (error) {
    monitoringStatus.health = HealthStatus.UNHEALTHY;
    console.error('[Monitoring] Initialization failed:', error);
    throw error;
  }
}

export async function shutdownMonitoring(): Promise<void> {
  try {
    if (!monitoringStatus.isInitialized) {
      console.warn('[Monitoring] Not initialized');
      return;
    }

    const factory = MonitoringFactory.getInstance();
    await factory.shutdown();

    // Reset monitoring status
    monitoringStatus = {
      isInitialized: false,
      provider: 'primary',
      health: HealthStatus.UNHEALTHY,
      monitors: {
        property: false,
        recommendation: false,
        booking: false,
        tenant: false,
      },
    };

    console.log('[Monitoring] Shut down successfully');
  } catch (error) {
    console.error('[Monitoring] Shutdown failed:', error);
    throw error;
  }
}

export async function switchMonitoringProvider(isPrimary: boolean): Promise<void> {
  try {
    if (!monitoringStatus.isInitialized) {
      throw new Error('Monitoring not initialized');
    }

    const factory = MonitoringFactory.getInstance();
    await factory.switchProvider(isPrimary ? 'primary' : 'secondary');
    monitoringStatus.provider = isPrimary ? 'primary' : 'secondary';

    // Verify provider health after switch
    const healthCheck = await factory.checkProviderHealth();
    monitoringStatus.health = healthCheck.status;

    console.log(`[Monitoring] Switched to ${isPrimary ? 'primary' : 'secondary'} provider`);
    console.log('[Monitoring] Status:', JSON.stringify(monitoringStatus, null, 2));
  } catch (error) {
    console.error('[Monitoring] Provider switch failed:', error);
    throw error;
  }
}

export function getMonitoringStatus(): MonitoringStatus {
  return { ...monitoringStatus };
}

// Export domain monitors for easy access
export { PropertyMonitor } from './domain/property-monitor';
export { RecommendationMonitor } from './domain/recommendation-monitor';
export { BookingMonitor } from './domain/booking-monitor';
export { TenantMonitor } from './domain/tenant-monitor';
