import { Property, PropertyAvailability } from '../domain/models/property';
import { Booking, BookingDates, BookingCancellation, BookingModification } from '../domain/models/booking';
import { TenantProfile } from '../domain/models/tenant';
import { PaymentTransaction } from '../domain/models/payment';
import { PropertyRepository } from '../infrastructure/repositories/property-repository';
import { BookingRepository } from '../infrastructure/repositories/booking-repository';
import { PaymentService } from '../infrastructure/services/payment-service';
import { NotificationService } from '../infrastructure/services/notification-service';

export class BookingService {
  private static instance: BookingService;
  private propertyRepo: PropertyRepository;
  private bookingRepo: BookingRepository;
  private paymentService: PaymentService;
  private notificationService: NotificationService;

  private constructor() {
    this.propertyRepo = PropertyRepository.getInstance();
    this.bookingRepo = BookingRepository.getInstance();
    this.paymentService = PaymentService.getInstance();
    this.notificationService = NotificationService.getInstance();
  }

  static getInstance(): BookingService {
    if (!BookingService.instance) {
      BookingService.instance = new BookingService();
    }
    return BookingService.instance;
  }

  async checkAvailability(propertyId: string, dates: BookingDates): Promise<boolean> {
    const availability = await this.propertyRepo.getAvailability(propertyId);
    if (!availability) return false;

    // Check if dates overlap with any existing bookings or blocked dates
    const isAvailable = !this.hasDateOverlap(dates, availability);
    return isAvailable;
  }

  async calculatePrice(propertyId: string, dates: BookingDates): Promise<{
    basePrice: number;
    cleaningFee: number;
    serviceFee: number;
    taxes: number;
    total: number;
    currency: string;
  }> {
    const property = await this.propertyRepo.findById(propertyId);
    if (!property) throw new Error('Property not found');

    const numberOfNights = this.calculateNights(dates);
    const basePrice = property.price.basePrice * numberOfNights;
    const cleaningFee = property.price.cleaningFee || 0;
    const serviceFee = this.calculateServiceFee(basePrice);
    const taxes = this.calculateTaxes(basePrice + cleaningFee + serviceFee);

    return {
      basePrice,
      cleaningFee,
      serviceFee,
      taxes,
      total: basePrice + cleaningFee + serviceFee + taxes,
      currency: property.price.currency
    };
  }

  async createBooking(
    propertyId: string,
    tenantId: string,
    dates: BookingDates,
    guests: { name: string; email: string }[],
    paymentMethodId: string
  ): Promise<Booking> {
    // Check availability
    const isAvailable = await this.checkAvailability(propertyId, dates);
    if (!isAvailable) throw new Error('Property not available for selected dates');

    // Calculate price
    const price = await this.calculatePrice(propertyId, dates);

    // Process payment
    const paymentTransaction = await this.paymentService.processPayment({
      amount: price.total,
      currency: price.currency,
      paymentMethodId,
      description: `Booking for property ${propertyId}`
    });

    if (paymentTransaction.status !== 'COMPLETED') {
      throw new Error('Payment failed');
    }

    // Create booking
    const booking: Booking = {
      id: `booking-${Date.now()}`,
      propertyId,
      tenantId,
      status: 'CONFIRMED',
      dates,
      guests,
      price,
      payment: {
        id: paymentTransaction.id,
        status: paymentTransaction.status,
        method: paymentTransaction.paymentMethodId,
        amount: paymentTransaction.amount,
        currency: paymentTransaction.currency,
        transactionId: paymentTransaction.processorTransactionId
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save booking
    await this.bookingRepo.save(booking);

    // Send notifications
    await this.notificationService.sendBookingConfirmation(booking);

    return booking;
  }

  async cancelBooking(bookingId: string, reason: string): Promise<BookingCancellation> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    // Calculate refund amount based on cancellation policy
    const refundAmount = this.calculateRefundAmount(booking);

    // Process refund if applicable
    if (refundAmount > 0) {
      await this.paymentService.processRefund({
        transactionId: booking.payment.transactionId!,
        amount: refundAmount,
        reason
      });
    }

    // Update booking status
    booking.status = 'CANCELLED';
    booking.cancellationReason = reason;
    await this.bookingRepo.save(booking);

    // Create cancellation record
    const cancellation: BookingCancellation = {
      bookingId,
      reason,
      requestedBy: booking.tenantId,
      refundAmount,
      status: 'APPROVED',
      createdAt: new Date()
    };

    // Send notifications
    await this.notificationService.sendBookingCancellation(booking);

    return cancellation;
  }

  async modifyBooking(
    bookingId: string,
    newDates: BookingDates
  ): Promise<BookingModification> {
    const booking = await this.bookingRepo.findById(bookingId);
    if (!booking) throw new Error('Booking not found');

    // Check availability for new dates
    const isAvailable = await this.checkAvailability(booking.propertyId, newDates);
    if (!isAvailable) throw new Error('Property not available for selected dates');

    // Calculate new price
    const newPrice = await this.calculatePrice(booking.propertyId, newDates);
    const priceDifference = newPrice.total - booking.price.total;

    // Process additional payment if needed
    if (priceDifference > 0) {
      await this.paymentService.processPayment({
        amount: priceDifference,
        currency: newPrice.currency,
        paymentMethodId: booking.payment.method,
        description: `Booking modification for ${bookingId}`
      });
    }

    // Create modification record
    const modification: BookingModification = {
      bookingId,
      previousDates: booking.dates,
      newDates,
      priceDifference,
      status: 'APPROVED',
      createdAt: new Date()
    };

    // Update booking
    booking.dates = newDates;
    booking.price = newPrice;
    booking.updatedAt = new Date();
    await this.bookingRepo.save(booking);

    // Send notifications
    await this.notificationService.sendBookingModification(booking);

    return modification;
  }

  private hasDateOverlap(dates: BookingDates, availability: PropertyAvailability): boolean {
    const checkIn = new Date(dates.checkIn);
    const checkOut = new Date(dates.checkOut);

    // Check against existing bookings
    const hasBookingOverlap = availability.dates.some(period => {
      const start = new Date(period.start);
      const end = new Date(period.end);
      return checkIn < end && checkOut > start;
    });

    // Check against blocked dates
    const hasBlockedOverlap = availability.blockedDates?.some(period => {
      const start = new Date(period.start);
      const end = new Date(period.end);
      return checkIn < end && checkOut > start;
    });

    return hasBookingOverlap || !!hasBlockedOverlap;
  }

  private calculateNights(dates: BookingDates): number {
    const checkIn = new Date(dates.checkIn);
    const checkOut = new Date(dates.checkOut);
    const diffTime = Math.abs(checkOut.getTime() - checkIn.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  private calculateServiceFee(basePrice: number): number {
    return basePrice * 0.10; // 10% service fee
  }

  private calculateTaxes(subtotal: number): number {
    return subtotal * 0.15; // 15% tax
  }

  private calculateRefundAmount(booking: Booking): number {
    const now = new Date();
    const checkIn = new Date(booking.dates.checkIn);
    const daysUntilCheckIn = Math.ceil((checkIn.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    // Refund policy:
    // > 7 days: 100% refund
    // 3-7 days: 50% refund
    // < 3 days: no refund
    if (daysUntilCheckIn > 7) {
      return booking.price.total;
    } else if (daysUntilCheckIn >= 3) {
      return booking.price.total * 0.5;
    }
    return 0;
  }
}
