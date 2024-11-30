/**
 * Zod schemas for availability domain
 * @package HexProperty
 * @module domain/availability
 */

import { z } from 'zod';

export const DateRangeSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
}).refine(data => data.startDate < data.endDate, {
  message: "Start date must be before end date",
  path: ["startDate"]
});

export const BookingRestrictionTypeSchema = z.enum([
  'MIN_STAY',
  'MAX_STAY',
  'CHECKIN_DAY',
  'CHECKOUT_DAY',
  'ADVANCE_BOOKING',
  'LAST_MINUTE_BOOKING'
]);

export const BookingRestrictionSchema = z.object({
  type: BookingRestrictionTypeSchema,
  value: z.string(),
  message: z.string().optional()
});

export const AvailabilityStatusSchema = z.object({
  isAvailable: z.boolean(),
  availableUnits: z.number().int().min(0),
  restrictions: z.array(BookingRestrictionSchema)
});

export const PropertyIdSchema = z.string().min(1);

export const AvailabilitySchema = z.object({
  propertyId: PropertyIdSchema,
  dateRange: DateRangeSchema,
  availableUnits: z.number().int().min(0),
  restrictions: z.array(BookingRestrictionSchema)
});
