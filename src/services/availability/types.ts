import { z } from 'zod'

export const DateRangeSchema = z.object({
  start: z.date(),
  end: z.date()
})

export type DateRange = z.infer<typeof DateRangeSchema>

export const AvailabilityStatusSchema = z.enum([
  'AVAILABLE',
  'UNAVAILABLE',
  'MAINTENANCE',
  'BLOCKED',
  'PENDING_CONFIRMATION'
])

export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>

export const InventoryUpdateSchema = z.object({
  propertyId: z.string(),
  unitId: z.string().optional(),
  unitTypeId: z.string(),
  dateRange: DateRangeSchema,
  status: AvailabilityStatusSchema,
  reason: z.string().optional(),
  metadata: z.record(z.string(), z.any()).optional()
})

export type InventoryUpdate = z.infer<typeof InventoryUpdateSchema>

export const AvailabilityRulesSchema = z.object({
  minStayDays: z.number().min(1),
  maxStayDays: z.number().min(1),
  minAdvanceBookingDays: z.number().min(0),
  maxAdvanceBookingDays: z.number().min(0),
  allowedDaysOfWeek: z.array(z.number().min(0).max(6)),
  seasonalRules: z.array(z.object({
    startMonth: z.number().min(1).max(12),
    endMonth: z.number().min(1).max(12),
    minStayDays: z.number().min(1),
    maxStayDays: z.number().min(1)
  })).optional()
})

export type AvailabilityRules = z.infer<typeof AvailabilityRulesSchema>

export const AvailabilityResponseSchema = z.object({
  isAvailable: z.boolean(),
  status: AvailabilityStatusSchema,
  conflicts: z.array(z.object({
    date: z.date(),
    reason: z.string(),
    status: AvailabilityStatusSchema
  })).optional(),
  rules: z.array(z.object({
    rule: z.string(),
    passed: z.boolean(),
    message: z.string()
  })).optional()
})

export type AvailabilityResponse = z.infer<typeof AvailabilityResponseSchema>
