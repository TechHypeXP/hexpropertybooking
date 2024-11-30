/**
 * Rental System type definitions
 * @package HexPropertyBooking
 */

import { z } from 'zod';

// Original Rental types
export const RentalPropertySchema = z.object({
  property_id: z.string(),
  compound_id: z.string(),
  zone_id: z.string().optional(),
  type: z.enum(['APARTMENT', 'VILLA', 'CHALET']),
  bedrooms: z.number().int().min(0),
  max_occupancy: z.number().int().min(1),
  features: z.array(z.string()).optional()
});

export const RentalOwnerSchema = z.object({
  owner_id: z.string(),
  name: z.string(),
  contact: z.object({
    email: z.string().email(),
    phone: z.string(),
    preferred: z.enum(['EMAIL', 'PHONE', 'BOTH'])
  }),
  notification_settings: z.object({
    bookings: z.boolean(),
    maintenance: z.boolean(),
    reports: z.boolean()
  })
});

// Inferred Types
export type RentalProperty = z.infer<typeof RentalPropertySchema>;
export type RentalOwner = z.infer<typeof RentalOwnerSchema>;
