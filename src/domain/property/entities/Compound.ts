/**
 * Compound Entity - Zone Collection Management
 * @package HexPropertyBooking
 */

import { CompoundId, LocationId, ZoneId } from '../types';
import { CompoundSchema } from '../schemas';
import { Zone } from './Zone';

export class Compound {
  private constructor(
    private readonly id: CompoundId,
    private readonly name: string,
    private readonly locationId: LocationId,
    private readonly zones: Map<ZoneId, Zone>,
    private readonly sharedFacilities: boolean
  ) {}

  static create(
    id: CompoundId,
    name: string,
    locationId: LocationId,
    zones: Zone[] = [],
    sharedFacilities: boolean = false
  ): Compound {
    const zoneMap = new Map(
      zones.map(z => [z.getId(), z])
    );

    const compoundData = {
      id,
      name,
      location: locationId,
      zones: zones.map(z => z.toJSON()),
      sharedFacilities
    };

    CompoundSchema.parse(compoundData);

    return new Compound(
      id,
      name,
      locationId,
      zoneMap,
      sharedFacilities
    );
  }

  getId(): CompoundId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getLocationId(): LocationId {
    return this.locationId;
  }

  getZones(): Zone[] {
    return Array.from(this.zones.values());
  }

  getZone(zoneId: ZoneId): Zone | undefined {
    return this.zones.get(zoneId);
  }

  hasSharedFacilities(): boolean {
    return this.sharedFacilities;
  }

  addZone(zone: Zone): void {
    if (zone.getCompoundId() !== this.id) {
      throw new Error('Zone does not belong to this compound');
    }
    this.zones.set(zone.getId(), zone);
  }

  removeZone(zoneId: ZoneId): void {
    if (!this.zones.delete(zoneId)) {
      throw new Error('Zone not found in compound');
    }
  }

  getAllFacilities(): Array<{ zoneId: ZoneId; facilities: any[] }> {
    return this.getZones().map(zone => ({
      zoneId: zone.getId(),
      facilities: zone.getFacilities()
    }));
  }

  canAccessFacility(facilityId: string, fromZoneId: ZoneId, toZoneId: ZoneId): boolean {
    if (fromZoneId === toZoneId) return true;
    if (!this.sharedFacilities) return false;

    const targetZone = this.getZone(toZoneId);
    return targetZone ? targetZone.canAccessFacility(facilityId, fromZoneId) : false;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      location: this.locationId,
      zones: this.getZones().map(z => z.toJSON()),
      sharedFacilities: this.sharedFacilities
    };
  }
}
