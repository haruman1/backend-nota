import type { CookieOptions } from 'elysia';
const isProd = process.env.NODE_ENV === 'production';
export const accessCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd, // localhost
  sameSite: isProd ? 'none' : 'lax',
  domain: isProd ? '.haruman.me' : undefined,
  // ❌ JANGAN SET domain di localhost
  path: '/',
  maxAge: 60 * 5,
};

export const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  domain: isProd ? '.haruman.me' : undefined,
  // ❌ JANGAN SET domain di localhost
  path: '/',
  maxAge: 60 * 60 * 24 * 30,
};

export const csrfCookieOptions: CookieOptions = {
  httpOnly: false,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  domain: isProd ? '.haruman.me' : undefined,
  path: '/',
  maxAge: 60 * 60 * 24,
};
