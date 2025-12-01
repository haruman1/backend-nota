import { Elysia } from 'elysia';

export const adminOnly = new Elysia().onBeforeHandle(({ user, set }) => {
  if (user.role !== 'admin') {
    set.status = 403;
    return {
      success: false,
      message: 'Akses ditolak. Kamu tidak memiliki akses untuk kesini',
    };
  }
});
