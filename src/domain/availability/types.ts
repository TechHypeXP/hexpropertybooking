/**
 * Domain types for availability management
 * @package HexProperty
 * @module domain/availability
 */

import { z } from 'zod';

// Zod Schemas
export const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date()
}).refine(data => data.startDate < data.endDate, {
  message: "Start date must be before end date",
  path: ["startDate"]
});

export const BookingRestrictionTypeSchema = z.enum([
  'MIN_STAY',
  'MAX_STAY',
  'CHECK_IN_DAY',
  'CHECK_OUT_DAY'
]);

export const BookingRestrictionSchema = z.object({
  type: BookingRestrictionTypeSchema,
  value: z.union([z.number(), z.string()]),
  description: z.string()
});

export const AvailabilityStatusSchema = z.object({
  isAvailable: z.boolean(),
  availableUnits: z.number().int().min(0),
  restrictions: z.array(BookingRestrictionSchema).optional()
});

export const AvailabilityChangedEventSourceSchema = z.enum([
  'DIRECT',
  'CHANNEL',
  'SYSTEM'
]);

export const AvailabilityChangedEventSchema = z.object({
  propertyId: z.string(),
  dateRange: DateRangeSchema,
  previousStatus: AvailabilityStatusSchema,
  newStatus: AvailabilityStatusSchema,
  source: AvailabilityChangedEventSourceSchema
});

// Inferred Types
export type DateRange = z.infer<typeof DateRangeSchema>;
export type BookingRestrictionType = z.infer<typeof BookingRestrictionTypeSchema>;
export type BookingRestriction = z.infer<typeof BookingRestrictionSchema>;
export type AvailabilityStatus = z.infer<typeof AvailabilityStatusSchema>;
export type AvailabilityChangedEventSource = z.infer<typeof AvailabilityChangedEventSourceSchema>;
export type AvailabilityChangedEvent = z.infer<typeof AvailabilityChangedEventSchema>;
