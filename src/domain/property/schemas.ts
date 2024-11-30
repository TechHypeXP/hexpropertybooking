/**
 * Property domain schemas
 * @package HexPropertyBooking
 */

import { z } from 'zod';
import { LocationId, CompoundId, ZoneId, BuildingId, PropertyId } from './types';

// Branded type schemas
const LocationIdSchema = z.string().brand<{ readonly _brand: unique symbol }>() as z.Schema<LocationId>;
const CompoundIdSchema = z.string().brand<{ readonly _brand: unique symbol }>() as z.Schema<CompoundId>;
const ZoneIdSchema = z.string().brand<{ readonly _brand: unique symbol }>() as z.Schema<ZoneId>;
const BuildingIdSchema = z.string().brand<{ readonly _brand: unique symbol }>() as z.Schema<BuildingId>;
const PropertyIdSchema = z.string().brand<{ readonly _brand: unique symbol }>() as z.Schema<PropertyId>;

// Time restriction schema
export const TimeRestrictionSchema = z.object({
  start: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/),
  end: z.string().regex(/^([0-1][0-9]|2[0-3]):[0-5][0-9]$/)
});

// Facility schemas
export const PublicFacilitySchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  capacity: z.number().int().positive().optional()
});

export const AccessRuleSchema = z.object({
  facilityId: z.string(),
  allowedZones: z.array(ZoneIdSchema),
  timeRestrictions: TimeRestrictionSchema.optional()
});

// Core property schemas
export const PropertySchema = z.object({
  id: PropertyIdSchema,
  buildingId: BuildingIdSchema,
  bedrooms: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
  floor: z.number().int().min(0),
  unit: z.string().min(1)
});

export const BuildingSchema = z.object({
  id: BuildingIdSchema,
  name: z.string().min(1),
  zone: ZoneIdSchema,
  properties: z.array(PropertySchema)
});

export const ZoneSchema = z.object({
  id: ZoneIdSchema,
  name: z.string().min(1),
  compound: CompoundIdSchema,
  buildings: z.array(BuildingSchema),
  publicFacilities: z.array(PublicFacilitySchema),
  accessRules: z.array(AccessRuleSchema)
});

export const CompoundSchema = z.object({
  id: CompoundIdSchema,
  name: z.string().min(1),
  location: LocationIdSchema,
  zones: z.array(ZoneSchema)
});

export const LocationSchema = z.object({
  id: LocationIdSchema,
  name: z.string().min(1),
  compounds: z.array(CompoundSchema)
});

// Type exports
export type TimeRestriction = z.infer<typeof TimeRestrictionSchema>;
export type PublicFacility = z.infer<typeof PublicFacilitySchema>;
export type AccessRule = z.infer<typeof AccessRuleSchema>;
export type Property = z.infer<typeof PropertySchema>;
export type Building = z.infer<typeof BuildingSchema>;
export type Zone = z.infer<typeof ZoneSchema>;
export type Compound = z.infer<typeof CompoundSchema>;
export type Location = z.infer<typeof LocationSchema>;
