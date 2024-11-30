/**
 * CAL System type definitions
 * @package HexPropertyBooking
 */

import { z } from 'zod';

// Original CAL types
export const CalDateRangeSchema = z.object({
  date_start: z.string(),
  date_end: z.string(),
  is_available: z.boolean()
});

export const CalAvailabilitySchema = z.object({
  property_id: z.string(),
  availability: z.number(),
  restrictions: z.array(z.object({
    type: z.string(),
    value: z.string(),
    message: z.string().optional()
  })).optional()
});

// Inferred Types
export type CalDateRange = z.infer<typeof CalDateRangeSchema>;
export type CalAvailability = z.infer<typeof CalAvailabilitySchema>;
