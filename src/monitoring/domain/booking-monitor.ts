import { MonitoringDomain, MetricType, HealthStatus } from './types';
import { MonitoringFactory } from '../providers/monitoring-factory';

export class BookingMonitor {
  private static instance: BookingMonitor;
  private factory: MonitoringFactory;

  private constructor() {
    this.factory = MonitoringFactory.getInstance();
  }

  static getInstance(): BookingMonitor {
    if (!BookingMonitor.instance) {
      BookingMonitor.instance = new BookingMonitor();
    }
    return BookingMonitor.instance;
  }

  async recordBookingSuccess(bookingId: string, success: boolean): Promise<void> {
    await this.factory.getCurrentProvider().recordMetric({
      domain: MonitoringDomain.BOOKING,
      name: 'booking_success',
      type: MetricType.COUNTER,
      value: success ? 1 : 0,
      labels: { booking_id: bookingId },
      timestamp: new Date()
    });
  }

  async recordProcessingTime(bookingId: string, duration: number): Promise<void> {
    await this.factory.getCurrentProvider().recordHistogram(
      'booking_processing_time',
      duration,
      { booking_id: bookingId }
    );
  }

  async recordBookingHealth(bookingId: string, status: HealthStatus, message?: string): Promise<void> {
    await this.factory.getCurrentProvider().recordHealthCheck({
      domain: MonitoringDomain.BOOKING,
      component: `booking_${bookingId}`,
      status,
      message,
      timestamp: new Date()
    });
  }

  async measureBookingOperation<T>(bookingId: string, operation: string, func: () => Promise<T>): Promise<T> {
    const span = this.factory.getCurrentProvider().startSpan(
      MonitoringDomain.BOOKING,
      `booking_${bookingId}_${operation}`
    );

    try {
      const result = await func();
      return result;
    } finally {
      await this.factory.getCurrentProvider().endSpan({
        ...span,
        endTime: new Date()
      });
    }
  }
}
