import { z } from 'zod'

export const PropertyTypeEnum = z.enum([
  'APARTMENT_COMPLEX',
  'HOTEL',
  'RESORT',
  'VACATION_RENTAL',
  'MIXED_USE'
])

export const UnitTypeEnum = z.enum([
  'ROOM',           // Basic hotel room
  'STUDIO',         // Studio apartment
  'APARTMENT',      // Full apartment
  'VILLA',          // Standalone villa
  'SUITE',          // Hotel suite
  'PENTHOUSE',      // Penthouse unit
  'COMMERCIAL'      // Commercial space
])

export const UnitStatusEnum = z.enum([
  'AVAILABLE',
  'OCCUPIED',
  'MAINTENANCE',
  'BLOCKED',
  'OUT_OF_ORDER'
])

export const PropertySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  type: PropertyTypeEnum,
  description: z.string(),
  location: z.object({
    address: z.string(),
    city: z.string(),
    state: z.string(),
    country: z.string(),
    postalCode: z.string(),
    coordinates: z.object({
      latitude: z.number(),
      longitude: z.number()
    })
  }),
  amenities: z.array(z.string()),
  images: z.array(z.string().url()),
  settings: z.object({
    allowInlineBooking: z.boolean(),
    preventSameDayBooking: z.boolean(),
    defaultCancellationPolicy: z.string(),
    defaultCheckInTime: z.string(),
    defaultCheckOutTime: z.string(),
    allowOverbooking: z.boolean(),
    minimumAdvanceBooking: z.number(),
    maximumAdvanceBooking: z.number().optional()
  }),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const UnitTypeSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  name: z.string(),
  type: UnitTypeEnum,
  description: z.string(),
  basePrice: z.number(),
  occupancy: z.object({
    minAdults: z.number(),
    maxAdults: z.number(),
    minChildren: z.number(),
    maxChildren: z.number(),
    maxOccupancy: z.number()
  }),
  amenities: z.array(z.string()),
  images: z.array(z.string().url()),
  availabilityRules: z.array(z.object({
    dateRange: z.object({
      startDate: z.date(),
      endDate: z.date()
    }),
    daysOfWeek: z.array(z.number()),
    maxAvailability: z.number(),
    priceMultiplier: z.number(),
    restrictions: z.array(z.object({
      type: z.enum(['MIN_STAY', 'MAX_STAY', 'CLOSED']),
      value: z.number().optional(),
      reason: z.string().optional()
    }))
  })),
  sortOrder: z.number(),
  isActive: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date()
})

export const UnitSchema = z.object({
  id: z.string().uuid(),
  propertyId: z.string().uuid(),
  unitTypeId: z.string().uuid(),
  name: z.string(),
  floor: z.number().optional(),
  status: UnitStatusEnum,
  features: z.array(z.string()),
  notes: z.string().optional(),
  score: z.number(), // For Elite subscription sorting
  canBeSoldOnline: z.boolean(),
  maintenanceHistory: z.array(z.object({
    date: z.date(),
    type: z.string(),
    description: z.string(),
    resolvedAt: z.date().optional()
  })),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Property = z.infer<typeof PropertySchema>
export type UnitType = z.infer<typeof UnitTypeSchema>
export type Unit = z.infer<typeof UnitSchema>
export type PropertyType = z.infer<typeof PropertyTypeEnum>
export type UnitType = z.infer<typeof UnitTypeEnum>
export type UnitStatus = z.infer<typeof UnitStatusEnum>
