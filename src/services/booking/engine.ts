import { z } from 'zod'
import { TRPCError } from '@trpc/server'
import { BookingSchema, BookingRuleSchema, BookingStateEnum, PaymentStatusEnum } from '../../models/booking'
import { UnitTypeSchema } from '../../models/property'
import { AvailabilityEngine } from '../availability/engine'

export const CreateBookingRequestSchema = z.object({
  propertyId: z.string().uuid(),
  unitTypeId: z.string().uuid(),
  startDate: z.date(),
  endDate: z.date(),
  customer: z.object({
    id: z.string().uuid().optional(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    companyId: z.string().uuid().optional()
  }),
  occupancy: z.object({
    adults: z.number(),
    children: z.number().optional()
  }),
  source: z.string(),
  channelId: z.string().optional(),
  notes: z.object({
    booking: z.string().optional(),
    housekeeping: z.string().optional(),
    internal: z.string().optional()
  }).optional()
})

export class BookingEngine {
  private availabilityEngine: AvailabilityEngine

  constructor() {
    this.availabilityEngine = new AvailabilityEngine()
  }

  private async validateAvailability(
    propertyId: string,
    unitTypeId: string,
    startDate: Date,
    endDate: Date,
    adults: number,
    children: number,
    channelId?: string
  ) {
    const availability = await this.availabilityEngine.checkAvailability({
      propertyId,
      unitTypeId,
      startDate,
      endDate,
      adults,
      children,
      channelId
    })

    const unitTypeAvail = availability.unitTypes.find(ut => ut.unitTypeId === unitTypeId)
    if (!unitTypeAvail) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Unit type not found'
      })
    }

    // Check if any day has no availability
    const noAvailability = unitTypeAvail.availability.some(a => a.availableUnits <= 0)
    if (noAvailability) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'No availability for selected dates'
      })
    }

    // Check for restrictions
    const restrictions = unitTypeAvail.availability.flatMap(a => a.restrictions)
    const hasBlockingRestriction = restrictions.some(r => 
      r.type === 'CLOSED' || 
      (r.type === 'MIN_STAY' && this.calculateStayLength(startDate, endDate) < (r.value || 0))
    )

    if (hasBlockingRestriction) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Booking violates restrictions'
      })
    }

    return unitTypeAvail
  }

  private calculateStayLength(startDate: Date, endDate: Date): number {
    return Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  }

  private async calculateCharges(
    unitTypeAvail: z.infer<typeof UnitTypeSchema>,
    startDate: Date,
    endDate: Date,
    adults: number,
    children: number
  ) {
    const charges = []
    let currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      const dailyRate = unitTypeAvail.availability.find(
        a => a.date.getTime() === currentDate.getTime()
      )?.baseRate || unitTypeAvail.basePrice

      // Base room charge
      charges.push({
        date: new Date(currentDate),
        type: 'ROOM_CHARGE' as const,
        description: 'Room charge',
        amount: dailyRate,
        taxes: [] // TODO: Calculate taxes
      })

      // Extra person charges if applicable
      const totalGuests = adults + (children || 0)
      if (totalGuests > 2 && unitTypeAvail.rates?.extraPersonRate) {
        charges.push({
          date: new Date(currentDate),
          type: 'EXTRA_PERSON' as const,
          description: 'Extra person charge',
          amount: unitTypeAvail.rates.extraPersonRate * (totalGuests - 2),
          taxes: [] // TODO: Calculate taxes
        })
      }

      currentDate.setDate(currentDate.getDate() + 1)
    }

    return charges
  }

  private async assignUnit(
    propertyId: string,
    unitTypeId: string,
    startDate: Date,
    endDate: Date
  ) {
    // TODO: Implement unit assignment logic
    // For now, return undefined to let the front desk assign a unit
    return undefined
  }

  async createBooking(request: z.infer<typeof CreateBookingRequestSchema>) {
    try {
      const {
        propertyId,
        unitTypeId,
        startDate,
        endDate,
        customer,
        occupancy,
        source,
        channelId,
        notes
      } = request

      // 1. Validate availability and get rates
      const unitTypeAvail = await this.validateAvailability(
        propertyId,
        unitTypeId,
        startDate,
        endDate,
        occupancy.adults,
        occupancy.children,
        channelId
      )

      // 2. Calculate charges
      const charges = await this.calculateCharges(
        unitTypeAvail,
        startDate,
        endDate,
        occupancy.adults,
        occupancy.children
      )

      // 3. Try to assign a unit
      const unitId = await this.assignUnit(
        propertyId,
        unitTypeId,
        startDate,
        endDate
      )

      // 4. Create the booking
      const booking: z.infer<typeof BookingSchema> = {
        id: crypto.randomUUID(),
        propertyId,
        unitTypeId,
        unitId,
        customerId: customer.id || crypto.randomUUID(),
        companyId: customer.companyId || crypto.randomUUID(),
        source,
        state: unitId ? BookingStateEnum.enum.CONFIRMED : BookingStateEnum.enum.UNCONFIRMED,
        paymentStatus: PaymentStatusEnum.enum.PENDING,
        dates: {
          checkIn: startDate,
          checkOut: endDate,
          sellingDate: new Date()
        },
        occupancy: {
          adults: occupancy.adults,
          children: occupancy.children || 0
        },
        charges,
        notes: notes || {
          booking: undefined,
          housekeeping: undefined,
          internal: undefined
        },
        review: {
          rating: undefined,
          comment: undefined,
          submittedAt: undefined
        },
        isDeleted: false,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      // TODO: Save booking to database

      return booking

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
    // TODO: Implement booking modification
  }

  async cancelBooking(
    bookingId: string,
    reason: string
  ) {
    // TODO: Implement booking cancellation
  }

  async checkIn(
    bookingId: string,
    unitId: string
  ) {
    // TODO: Implement check-in
  }

  async checkOut(
    bookingId: string
  ) {
    // TODO: Implement check-out
  }
}
