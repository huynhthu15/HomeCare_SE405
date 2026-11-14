/**
 * Socket.IO contract (owner: TV4 — tracking/notifications).
 * Server: backend/src/modules/tracking. Namespace: /realtime.
 * Auth: client sends the access JWT in `auth.token` during the handshake.
 *
 * Rooms joined by the server (clients can never join rooms themselves):
 *   user:{userId}            personal notifications
 *   booking:{bookingId}      everyone allowed to watch a booking (customer, assigned technician, admins)
 *   technician:{technicianId}
 */
export const RealtimeNamespace = '/realtime';

export const ServerEvent = {
  BOOKING_STATUS_CHANGED: 'booking.status_changed',
  TECHNICIAN_LOCATION: 'technician.location',
  NOTIFICATION_CREATED: 'notification.created',
  DISPATCH_OFFER: 'dispatch.offer',
} as const;

export const ClientEvent = {
  /** Technician app -> server, throttled server-side */
  LOCATION_UPDATE: 'technician.location.update',
  /** Customer/admin asks to watch a booking; server checks ownership before joining the room */
  WATCH_BOOKING: 'booking.watch',
} as const;

export interface LocationUpdatePayload {
  bookingId: string;
  lat: number;
  lng: number;
  /** metres */
  accuracy?: number;
  /** epoch ms on the device */
  recordedAt: number;
}

export interface TechnicianLocationEvent {
  bookingId: string;
  lat: number;
  lng: number;
  etaSeconds: number | null;
  at: string;
}

export interface BookingStatusChangedEvent {
  bookingId: string;
  from: string;
  to: string;
  at: string;
}
