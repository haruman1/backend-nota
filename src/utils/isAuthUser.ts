// src/utils/isAuthUser.ts
import type { AuthUser } from '../types/jwt';

export function isAuthUser(payload: any): payload is AuthUser {
  return (
    payload &&
    typeof payload === 'object' &&
    typeof payload.id === 'string' &&
    typeof payload.email === 'string' &&
    (payload.role === 'admin' || payload.role === 'user')
  );
}
