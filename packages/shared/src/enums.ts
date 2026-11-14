/**
 * Domain enums shared by every client. Values mirror the Prisma enums in
 * backend/prisma/schema.prisma — change both together.
 */

export const UserRole = {
  CUSTOMER: 'CUSTOMER',
  TECHNICIAN: 'TECHNICIAN',
  ADMIN: 'ADMIN',
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const UserStatus = {
  ACTIVE: 'ACTIVE',
  LOCKED: 'LOCKED',
} as const;
export type UserStatus = (typeof UserStatus)[keyof typeof UserStatus];

/**
 * Booking lifecycle. Transitions are enforced server-side only
 * (backend/src/modules/booking/booking.state.ts — owner: TV2).
 *
 * PENDING_PAYMENT -> PAID -> ASSIGNED -> EN_ROUTE -> IN_PROGRESS -> COMPLETED
 * CONFIRMED_CASH  ---------^ (cash is collected on completion)
 * any pre-EN_ROUTE state -> CANCELLED ; PENDING_PAYMENT -> EXPIRED
 */
export const BookingStatus = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  CONFIRMED_CASH: 'CONFIRMED_CASH',
  PAID: 'PAID',
  ASSIGNED: 'ASSIGNED',
  EN_ROUTE: 'EN_ROUTE',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
} as const;
export type BookingStatus = (typeof BookingStatus)[keyof typeof BookingStatus];

export const PaymentStatus = {
  PENDING: 'PENDING',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
  EXPIRED: 'EXPIRED',
  REFUNDED: 'REFUNDED',
} as const;
export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus];

export const PaymentMethod = {
  GATEWAY: 'GATEWAY',
  CASH: 'CASH',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const ServiceDomain = {
  CLEANING: 'CLEANING',
  REPAIR: 'REPAIR',
  APPLIANCE: 'APPLIANCE',
} as const;
export type ServiceDomain = (typeof ServiceDomain)[keyof typeof ServiceDomain];
