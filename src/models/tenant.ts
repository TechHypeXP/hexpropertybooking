import { z } from 'zod'

export const TenantTypeEnum = z.enum([
  'INDIVIDUAL',
  'CORPORATE',
  'AGENT'
])

export const TenantVerificationStatusEnum = z.enum([
  'PENDING',
  'VERIFIED',
  'REJECTED'
])

export const TenantSchema = z.object({
  id: z.string().uuid(),
  type: TenantTypeEnum,
  profile: z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string(),
    dateOfBirth: z.date().optional(),
    nationality: z.string().optional(),
    company: z.string().optional(),
    taxId: z.string().optional()
  }),
  verificationStatus: TenantVerificationStatusEnum,
  verificationDetails: z.object({
    idDocument: z.string().optional(),
    proofOfAddress: z.string().optional(),
    companyRegistration: z.string().optional(),
    verifiedAt: z.date().optional(),
    verifiedBy: z.string().uuid().optional()
  }),
  paymentMethods: z.array(z.object({
    id: z.string(),
    type: z.string(),
    last4: z.string(),
    expiryMonth: z.number(),
    expiryYear: z.number(),
    isDefault: z.boolean()
  })),
  bookingHistory: z.array(z.object({
    bookingId: z.string().uuid(),
    unitId: z.string().uuid(),
    checkIn: z.date(),
    checkOut: z.date(),
    status: z.string(),
    rating: z.number().optional(),
    review: z.string().optional()
  })),
  preferences: z.object({
    preferredLanguage: z.string(),
    preferredCurrency: z.string(),
    marketingConsent: z.boolean(),
    notificationPreferences: z.object({
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean()
    })
  }),
  createdAt: z.date(),
  updatedAt: z.date()
})

export type Tenant = z.infer<typeof TenantSchema>
export type TenantType = z.infer<typeof TenantTypeEnum>
export type TenantVerificationStatus = z.infer<typeof TenantVerificationStatusEnum>
