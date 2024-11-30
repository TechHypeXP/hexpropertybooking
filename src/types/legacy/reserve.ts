/**
 * Reserve System type definitions
 * @package HexPropertyBooking
 */

import { z } from 'zod';

// Original Reserve types
export const ReserveBookingSchema = z.object({
  booking_id: z.string(),
  property_id: z.string(),
  check_in: z.string(),
  check_out: z.string(),
  guest_count: z.number(),
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']),
  channel: z.string().optional()
});

export const ReserveGuestSchema = z.object({
  guest_id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional()
});

// Inferred Types
export type ReserveBooking = z.infer<typeof ReserveBookingSchema>;
export type ReserveGuest = z.infer<typeof ReserveGuestSchema>;
