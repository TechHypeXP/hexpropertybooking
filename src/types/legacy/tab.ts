/**
 * Tab System type definitions
 * @package HexPropertyBooking
 */

import { z } from 'zod';

// Original Tab UI types
export const TabUIStateSchema = z.object({
  view: z.enum(['CALENDAR', 'LIST', 'GRID']),
  filters: z.object({
    dates: z.object({
      start: z.string().optional(),
      end: z.string().optional()
    }),
    propertyTypes: z.array(z.string()).optional(),
    bedrooms: z.array(z.number()).optional(),
    features: z.array(z.string()).optional()
  }),
  sorting: z.object({
    field: z.string(),
    direction: z.enum(['ASC', 'DESC'])
  })
});

export const TabBookingFormSchema = z.object({
  propertyId: z.string(),
  dates: z.object({
    checkIn: z.string(),
    checkOut: z.string()
  }),
  guests: z.number().int().min(1),
  specialRequests: z.string().optional()
});

// Inferred Types
export type TabUIState = z.infer<typeof TabUIStateSchema>;
export type TabBookingForm = z.infer<typeof TabBookingFormSchema>;
