import { randomUUID } from 'crypto';

export function generateCSRFToken() {
  return randomUUID();
}

export function verifyCSRF(cookieToken?: string, headerToken?: string) {
  return cookieToken && headerToken && cookieToken === headerToken;
}
