import { MonitoringService } from './monitoring-service';
import { MonitoringDomain, HealthStatus } from './domain/types';

// Singleton instance
const monitoringService = MonitoringService.getInstance();

// Initialize monitoring
export async function useMonitoring(isPrimary: boolean = true): Promise<void> {
  await monitoringService.initialize(isPrimary);
}

// Property monitoring hooks
export function usePropertyMonitoring() {
  return {
    recordMetrics: (propertyId: string, metrics: {
      views?: number;
      conversionRate?: number;
      searchPosition?: number;
    }) => monitoringService.recordPropertyMetrics(propertyId, metrics),

    measureOperation: <T>(
      propertyId: string,
      operation: string,
      func: () => Promise<T>
    ) => monitoringService.measureOperation(
      MonitoringDomain.PROPERTY,
      propertyId,
      operation,
      func
    ),

    recordHealth: (
      propertyId: string,
      status: HealthStatus,
      message?: string
    ) => monitoringService.recordHealth(
      MonitoringDomain.PROPERTY,
      propertyId,
      status,
      message
    )
  };
}

// Recommendation monitoring hooks
export function useRecommendationMonitoring() {
  return {
    recordMetrics: (modelId: string, metrics: {
      accuracy?: number;
      learningRate?: number;
      responseTime?: number;
      predictionCount?: number;
      featureImportance?: Record<string, number>;
    }) => monitoringService.recordModelMetrics(modelId, metrics),

    measurePrediction: <T>(
      modelId: string,
      func: () => Promise<T>
    ) => monitoringService.measureOperation(
      MonitoringDomain.RECOMMENDATION,
      modelId,
      'predict',
      func
    ),

    recordHealth: (
      modelId: string,
      status: HealthStatus,
      message?: string
    ) => monitoringService.recordHealth(
      MonitoringDomain.RECOMMENDATION,
      modelId,
      status,
      message
    )
  };
}

// Booking monitoring hooks
export function useBookingMonitoring() {
  return {
    recordMetrics: (bookingId: string, metrics: {
      success?: boolean;
      processingTime?: number;
    }) => monitoringService.recordBookingMetrics(bookingId, metrics),

    measureOperation: <T>(
      bookingId: string,
      operation: string,
      func: () => Promise<T>
    ) => monitoringService.measureOperation(
      MonitoringDomain.BOOKING,
      bookingId,
      operation,
      func
    ),

    recordHealth: (
      bookingId: string,
      status: HealthStatus,
      message?: string
    ) => monitoringService.recordHealth(
      MonitoringDomain.BOOKING,
      bookingId,
      status,
      message
    )
  };
}

// Tenant monitoring hooks
export function useTenantMonitoring() {
  return {
    recordMetrics: (tenantId: string, metrics: {
      searchPattern?: string;
      sessionDuration?: number;
      featureUsage?: string;
    }) => monitoringService.recordTenantMetrics(tenantId, metrics),

    measureOperation: <T>(
      tenantId: string,
      operation: string,
      func: () => Promise<T>
    ) => monitoringService.measureOperation(
      MonitoringDomain.TENANT,
      tenantId,
      operation,
      func
    ),

    recordHealth: (
      tenantId: string,
      status: HealthStatus,
      message?: string
    ) => monitoringService.recordHealth(
      MonitoringDomain.TENANT,
      tenantId,
      status,
      message
    )
  };
}

// Provider management hooks
export function useMonitoringProvider() {
  return {
    switchProvider: (isPrimary: boolean) => monitoringService.switchProvider(isPrimary),
    shutdown: () => monitoringService.shutdown()
  };
}
