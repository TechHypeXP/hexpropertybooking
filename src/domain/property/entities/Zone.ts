/**
 * Zone Entity - Building and Facility Aggregate Root
 * @package HexPropertyBooking
 */

import { ZoneId, CompoundId, BuildingId } from '../types';
import { ZoneSchema, PublicFacility, AccessRule, Building } from '../schemas';

export class Zone {
  private constructor(
    private readonly id: ZoneId,
    private readonly name: string,
    private readonly compoundId: CompoundId,
    private readonly buildings: Map<BuildingId, Building>,
    private readonly facilities: PublicFacility[],
    private readonly accessRules: AccessRule[]
  ) {}

  static create(
    id: ZoneId,
    name: string,
    compoundId: CompoundId,
    buildings: Building[] = [],
    facilities: PublicFacility[] = [],
    accessRules: AccessRule[] = []
  ): Zone {
    const buildingMap = new Map(
      buildings.map(b => [b.id, b])
    );

    const zoneData = {
      id,
      name,
      compound: compoundId,
      buildings: buildings,
      publicFacilities: facilities,
      accessRules
    };

    ZoneSchema.parse(zoneData);

    return new Zone(
      id,
      name,
      compoundId,
      buildingMap,
      facilities,
      accessRules
    );
  }

  getId(): ZoneId {
    return this.id;
  }

  getName(): string {
    return this.name;
  }

  getCompoundId(): CompoundId {
    return this.compoundId;
  }

  getBuildings(): Building[] {
    return Array.from(this.buildings.values());
  }

  getBuilding(buildingId: BuildingId): Building | undefined {
    return this.buildings.get(buildingId);
  }

  getFacilities(): PublicFacility[] {
    return [...this.facilities];
  }

  getAccessRules(): AccessRule[] {
    return [...this.accessRules];
  }

  addBuilding(building: Building): void {
    if (building.zone !== this.id) {
      throw new Error('Building does not belong to this zone');
    }
    this.buildings.set(building.id, building);
  }

  removeBuilding(buildingId: BuildingId): void {
    if (!this.buildings.delete(buildingId)) {
      throw new Error('Building not found in zone');
    }
  }

  addFacility(facility: PublicFacility): void {
    if (this.facilities.some(f => f.id === facility.id)) {
      throw new Error('Facility already exists in zone');
    }
    this.facilities.push(facility);
  }

  addAccessRule(rule: AccessRule): void {
    if (this.accessRules.some(r => r.facilityId === rule.facilityId)) {
      throw new Error('Access rule already exists for facility');
    }
    this.accessRules.push(rule);
  }

  canAccessFacility(facilityId: string, zoneId: ZoneId): boolean {
    const rule = this.accessRules.find(r => r.facilityId === facilityId);
    if (!rule) return true; // No rule means open access
    return rule.allowedZones.includes(zoneId);
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      compound: this.compoundId,
      buildings: this.getBuildings(),
      publicFacilities: this.facilities,
      accessRules: this.accessRules
    };
  }
}
