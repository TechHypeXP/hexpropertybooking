import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { env } from '@/env.mjs';
import { TRPCError } from '@trpc/server';

const AvailabilityRequestSchema = z.object({
  propertyId: z.string(),
  startDate: z.string(),
  endDate: z.string(),
});

export const availabilityRouter = createTRPCRouter({
  check: publicProcedure
    .input(AvailabilityRequestSchema)
    .query(async ({ input, ctx }) => {
      try {
        // Query HexPropertyReserve
        const reserveResponse = await fetch(
          `${env.LEGACY_RESERVE_API}/availability`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              property_id: input.propertyId,
              date_from: input.startDate,
              date_to: input.endDate,
            }),
          }
        );

        // Query HexPropertyCal
        const calResponse = await fetch(
          `${env.LEGACY_CAL_API}/availability`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              property_id: input.propertyId,
              start_date: input.startDate,
              end_date: input.endDate,
            }),
          }
        );

        const [reserveData, calData] = await Promise.all([
          reserveResponse.json(),
          calResponse.json(),
        ]);

        // Merge and validate availability data
        const availability = {
          isAvailable: reserveData.available && calData.available,
          reserveSystem: {
            available: reserveData.available,
            price: reserveData.price,
            restrictions: reserveData.restrictions,
          },
          calSystem: {
            available: calData.available,
            events: calData.events,
            blocks: calData.blocks,
          },
        };

        return availability;
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to check availability',
          cause: error,
        });
      }
    }),
});
