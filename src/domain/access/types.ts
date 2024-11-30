/**
 * Domain types for access control
 * @package HexProperty
 */

import { ZoneId, PropertyId } from '../property/types';

export interface AccessToken {
  propertyId: PropertyId;
  guestId: string;
  validFrom: Date;
  validTo: Date;
  allowedZones: ZoneId[];
  publicFacilityAccess: string[];
}

export interface QRCode {
  token: AccessToken;
  code: string;
  issuedAt: Date;
  expiresAt: Date;
}

export interface FacialRecognition {
  guestId: string;
  faceData: string;
  registeredAt: Date;
  status: 'PENDING' | 'ACTIVE' | 'REVOKED';
}

export interface AccessGrant {
  qrCode: QRCode;
  facialRecognition: FacialRecognition;
  propertyAccess: PropertyId;
  zoneAccess: ZoneId[];
  facilityAccess: string[];
}
