import { Property, PropertyAvailability } from '../../domain/models/property';

export class PropertyRepository {
  private static instance: PropertyRepository;
  private properties: Map<string, Property> = new Map();
  private availability: Map<string, PropertyAvailability> = new Map();

  private constructor() {}

  static getInstance(): PropertyRepository {
    if (!PropertyRepository.instance) {
      PropertyRepository.instance = new PropertyRepository();
    }
    return PropertyRepository.instance;
  }

  async findById(id: string): Promise<Property | null> {
    return this.properties.get(id) || null;
  }

  async findByFilters(filters: {
    location?: string;
    priceRange?: { min: number; max: number };
    dates?: { start: Date; end: Date };
    guests?: number;
    amenities?: string[];
  }): Promise<Property[]> {
    return Array.from(this.properties.values()).filter(property => {
      let matches = true;

      if (filters.location) {
        matches = matches && (
          property.location.city.toLowerCase().includes(filters.location.toLowerCase()) ||
          property.location.state.toLowerCase().includes(filters.location.toLowerCase()) ||
          property.location.country.toLowerCase().includes(filters.location.toLowerCase())
        );
      }

      if (filters.priceRange) {
        matches = matches && (
          property.price.basePrice >= filters.priceRange.min &&
          property.price.basePrice <= filters.priceRange.max
        );
      }

      if (filters.guests) {
        matches = matches && property.maxGuests >= filters.guests;
      }

      if (filters.amenities?.length) {
        matches = matches && filters.amenities.every(amenity =>
          property.amenities.some(a => a.name.toLowerCase() === amenity.toLowerCase())
        );
      }

      return matches;
    });
  }

  async save(property: Property): Promise<void> {
    this.properties.set(property.id, property);
  }

  async getAvailability(propertyId: string): Promise<PropertyAvailability | null> {
    return this.availability.get(propertyId) || null;
  }

  async updateAvailability(propertyId: string, availability: PropertyAvailability): Promise<void> {
    this.availability.set(propertyId, availability);
  }
}
