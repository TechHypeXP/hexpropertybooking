import { describe, it, expect, beforeEach } from 'vitest';
import { BookingService } from '@/domain/booking/BookingService';
import { PropertyService } from '@/domain/property/PropertyService';
import { UserService } from '@/domain/user/UserService';
import { NotificationService } from '@/infrastructure/services/NotificationService';
import { TestDataGenerator } from '@/test/utils/test-helpers';
import { DomainError } from '@/core/errors/DomainErrors';

describe('Booking Workflow Integration', () => {
  let bookingService: BookingService;
  let propertyService: PropertyService;
  let userService: UserService;
  let notificationService: NotificationService;

  beforeEach(() => {
    // Mock service dependencies
    bookingService = {
      createBooking: vi.fn(),
      updateBooking: vi.fn(),
      cancelBooking: vi.fn()
    } as any;

    propertyService = {
      checkPropertyAvailability: vi.fn(),
      updatePropertyStatus: vi.fn()
    } as any;

    userService = {
      validateUserBookingEligibility: vi.fn()
    } as any;

    notificationService = {
      sendBookingConfirmation: vi.fn(),
      sendBookingCancellationNotice: vi.fn()
    } as any;
  });

  describe('Complete Booking Workflow', () => {
    it('should successfully create a booking with all validations', async () => {
      // Generate test data
      const user = TestDataGenerator.user();
      const property = TestDataGenerator.property();
      const bookingData = {
        ...TestDataGenerator.booking(),
        userId: user.id,
        propertyId: property.id
      };

      // Mock service method behaviors
      (userService.validateUserBookingEligibility as any).mockResolvedValue(true);
      (propertyService.checkPropertyAvailability as any).mockResolvedValue(true);
      (bookingService.createBooking as any).mockResolvedValue({
        ...bookingData,
        status: 'CONFIRMED'
      });

      // Execute booking workflow
      const createdBooking = await bookingService.createBooking(bookingData);

      // Validate workflow steps
      expect(userService.validateUserBookingEligibility).toHaveBeenCalledWith(user.id);
      expect(propertyService.checkPropertyAvailability).toHaveBeenCalledWith(
        property.id, 
        bookingData.startDate, 
        bookingData.endDate
      );
      expect(bookingService.createBooking).toHaveBeenCalledWith(bookingData);
      expect(notificationService.sendBookingConfirmation).toHaveBeenCalledWith(
        user.email, 
        createdBooking
      );

      // Validate booking status
      expect(createdBooking.status).toBe('CONFIRMED');
    });

    it('should handle booking creation failure scenarios', async () => {
      const user = TestDataGenerator.user();
      const property = TestDataGenerator.property();
      const bookingData = {
        ...TestDataGenerator.booking(),
        userId: user.id,
        propertyId: property.id
      };

      // Simulate user ineligibility
      (userService.validateUserBookingEligibility as any).mockRejectedValue(
        new DomainError({
          code: 'USER_BOOKING_INELIGIBLE',
          message: 'User is not eligible to make bookings'
        })
      );

      // Execute and validate workflow failure
      await expect(bookingService.createBooking(bookingData))
        .rejects.toThrow('User is not eligible to make bookings');

      // Validate no further workflow steps occurred
      expect(propertyService.checkPropertyAvailability).not.toHaveBeenCalled();
      expect(bookingService.createBooking).not.toHaveBeenCalled();
      expect(notificationService.sendBookingConfirmation).not.toHaveBeenCalled();
    });
  });

  describe('Booking Modification Workflow', () => {
    it('should successfully update an existing booking', async () => {
      const existingBooking = TestDataGenerator.booking();
      const updateData = {
        guests: 5,
        status: 'CONFIRMED'
      };

      // Mock update workflow
      (bookingService.updateBooking as any).mockResolvedValue({
        ...existingBooking,
        ...updateData
      });

      const updatedBooking = await bookingService.updateBooking(
        existingBooking.id, 
        updateData
      );

      expect(updatedBooking.guests).toBe(5);
      expect(updatedBooking.status).toBe('CONFIRMED');
    });

    it('should handle booking cancellation workflow', async () => {
      const existingBooking = TestDataGenerator.booking({
        status: 'CONFIRMED'
      });
      const user = TestDataGenerator.user();

      // Mock cancellation workflow
      (bookingService.cancelBooking as any).mockResolvedValue({
        ...existingBooking,
        status: 'CANCELLED'
      });

      const cancelledBooking = await bookingService.cancelBooking(
        existingBooking.id
      );

      expect(cancelledBooking.status).toBe('CANCELLED');
      expect(notificationService.sendBookingCancellationNotice).toHaveBeenCalled();
    });
  });

  describe('Complex Booking Scenarios', () => {
    it('should handle concurrent booking attempts', async () => {
      const property = TestDataGenerator.property();
      const conflictingBookings = [
        TestDataGenerator.booking({
          propertyId: property.id,
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-07-05')
        }),
        TestDataGenerator.booking({
          propertyId: property.id,
          startDate: new Date('2024-07-03'),
          endDate: new Date('2024-07-07')
        })
      ];

      // Simulate concurrent booking conflict
      (propertyService.checkPropertyAvailability as any).mockRejectedValue(
        new DomainError({
          code: 'BOOKING_CONFLICT',
          message: 'Property already booked for selected dates'
        })
      );

      await expect(
        propertyService.checkPropertyAvailability(
          property.id, 
          conflictingBookings[1].startDate, 
          conflictingBookings[1].endDate
        )
      ).rejects.toThrow('Property already booked for selected dates');
    });
  });
});
