import { Booking } from '../../domain/models/booking';

export class NotificationService {
  private static instance: NotificationService;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async sendBookingConfirmation(booking: Booking): Promise<void> {
    // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
    console.log(`Sending booking confirmation for booking ${booking.id}`);
  }

  async sendBookingCancellation(booking: Booking): Promise<void> {
    console.log(`Sending booking cancellation for booking ${booking.id}`);
  }

  async sendBookingModification(booking: Booking): Promise<void> {
    console.log(`Sending booking modification for booking ${booking.id}`);
  }

  async sendPaymentConfirmation(booking: Booking): Promise<void> {
    console.log(`Sending payment confirmation for booking ${booking.id}`);
  }

  async sendRefundConfirmation(booking: Booking, amount: number): Promise<void> {
    console.log(`Sending refund confirmation for booking ${booking.id}`);
  }
}
