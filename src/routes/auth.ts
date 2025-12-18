import { Elysia, t } from 'elysia';
import { hashPassword, comparePassword } from '../utils/password';
import { query } from '../../mysql.config';
import { jwtPlugin } from '../utils/jwt';
import { generateUUID } from '../utils/uuid';
<<<<<<< Updated upstream
=======
import { randomUUID } from 'crypto';
import {
  getRefreshToken,
  rotateRefreshToken,
  saveRefreshToken,
} from '../utils/RToken';
import { accessCookieOptions, refreshCookieOptions } from '../utils/cookies';

>>>>>>> Stashed changes
export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)

  /* ================= REGISTER ================= */
  .post(
    '/register',
    async ({ body }) => {
      const { name, email, password } = body;

      const exists = await query('SELECT id FROM user WHERE email = ?', [
        email,
      ]);

      if (exists.length > 0) {
        return { success: false, message: 'Email sudah terdaftar' };
      }

      const hashed = await hashPassword(password);

      await query(
        'INSERT INTO user (id, name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, "user", NOW(), NOW())',
        [generateUUID(), name, email, hashed]
      );

      return { success: true, message: 'Registrasi berhasil' };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )

  /* ================= LOGIN ================= */
  .post(
<<<<<<< Updated upstream
    '/sign-in',
    async ({ body, jwt }) => {
=======
    '/login',
    async ({ body, jwt, set }) => {
>>>>>>> Stashed changes
      const { email, password } = body;

      const users = await query(
        'SELECT id, email, password, role FROM user WHERE email = ?',
        [email]
      );

      const user = users[0];
      if (!user) {
        set.status = 401;
        return { message: 'Email tidak ditemukan' };
      }

      const match = await comparePassword(password, user.password);
      if (!match) {
        set.status = 401;
        return { message: 'Password salah' };
      }

<<<<<<< Updated upstream
      const token = await jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
      });

      return {
        success: true,
        message: 'Login berhasil',
        token,
        timestamp: new Date(),
=======
      // Access Token (short-lived)
      const accessToken = await jwt.sign({
        id: user.id,
        role: user.role,
      });

      // Refresh Token (long-lived)
      const refreshToken = randomUUID();
      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

      await saveRefreshToken(user.id, refreshToken, expiresAt);

      // 🔐 SET COOKIE
      set.cookie!.accessToken = {
        value: accessToken,
        ...accessCookieOptions,
>>>>>>> Stashed changes
      };

      set.cookie!.refreshToken = {
        value: refreshToken,
        ...refreshCookieOptions,
      };

      return { success: true, message: 'Login berhasil' };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )

<<<<<<< Updated upstream
  // 🔥 FIX BAGIAN INI!
  .get('/check', async ({ jwt, request, set }) => {
    const auth = request.headers.get('authorization');

    if (!auth) {
=======
  /* ================= REFRESH ================= */
  .post('/refresh', async ({ jwt, cookie, set }) => {
    const refreshToken = String(cookie.refreshToken?.value || '');

    if (!refreshToken) {
>>>>>>> Stashed changes
      set.status = 401;
      return { message: 'No refresh token' };
    }

    const stored = await getRefreshToken(refreshToken);
    if (!stored || new Date() > stored.expires_at) {
      set.status = 401;
      return { message: 'Invalid refresh token' };
    }

    const newAccessToken = await jwt.sign({
      id: stored.user_id,
    });

    const newRefreshToken = randomUUID();
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    if (!refreshToken) {
      set.status = 401;
      return { message: 'Invalid refresh token' };
    }
    await rotateRefreshToken(refreshToken, newRefreshToken, newExpiresAt);

    set.cookie!.accessToken = {
      value: newAccessToken,
      ...accessCookieOptions,
    };

    set.cookie!.refreshToken = {
      value: newRefreshToken,
      ...refreshCookieOptions,
    };

    return { success: true };
  })

  /* ================= CHECK AUTH ================= */
  .get('/check', async ({ jwt, cookie, set }) => {
    const token = cookie.accessToken?.value;

    if (!token) {
      set.status = 401;
      return { message: 'Unauthenticated' };
    }

    try {
<<<<<<< Updated upstream
      const payload = await jwt.verify(token);
      return { ok: true, user: payload };
=======
      const payload = await jwt.verify(String(token));
      return { success: true, user: payload };
>>>>>>> Stashed changes
    } catch {
      set.status = 401;
      return { message: 'Invalid token' };
    }
  })

  /* ================= LOGOUT ================= */
  .post('/logout', async ({ set }) => {
    set.cookie!.accessToken = {
      value: '',
      path: '/',
      maxAge: 0,
    };

    set.cookie!.refreshToken = {
      value: '',
      path: '/auth/refresh',
      maxAge: 0,
    };

    return { success: true, message: 'Logout berhasil' };
  });
