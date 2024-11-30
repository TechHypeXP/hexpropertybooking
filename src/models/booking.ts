import { z } from 'zod'

export const BookingStateEnum = z.enum([
  'INQUIRY',           // Initial inquiry
  'PENDING',          // Awaiting confirmation
  'CONFIRMED',        // Confirmed but not checked in
  'CHECKED_IN',       // Guest has arrived
  'CHECKED_OUT',      // Guest has departed
  'CANCELLED',        // Booking was cancelled
  'NO_SHOW',          // Guest didn't arrive
  'UNCONFIRMED'       // For overbooking scenarios
])

export const PaymentPeriodEnum = z.enum([
  'DAILY',
  'WEEKLY',
  'MONTHLY',
  'ONE_TIME'
])

export const ChargeTypeEnum = z.enum([
  'ROOM_CHARGE',
  'EXTRA_PERSON',
  'AMENITY',
  'SERVICE',
  'TAX',
  'DISCOUNT'
])

export const PaymentStatusEnum = z.enum([
  'PENDING',
  'AUTHORIZED',
  'PAID',
  'PARTIALLY_PAID',
  'REFUNDED',
  'FAILED'
])

export const BookingSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  unitTypeId: z.string().uuid(),
  unitId: z.string().uuid().optional(), // May be assigned later
  customerId: z.string().uuid(),
  companyId: z.string().uuid(),
  source: z.string(), // Booking channel/source
  state: BookingStateEnum,
  paymentPeriod: PaymentPeriodEnum,
  dates: z.object({
    checkIn: z.date(),
    checkOut: z.date(),
    sellingDate: z.date(), // Important for charge calculations
    actualCheckIn: z.date().optional(),
    actualCheckOut: z.date().optional()
  }),
  occupancy: z.object({
    adults: z.number(),
    children: z.number()
  }),
  charges: z.array(z.object({
    date: z.date(),
    type: ChargeTypeEnum,
    description: z.string(),
    amount: z.number(),
    taxes: z.array(z.object({
      name: z.string(),
      rate: z.number(),
      amount: z.number()
    }))
  })),
  ratePlan: z.object({
    id: z.string().uuid(),
    name: z.string(),
    baseRate: z.number(),
    extraPersonRate: z.number().optional(),
    minimumStay: z.number(),
    maximumStay: z.number().optional()
  }).optional(),
  notes: z.object({
    booking: z.string().optional(),
    housekeeping: z.string().optional(),
    internal: z.string().optional()
  }),
  review: z.object({
    rating: z.number().min(1).max(5).optional(),
    comment: z.string().optional(),
    submittedAt: z.date().optional()
  }),
  paymentStatus: PaymentStatusEnum,
  isDeleted: z.boolean(),
  color: z.string().optional(), // For calendar display
  createdAt: z.date(),
  updatedAt: z.date()
})

export const BookingRuleSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  unitTypeId: z.string().uuid(),
  name: z.string(),
  dateRange: z.object({
    startDate: z.date(),
    endDate: z.date()
  }),
  daysOfWeek: z.array(z.number()), // 0-6 for Sunday-Saturday
  restrictions: z.object({
    minimumStay: z.number(),
    maximumStay: z.number().optional(),
    minimumAdvanceBooking: z.number(),
    maximumAdvanceBooking: z.number().optional(),
    allowedPaymentPeriods: z.array(PaymentPeriodEnum),
    closedToArrival: z.boolean(),
    closedToDeparture: z.boolean(),
    maxOccupancy: z.number().optional()
  }),
  rates: z.object({
    baseRate: z.number(),
    extraPersonRate: z.number().optional(),
    minimumRate: z.number().optional(),
    maximumRate: z.number().optional(),
    rateMultiplier: z.number().default(1)
  }),
  channelRestrictions: z.array(z.object({
    channelId: z.string(),
    maxAvailability: z.number(),
    rateMultiplier: z.number().default(1),
    restrictions: z.array(z.object({
      type: z.string(),
      value: z.number().optional()
    }))
  })),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Booking = z.infer<typeof BookingSchema>
export type BookingRule = z.infer<typeof BookingRuleSchema>
export type BookingState = z.infer<typeof BookingStateEnum>
export type PaymentPeriod = z.infer<typeof PaymentPeriodEnum>
export type ChargeType = z.infer<typeof ChargeTypeEnum>
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>
