import { Booking } from '../../domain/models/booking';

export class BookingRepository {
  private static instance: BookingRepository;
  private bookings: Map<string, Booking> = new Map();

  private constructor() {}

  static getInstance(): BookingRepository {
    if (!BookingRepository.instance) {
      BookingRepository.instance = new BookingRepository();
    }
    return BookingRepository.instance;
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.get(id) || null;
  }

  async findByTenantId(tenantId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.tenantId === tenantId);
  }

  async findByPropertyId(propertyId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.propertyId === propertyId);
  }

  async save(booking: Booking): Promise<void> {
    this.bookings.set(booking.id, booking);
  }

  async update(id: string, updates: Partial<Booking>): Promise<void> {
    const booking = await this.findById(id);
    if (!booking) throw new Error('Booking not found');

    Object.assign(booking, updates);
    await this.save(booking);
  }
}
