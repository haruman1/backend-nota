// src/middlewares/authMiddleware.ts
import { Elysia } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { AuthUser } from '../types/jwt';

export const authMiddleware = new Elysia()
  .use(jwt({ secret: process.env.JWT_SECRET! }))
  .derive(async ({ jwt, request }) => {
    const auth = request.headers.get('authorization');

    if (!auth || !auth.startsWith('Bearer ')) throw new Error('UNAUTHORIZED');

    const token = auth.split(' ')[1];

    try {
      const payload = await jwt.verify(token);

      // Pastikan tidak pernah false
      const user = (payload || null) as AuthUser | null;

      return { user };
    } catch {
      return { user: null };
    }
  })
  .onBeforeHandle(({ user, set }) => {
    if (!user) {
      set.status = 401;
      return {
        success: false,
        message: 'Unauthorized Access',
      };
    }
  })
  .as('global');
