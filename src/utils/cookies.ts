import type { CookieOptions } from 'elysia';

export const accessCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true, // localhost
  sameSite: 'none', // 🔥 WAJIB
  domain: 'localhost', // sesuaikan dengan domain kalian
  path: '/',
  maxAge: 60 * 5, // 5 menit
};

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  domain: 'localhost',
  path: '/auth/refresh',
  maxAge: 60 * 60 * 24 * 30,
};
export const csrfCookieOptions: CookieOptions = {
  httpOnly: false, // HARUS false (dibaca JS)
  secure: true,
  sameSite: 'none' as const,
  domain: 'localhost',
  path: '/',
  maxAge: 60 * 60 * 24, // 1 hari
};
