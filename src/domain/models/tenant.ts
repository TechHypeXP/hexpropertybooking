export interface TenantProfile {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  dateOfBirth?: Date;
  nationality?: string;
  profilePhoto?: string;
  verificationStatus: 'UNVERIFIED' | 'PENDING' | 'VERIFIED';
}

export interface TenantVerification {
  tenantId: string;
  documentType: 'ID_CARD' | 'PASSPORT' | 'DRIVERS_LICENSE';
  documentNumber: string;
  documentPhoto: string;
  verifiedAt?: Date;
  expiresAt?: Date;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export interface TenantPreferences {
  propertyTypes?: ('HOUSE' | 'APARTMENT' | 'CONDO' | 'VILLA')[];
  preferredLocations?: string[];
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  amenities?: string[];
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface TenantReview {
  tenantId: string;
  propertyId: string;
  bookingId: string;
  rating: number;
  comment?: string;
  createdBy: string;
  createdAt: Date;
}

export interface TenantPaymentMethod {
  id: string;
  tenantId: string;
  type: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_ACCOUNT';
  isDefault: boolean;
  details: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
  };
  createdAt: Date;
}
