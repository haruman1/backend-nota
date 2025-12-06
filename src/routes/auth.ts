import { Elysia, t } from 'elysia';
import { hashPassword, comparePassword } from '../utils/password';
import { query } from '../../mysql.config';
import { jwtPlugin } from '../utils/jwt';
import { generateUUID } from '../utils/uuid';
import { randomUUID } from 'crypto';
import {
  getRefreshToken,
  rotateRefreshToken,
  saveRefreshToken,
} from '../utils/RToken';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwtPlugin)

  .post(
    '/register',
    async ({ body }) => {
      const { name, email, password } = body;
      if (!name || !email || !password) {
        throw new Error('UNAUTHORIZED');
      }

      const existingUser = await query(
        'SELECT email FROM user WHERE email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        return { success: false, message: 'Email sudah terdaftar' };
      }

      const hashed = await hashPassword(password);

      const user = await query(
        'INSERT INTO user (id, name, email, password, role, created_at, updated_at) VALUES (?, ?, ?, ?, "user", NOW(), NOW())',
        [generateUUID(), name, email, hashed]
      );

      return {
        success: true,
        message: 'Registrasi berhasil, silakan login',
        data: user,
        timestamp: new Date(),
      };
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
        password: t.String(),
      }),
    }
  )

  .post(
    '/login',
    async ({ body, jwt }) => {
      const { email, password } = body;

      if (!email || !password) {
        return { success: false, message: 'Ada isian yang kosong' };
      }

      const users = await query(
        'SELECT id, email, password, role FROM user WHERE email = ?',
        [email]
      );

      const user = users[0];
      if (!user) {
        return { success: false, message: 'Email tidak ditemukan' };
      }

      const match = await comparePassword(password, user.password);
      if (!match) {
        return { success: false, message: 'Password salah' };
      }

      const accessToken = await jwt.sign({
        id: user.id,
        email: user.email,
      });
      const refreshToken = crypto.randomUUID();

      const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30); // 30 hari
      await saveRefreshToken(user.id, refreshToken, expiresAt);
      return {
        success: true,
        message: 'Login berhasil',
        accessToken,
        refreshToken,
        timestamp: new Date(),
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
      }),
    }
  )
  .post(
    '/refresh',
    async ({ body, jwt }) => {
      const { refreshToken } = body;

      const stored = await getRefreshToken(refreshToken);
      if (!stored) return { success: false, message: 'Invalid refresh token' };

      if (new Date() > stored.expires_at) {
        return { success: false, message: 'Refresh expired' };
      }

      // Generate new accessToken
      const accessToken = await jwt.sign({
        userId: stored.user_id,
        exp: Math.floor(Date.now() / 1000) + 60 * 5,
      });

      // Rotate refresh token (best practice)
      const newRefresh = crypto.randomUUID();
      const newExpiresAt = new Date(Date.now() + 86400 * 1000 * 30);

      await rotateRefreshToken(refreshToken, newRefresh, newExpiresAt);

      return {
        success: true,
        accessToken,
        refreshToken: newRefresh,
      };
    },
    {
      body: t.Object({
        refreshToken: t.String(),
      }),
    }
  )
  // 🔥 FIX BAGIAN INI!
  .get('/check', async ({ jwt, request, set }) => {
    const auth = request.headers.get('authorization');

    if (!auth) {
      set.status = 401;
      return { message: 'Missing Authorization header' };
    }

    const token = auth.replace('Bearer ', '');

    try {
      const payload = await jwt.verify(token);
      return { success: true, user: payload };
    } catch {
      set.status = 401;
      return { message: 'Invalid token' };
    }
  })

  .post('/logout', () => {
    return {
      success: true,
      message: 'Logout berhasil',
    };
  });
