/**
 * Core domain entity for Availability
 * @package HexPropertyBooking
 * @module domain/availability
 */

import { 
  DateRange, 
  AvailabilityStatus, 
  BookingRestriction,
  DateRangeSchema,
  BookingRestrictionSchema,
  AvailabilityStatusSchema
} from '@/types/domain/availability';

export class Availability {
  private constructor(
    private readonly propertyId: string,
    private readonly dateRange: DateRange,
    private availableUnits: number,
    private restrictions: BookingRestriction[]
  ) {}

  static create(
    propertyId: string,
    dateRange: DateRange,
    availableUnits: number,
    restrictions: BookingRestriction[] = []
  ): Availability {
    DateRangeSchema.parse(dateRange);
    restrictions.forEach(restriction => {
      BookingRestrictionSchema.parse(restriction);
    });

    if (availableUnits < 0) {
      throw new Error('Available units cannot be negative');
    }

    return new Availability(propertyId, dateRange, availableUnits, restrictions);
  }

  getStatus(): AvailabilityStatus {
    const status: AvailabilityStatus = {
      isAvailable: this.availableUnits > 0 && this.meetsRestrictions(),
      availableUnits: this.availableUnits,
      restrictions: this.restrictions
    };

    return AvailabilityStatusSchema.parse(status);
  }

  private meetsRestrictions(): boolean {
    // Implement restriction validation logic
    return true;
  }

  getPropertyId(): string {
    return this.propertyId;
  }

  getDateRange(): DateRange {
    return this.dateRange;
  }

  getRestrictions(): BookingRestriction[] {
    return [...this.restrictions];
  }

  updateAvailableUnits(units: number): void {
    if (units < 0) {
      throw new Error('Available units cannot be negative');
    }
    this.availableUnits = units;
  }

  addRestriction(restriction: BookingRestriction): void {
    BookingRestrictionSchema.parse(restriction);
    this.restrictions.push(restriction);
  }
}
