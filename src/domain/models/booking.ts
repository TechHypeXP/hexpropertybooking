export interface BookingDates {
  checkIn: Date;
  checkOut: Date;
}

export interface BookingGuest {
  name: string;
  email: string;
  phone?: string;
}

export interface BookingPrice {
  basePrice: number;
  cleaningFee: number;
  serviceFee: number;
  taxes: number;
  total: number;
  currency: string;
}

export interface BookingPayment {
  id: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  method: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  amount: number;
  currency: string;
  transactionId?: string;
  refundId?: string;
}

export interface Booking {
  id: string;
  propertyId: string;
  tenantId: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  dates: BookingDates;
  guests: BookingGuest[];
  price: BookingPrice;
  payment: BookingPayment;
  specialRequests?: string;
  cancellationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BookingCancellation {
  bookingId: string;
  reason: string;
  requestedBy: string;
  refundAmount?: number;
  cancellationFee?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}

export interface BookingModification {
  bookingId: string;
  previousDates: BookingDates;
  newDates: BookingDates;
  priceDifference: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: Date;
}
