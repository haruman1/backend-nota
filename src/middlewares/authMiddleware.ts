// src/middlewares/authMiddleware.ts
import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { AuthUser } from '../types/jwt';
import { isAuthUser } from '../utils/isAuthUser';

export const authMiddleware = new Elysia()
  .use(
    jwt({
      secret: process.env.JWT_SECRET!,
    })
  )

  /**
   * Ambil user dari HttpOnly Cookie
   */
  .derive(async ({ jwt, cookie }) => {
    const token = cookie.accessToken?.value;

    // ❗ Tidak throw error di sini
    if (!token) {
      return { user: null };
    }

    try {
      const payload = await jwt.verify(String(token));

      // type guard (WAJIB)
      if (!isAuthUser(payload)) {
        return { user: null };
      }

      return {
        user: payload as AuthUser,
      };
    } catch (err) {
      console.error('JWT verify error:', err);
      return { user: null };
    }
  })

  /**
   * Block request kalau tidak authenticated
   */
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return {
        success: false,
        message: 'Unauthorized Access',
      };
    }
  });
