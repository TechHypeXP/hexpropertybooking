import { describe, it, expect, beforeEach } from 'vitest';
import { BookingService } from '@/domain/booking/BookingService';
import { TestDataGenerator, MockFactory } from '@/test/utils/test-helpers';
import { DomainError } from '@/core/errors/DomainErrors';

describe('BookingService', () => {
  let bookingService: BookingService;
  let mockBookingRepository: any;
  let mockPropertyRepository: any;
  let mockUserRepository: any;

  beforeEach(() => {
    // Create mock repositories
    mockBookingRepository = MockFactory.createMockRepository();
    mockPropertyRepository = MockFactory.createMockRepository();
    mockUserRepository = MockFactory.createMockRepository();

    // Instantiate BookingService with mock repositories
    bookingService = new BookingService(
      mockBookingRepository,
      mockPropertyRepository,
      mockUserRepository
    );
  });

  describe('Create Booking', () => {
    it('should successfully create a valid booking', async () => {
      const user = TestDataGenerator.user();
      const property = TestDataGenerator.property();
      const bookingData = {
        ...TestDataGenerator.booking(),
        userId: user.id,
        propertyId: property.id
      };

      // Mock repository methods
      mockUserRepository.findById.mockResolvedValue(user);
      mockPropertyRepository.findById.mockResolvedValue(property);
      mockBookingRepository.create.mockResolvedValue(bookingData);

      const createdBooking = await bookingService.createBooking(bookingData);

      expect(createdBooking).toEqual(expect.objectContaining(bookingData));
      expect(mockBookingRepository.create).toHaveBeenCalledWith(bookingData);
    });

    it('should throw error for booking conflicting with existing bookings', async () => {
      const property = TestDataGenerator.property();
      const existingBooking = TestDataGenerator.booking({
        propertyId: property.id,
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-05')
      });

      const newBookingData = {
        ...TestDataGenerator.booking(),
        propertyId: property.id,
        startDate: new Date('2024-01-03'),
        endDate: new Date('2024-01-07')
      };

      // Mock repository methods
      mockPropertyRepository.findById.mockResolvedValue(property);
      mockBookingRepository.findByPropertyAndDateRange.mockResolvedValue([existingBooking]);

      await expect(bookingService.createBooking(newBookingData))
        .rejects.toThrow(DomainError);
    });
  });

  describe('Booking Validation', () => {
    it('should validate booking duration', async () => {
      const bookingData = {
        ...TestDataGenerator.booking(),
        startDate: new Date('2024-01-10'),
        endDate: new Date('2024-01-05') // Invalid: end date before start date
      };

      await expect(bookingService.createBooking(bookingData))
        .rejects.toThrow('Invalid booking dates');
    });

    it('should validate maximum booking duration', async () => {
      const bookingData = {
        ...TestDataGenerator.booking(),
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-01') // Exceeds max booking duration
      };

      await expect(bookingService.createBooking(bookingData))
        .rejects.toThrow('Booking duration exceeds maximum allowed');
    });
  });

  describe('Booking Modification', () => {
    it('should update an existing booking', async () => {
      const existingBooking = TestDataGenerator.booking();
      const updateData = {
        guests: 5,
        status: 'CONFIRMED'
      };

      mockBookingRepository.findById.mockResolvedValue(existingBooking);
      mockBookingRepository.update.mockResolvedValue({
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

    it('should cancel a booking', async () => {
      const existingBooking = TestDataGenerator.booking({
        status: 'CONFIRMED'
      });

      mockBookingRepository.findById.mockResolvedValue(existingBooking);
      mockBookingRepository.update.mockResolvedValue({
        ...existingBooking,
        status: 'CANCELLED'
      });

      const cancelledBooking = await bookingService.cancelBooking(existingBooking.id);

      expect(cancelledBooking.status).toBe('CANCELLED');
    });
  });

  describe('Booking Retrieval', () => {
    it('should retrieve bookings for a user', async () => {
      const user = TestDataGenerator.user();
      const userBookings = [
        TestDataGenerator.booking({ userId: user.id }),
        TestDataGenerator.booking({ userId: user.id })
      ];

      mockBookingRepository.findByUserId.mockResolvedValue(userBookings);

      const bookings = await bookingService.getUserBookings(user.id);

      expect(bookings).toHaveLength(2);
      expect(bookings[0].userId).toBe(user.id);
    });

    it('should retrieve bookings for a property', async () => {
      const property = TestDataGenerator.property();
      const propertyBookings = [
        TestDataGenerator.booking({ propertyId: property.id }),
        TestDataGenerator.booking({ propertyId: property.id })
      ];

      mockBookingRepository.findByPropertyId.mockResolvedValue(propertyBookings);

      const bookings = await bookingService.getPropertyBookings(property.id);

      expect(bookings).toHaveLength(2);
      expect(bookings[0].propertyId).toBe(property.id);
    });
  });

  describe('Complex Booking Scenarios', () => {
    it('should handle bulk booking creation', async () => {
      const bookings = Array.from({ length: 10 }, () => 
        TestDataGenerator.booking()
      );

      const bulkCreateMock = vi.fn().mockResolvedValue(bookings);
      bookingService.bulkCreateBookings = bulkCreateMock;

      const createdBookings = await bookingService.bulkCreateBookings(bookings);

      expect(createdBookings).toHaveLength(10);
      expect(bulkCreateMock).toHaveBeenCalledWith(bookings);
    });

    it('should apply complex booking filters', async () => {
      const filteredBookings = [
        TestDataGenerator.booking({ 
          status: 'CONFIRMED',
          guests: 4,
          startDate: new Date('2024-07-01'),
          endDate: new Date('2024-07-07')
        })
      ];

      const complexSearchMock = vi.fn().mockResolvedValue(filteredBookings);
      bookingService.complexBookingSearch = complexSearchMock;

      const results = await bookingService.complexBookingSearch({
        status: 'CONFIRMED',
        guestRange: { min: 3, max: 5 },
        dateRange: {
          start: new Date('2024-07-01'),
          end: new Date('2024-07-31')
        }
      });

      expect(results).toHaveLength(1);
      expect(results[0].status).toBe('CONFIRMED');
      expect(results[0].guests).toBe(4);
    });
  });
});
