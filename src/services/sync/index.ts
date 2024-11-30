import { z } from 'zod';
import { legacySystemFactory } from '../legacy';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { TRPCError } from '@trpc/server';

const PropertySyncSchema = z.object({
  propertyId: z.string(),
  force: z.boolean().default(false),
});

export const syncRouter = createTRPCRouter({
  syncProperty: publicProcedure
    .input(PropertySyncSchema)
    .mutation(async ({ input, ctx }) => {
      const reserveClient = legacySystemFactory.createReserveClient();
      const calClient = legacySystemFactory.createCalClient();
      const rentalClient = legacySystemFactory.createRentalClient();

      try {
        // Fetch property data from all systems
        const [reserveData, calData, rentalData] = await Promise.all([
          reserveClient.request('/property/' + input.propertyId, 'GET'),
          calClient.request('/property/' + input.propertyId, 'GET'),
          rentalClient.request('/property/' + input.propertyId, 'GET'),
        ]);

        // Merge and normalize data
        const normalizedData = {
          id: input.propertyId,
          name: reserveData.name || rentalData.name,
          description: reserveData.description || rentalData.description,
          location: {
            address: rentalData.address,
            coordinates: rentalData.coordinates,
          },
          availability: {
            calendar: calData.availability,
            restrictions: reserveData.restrictions,
          },
          pricing: {
            base: reserveData.pricing.base,
            special: reserveData.pricing.special,
          },
          amenities: rentalData.amenities,
          images: rentalData.images,
        };

        // Update all systems with normalized data
        await Promise.all([
          reserveClient.request('/property/' + input.propertyId, 'PUT', normalizedData),
          calClient.request('/property/' + input.propertyId, 'PUT', normalizedData),
          rentalClient.request('/property/' + input.propertyId, 'PUT', normalizedData),
        ]);

        return {
          success: true,
          property: normalizedData,
        };
      } catch (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to sync property data',
          cause: error,
        });
      }
    }),
});
