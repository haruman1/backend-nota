// src/middlewares/authMiddleware.ts
import { Elysia } from 'elysia';
import { isAuthUser } from '../utils/isAuthUser';
export const authMiddleware = new Elysia()

  /**
   * Ambil user dari HttpOnly Cookie
   */
  .derive(async ({ jwt, cookie }) => {
    const token = cookie.accessToken?.value;
    if (!token) return { user: null };
    console.log('COOKIE:', cookie);
    try {
      const payload = await jwt.verify(String(token));

      if (!isAuthUser(payload)) return { user: null };

      return { user: payload };
    } catch (error) {
      console.error(error);
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
        message: 'Unauthorized Access 4',
      };
    }
  });
