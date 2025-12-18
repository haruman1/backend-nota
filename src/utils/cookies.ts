import type { CookieOptions } from 'elysia';

export const accessCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: false, // localhost
  sameSite: 'lax', // 🔥 WAJIB
  path: '/',
  maxAge: 60 * 5, // 5 menit
};

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: false,
  sameSite: 'lax',
  path: '/auth/refresh',
  maxAge: 60 * 60 * 24 * 30,
};
