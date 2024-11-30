/**
 * Core domain types for property management
 * @package HexProperty
 */

export type LocationId = string & { readonly _brand: unique symbol };
export type CompoundId = string & { readonly _brand: unique symbol };
export type ZoneId = string & { readonly _brand: unique symbol };
export type BuildingId = string & { readonly _brand: unique symbol };
export type PropertyId = string & { readonly _brand: unique symbol };

export interface Location {
  id: LocationId;
  name: string;
  compounds: Compound[];
}

export interface Compound {
  id: CompoundId;
  name: string;
  location: LocationId;
  zones: Zone[];
}

export interface Zone {
  id: ZoneId;
  name: string;
  compound: CompoundId;
  buildings: Building[];
  publicFacilities: PublicFacility[];
  accessRules: AccessRule[];
}

export interface Building {
  id: BuildingId;
  name: string;
  zone: ZoneId;
  properties: Property[];
}

export interface Property {
  id: PropertyId;
  buildingId: BuildingId;
  bedrooms: 1 | 2 | 3 | 4;
  floor: number;
  unit: string;
}

export interface PublicFacility {
  id: string;
  name: string;
  type: 'POOL' | 'GARDEN' | 'GYM' | 'PLAYGROUND';
  accessLevel: 'ALL' | 'ZONE_ONLY' | 'COMPOUND_ONLY';
}

export interface AccessRule {
  facilityId: string;
  allowedZones: ZoneId[];
  timeRestrictions?: {
    start: string; // HH:mm
    end: string;   // HH:mm
  };
}
