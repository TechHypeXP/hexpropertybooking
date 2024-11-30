import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { 
  BookingSchema, 
  BookingStateEnum, 
  PaymentStatusEnum 
} from '../../models/booking'
import { PropertyAvailabilityManager } from '../availability/property_availability_manager'
import { PropertyRateManager } from '../rates/property_rate_manager'

export class PropertyBookingManager {
  private availabilityManager: PropertyAvailabilityManager
  private rateManager: PropertyRateManager

  constructor() {
    this.availabilityManager = new PropertyAvailabilityManager()
    this.rateManager = new PropertyRateManager()
  }

  async createBooking(booking: z.infer<typeof BookingSchema>) {
    try {
      // 1. Validate availability
      const isAvailable = await this.availabilityManager.checkAvailability({
        propertyId: booking.propertyId,
        unitTypeId: booking.unitTypeId,
        startDate: booking.dates.checkIn,
        endDate: booking.dates.checkOut,
        occupancy: booking.occupancy
      })

      if (!isAvailable) {
        throw new TRPCError({
          code: 'CONFLICT',
          message: 'Unit not available for selected dates'
        })
      }

      // 2. Calculate rates and charges
      const charges = await this.rateManager.calculateCharges({
        propertyId: booking.propertyId,
        unitTypeId: booking.unitTypeId,
        startDate: booking.dates.checkIn,
        endDate: booking.dates.checkOut,
        occupancy: booking.occupancy
      })

      // 3. Create booking
      const newBooking = {
        ...booking,
        charges,
        state: BookingStateEnum.enum.PENDING,
        paymentStatus: PaymentStatusEnum.enum.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // TODO: Save booking to database

      // 4. Update availability
      await this.availabilityManager.blockAvailability({
        propertyId: booking.propertyId,
        unitTypeId: booking.unitTypeId,
        unitId: booking.unitId,
        startDate: booking.dates.checkIn,
        endDate: booking.dates.checkOut
      })

      return newBooking

    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error creating booking',
        cause: error
      })
    }
  }

  async modifyBooking(
    bookingId: string,
    changes: Partial<z.infer<typeof BookingSchema>>
  ) {
    try {
      // TODO: Implement booking modification
      // 1. Validate changes
      // 2. Update availability if dates changed
      // 3. Recalculate charges if needed
      // 4. Update booking
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error modifying booking',
        cause: error
      })
    }
  }

  async cancelBooking(bookingId: string) {
    try {
      // TODO: Implement booking cancellation
      // 1. Update booking state
      // 2. Release availability
      // 3. Handle refunds if needed
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error cancelling booking',
        cause: error
      })
    }
  }

  async checkIn(bookingId: string) {
    try {
      // TODO: Implement check-in
      // 1. Validate booking state
      // 2. Update booking state
      // 3. Record actual check-in time
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error checking in',
        cause: error
      })
    }
  }

  async checkOut(bookingId: string) {
    try {
      // TODO: Implement check-out
      // 1. Validate booking state
      // 2. Update booking state
      // 3. Record actual check-out time
      // 4. Generate final invoice
    } catch (error) {
      if (error instanceof TRPCError) {
        throw error
      }
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Error checking out',
        cause: error
      })
    }
  }
}
