import { MonitoringFactory } from './providers/monitoring-factory';
import { PropertyMonitor } from './domain/property-monitor';
import { RecommendationMonitor } from './domain/recommendation-monitor';
import { BookingMonitor } from './domain/booking-monitor';
import { TenantMonitor } from './domain/tenant-monitor';
import { initializeMonitoring, shutdownMonitoring, switchMonitoringProvider } from './init';
import { defaultMonitoringConfig, secondaryMonitoringConfig } from './config';
import { MonitoringDomain, HealthStatus } from './domain/types';

export class MonitoringService {
  private static instance: MonitoringService;
  private factory: MonitoringFactory;
  private initialized: boolean = false;

  // Domain-specific monitors
  private propertyMonitor: PropertyMonitor;
  private recommendationMonitor: RecommendationMonitor;
  private bookingMonitor: BookingMonitor;
  private tenantMonitor: TenantMonitor;

  private constructor() {
    this.factory = MonitoringFactory.getInstance();
    this.propertyMonitor = PropertyMonitor.getInstance();
    this.recommendationMonitor = RecommendationMonitor.getInstance();
    this.bookingMonitor = BookingMonitor.getInstance();
    this.tenantMonitor = TenantMonitor.getInstance();
  }

  static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  async initialize(isPrimary: boolean = true): Promise<void> {
    if (this.initialized) {
      console.warn('[MonitoringService] Already initialized');
      return;
    }

    await initializeMonitoring(isPrimary);
    this.initialized = true;
  }

  async shutdown(): Promise<void> {
    if (!this.initialized) {
      console.warn('[MonitoringService] Not initialized');
      return;
    }

    await shutdownMonitoring();
    this.initialized = false;
  }

  async switchProvider(isPrimary: boolean): Promise<void> {
    if (!this.initialized) {
      throw new Error('[MonitoringService] Not initialized');
    }

    await switchMonitoringProvider(isPrimary);
  }

  // Property Monitoring
  async recordPropertyMetrics(propertyId: string, metrics: {
    views?: number;
    conversionRate?: number;
    searchPosition?: number;
  }): Promise<void> {
    if (metrics.views !== undefined) {
      await this.propertyMonitor.recordViewRate(propertyId, metrics.views);
    }
    if (metrics.conversionRate !== undefined) {
      await this.propertyMonitor.recordConversionRate(propertyId, metrics.conversionRate);
    }
    if (metrics.searchPosition !== undefined) {
      await this.propertyMonitor.recordSearchPosition(propertyId, metrics.searchPosition);
    }
  }

  // Recommendation Monitoring
  async recordModelMetrics(modelId: string, metrics: {
    accuracy?: number;
    learningRate?: number;
    responseTime?: number;
    predictionCount?: number;
    featureImportance?: Record<string, number>;
  }): Promise<void> {
    if (metrics.accuracy !== undefined) {
      await this.recommendationMonitor.recordAccuracy(modelId, metrics.accuracy);
    }
    if (metrics.learningRate !== undefined) {
      await this.recommendationMonitor.recordLearningRate(modelId, metrics.learningRate);
    }
    if (metrics.responseTime !== undefined) {
      await this.recommendationMonitor.recordResponseTime(modelId, metrics.responseTime);
    }
    if (metrics.predictionCount !== undefined) {
      await this.recommendationMonitor.recordPredictionCount(modelId, metrics.predictionCount);
    }
    if (metrics.featureImportance) {
      await this.recommendationMonitor.recordFeatureImportance(modelId, metrics.featureImportance);
    }
  }

  // Booking Monitoring
  async recordBookingMetrics(bookingId: string, metrics: {
    success?: boolean;
    processingTime?: number;
  }): Promise<void> {
    if (metrics.success !== undefined) {
      await this.bookingMonitor.recordBookingSuccess(bookingId, metrics.success);
    }
    if (metrics.processingTime !== undefined) {
      await this.bookingMonitor.recordProcessingTime(bookingId, metrics.processingTime);
    }
  }

  // Tenant Monitoring
  async recordTenantMetrics(tenantId: string, metrics: {
    searchPattern?: string;
    sessionDuration?: number;
    featureUsage?: string;
  }): Promise<void> {
    if (metrics.searchPattern) {
      await this.tenantMonitor.recordSearchPattern(tenantId, metrics.searchPattern);
    }
    if (metrics.sessionDuration !== undefined) {
      await this.tenantMonitor.recordSessionDuration(tenantId, metrics.sessionDuration);
    }
    if (metrics.featureUsage) {
      await this.tenantMonitor.recordFeatureUsage(tenantId, metrics.featureUsage);
    }
  }

  // Health Monitoring
  async recordHealth(domain: MonitoringDomain, componentId: string, status: HealthStatus, message?: string): Promise<void> {
    switch (domain) {
      case MonitoringDomain.PROPERTY:
        await this.propertyMonitor.recordPropertyHealth(componentId, status, message);
        break;
      case MonitoringDomain.RECOMMENDATION:
        await this.recommendationMonitor.recordModelHealth(componentId, status, message);
        break;
      case MonitoringDomain.BOOKING:
        await this.bookingMonitor.recordBookingHealth(componentId, status, message);
        break;
      case MonitoringDomain.TENANT:
        await this.tenantMonitor.recordTenantHealth(componentId, status, message);
        break;
      default:
        throw new Error(`Unsupported monitoring domain: ${domain}`);
    }
  }

  // Performance Monitoring
  async measureOperation<T>(
    domain: MonitoringDomain,
    componentId: string,
    operation: string,
    func: () => Promise<T>
  ): Promise<T> {
    switch (domain) {
      case MonitoringDomain.PROPERTY:
        return this.propertyMonitor.measurePropertyOperation(componentId, operation, func);
      case MonitoringDomain.RECOMMENDATION:
        return this.recommendationMonitor.measurePrediction(componentId, func);
      case MonitoringDomain.BOOKING:
        return this.bookingMonitor.measureBookingOperation(componentId, operation, func);
      case MonitoringDomain.TENANT:
        return this.tenantMonitor.measureTenantOperation(componentId, operation, func);
      default:
        throw new Error(`Unsupported monitoring domain: ${domain}`);
    }
  }
}
