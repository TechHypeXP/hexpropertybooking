export interface PaymentMethod {
  id: string;
  type: 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  details: {
    last4?: string;
    brand?: string;
    expiryMonth?: number;
    expiryYear?: number;
    accountNumber?: string;
    routingNumber?: string;
  };
}

export interface PaymentTransaction {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  paymentMethodId: string;
  processorTransactionId?: string;
  error?: {
    code: string;
    message: string;
  };
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentRefund {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  processorRefundId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PaymentDispute {
  id: string;
  transactionId: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'PENDING' | 'WON' | 'LOST';
  evidence?: {
    description: string;
    files: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}
