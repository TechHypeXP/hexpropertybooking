/**
 * Direct TypeScript mapping of legacy Cal system availability types
 * @package HexProperty
 */

export interface LegacyDateRange {
  date_start: string;
  date_end: string;
  sunday: '0' | '1';
  monday: '0' | '1';
  tuesday: '0' | '1';
  wednesday: '0' | '1';
  thursday: '0' | '1';
  friday: '0' | '1';
  saturday: '0' | '1';
}

export interface LegacyRoomType {
  id: number;
  name: string;
  is_deleted: '0' | '1';
}

export interface LegacyRoom {
  room_id: number;
  room_type_id: number;
  can_be_sold_online: '0' | '1';
  is_deleted: '0' | '1';
}

export interface LegacyBooking {
  booking_id: number;
  source: number;
  state: number;
  is_deleted: '0' | '1';
}

export interface LegacyBookingBlock {
  booking_id: number;
  room_id: number;
  check_in_date: string;
  check_out_date: string;
}

export interface LegacyAvailabilityResponse {
  date: string;
  room_type_id: number;
  name: string;
  availability: number;
}
