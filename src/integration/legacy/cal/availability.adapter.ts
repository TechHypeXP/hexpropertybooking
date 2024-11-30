/**
 * Adapter for legacy Cal system availability
 * @package HexProperty
 * @module integration/legacy/cal
 */

import { DateRange, AvailabilityStatus } from '../../../domain/availability/types';

interface LegacyCalResponse {
  date: string;
  room_type_id: number;
  availability: number;
  restrictions: string[];
}

/**
 * Adapts legacy Cal system availability to domain model
 */
export class CalAvailabilityAdapter {
  /**
   * Maps legacy response to domain model
   */
  static toDomain(legacyResponse: LegacyCalResponse): AvailabilityStatus {
    return {
      isAvailable: legacyResponse.availability > 0,
      availableUnits: legacyResponse.availability,
      restrictions: legacyResponse.restrictions.map(r => ({
        type: r.split(':')[0] as any,
        value: r.split(':')[1],
        description: r.split(':')[2] || ''
      }))
    };
  }

  /**
   * Maps domain model to legacy format
   */
  static toLegacy(dateRange: DateRange): any {
    return {
      start_date: dateRange.startDate.toISOString().split('T')[0],
      end_date: dateRange.endDate.toISOString().split('T')[0]
    };
  }
}
