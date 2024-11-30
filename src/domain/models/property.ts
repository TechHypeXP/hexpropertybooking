export interface PropertyAmenity {
  id: string;
  name: string;
  description?: string;
  icon?: string;
}

export interface PropertyLocation {
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

export interface PropertyPrice {
  basePrice: number;
  currency: string;
  cleaningFee?: number;
  serviceFee?: number;
  minimumStay?: number;
}

export interface Property {
  id: string;
  title: string;
  description: string;
  type: 'HOUSE' | 'APARTMENT' | 'CONDO' | 'VILLA';
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING' | 'BLOCKED';
  ownerId: string;
  location: PropertyLocation;
  price: PropertyPrice;
  amenities: PropertyAmenity[];
  bedrooms: number;
  bathrooms: number;
  maxGuests: number;
  photos: string[];
  rules?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface PropertyAvailability {
  propertyId: string;
  dates: {
    start: Date;
    end: Date;
  }[];
  blockedDates?: {
    start: Date;
    end: Date;
    reason?: string;
  }[];
  specialPrices?: {
    date: Date;
    price: number;
    reason?: string;
  }[];
}
