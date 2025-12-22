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
  updateLogoutTokens,
} from '../utils/RToken';
import { accessCookieOptions, refreshCookieOptions } from '../utils/cookies';
import {
  checkBruteforce,
  clearBruteforce,
  recordFailure,
} from '../utils/bruteforce';
import { detectSuspiciousLogin, saveLoginAudit } from '../utils/suspicious';
import { rateLimit } from '../utils/rateLimit';

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
    '/login',
    async ({ body, request, cookie, params }) => {
      const { email, password, redirect } = body;
      const ip = request.headers.get('x-forwarded-for') ?? 'unknown';
      const ua = request.headers.get('user-agent') ?? '';

      if (!rateLimit(ip)) {
        return new Response('Too many requests', { status: 429 });
      }

      if (!(await checkBruteforce(email, ip))) {
        return new Response('Blocked temporarily', { status: 429 });
      }

      const users = await query(
        'SELECT id, password FROM user WHERE email = ?',
        [email]
      );
      const user = users[0];

      if (!user || !(await comparePassword(password, user.password))) {
        await recordFailure(email, ip);
        return new Response('Unauthorized', { status: 401 });
      }

      await clearBruteforce(email, ip);

      const suspicious = await detectSuspiciousLogin(user.id, ip, ua);
      if (suspicious) {
        // bisa: kirim email / OTP / alert
        console.warn('⚠️ Suspicious login detected');
      }

      await saveLoginAudit(user.id, ip, ua);

      const refreshToken = randomUUID();
      await saveRefreshToken(
        user.id,
        refreshToken,
        new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      );

      console.log('Refresh Token saved:', refreshToken);
      cookie.refreshToken.set({
        value: refreshToken,
        ...refreshCookieOptions,
      });
      console.log(
        'Refresh Token cookie set with options:',
        refreshCookieOptions
      );
      return {
        success: true,
        redirect: redirect,
      };
    },
    {
      body: t.Object({
        email: t.String(),
        password: t.String(),
        redirect: t.String(),
      }),
    }
  )
  .get('/verify-token', async ({ request, jwt }) => {
    const token =
      request.headers.get('authorization')?.replace('Bearer ', '') ||
      new URL(request.url).searchParams.get('token');

    if (!token) {
      return Response.redirect('http://localhost:4321', 302);
    }

    const payload = await jwt.verify(token);
    if (!payload) {
      return Response.redirect('http://localhost:4321', 302);
    }

    return payload;
  })

  /* ================= REFRESH ================= */
  .post('/exchange', async ({ jwt, cookie }) => {
    const refreshToken = String(cookie.refreshToken?.value || '');
    console.log('Received refresh token from cookie:', refreshToken);
    if (!refreshToken) {
      return new Response('Unauthorized', { status: 401 });
    }

    const stored = await getRefreshToken(refreshToken);
    if (!stored || new Date() > stored.expires_at || stored.revoked) {
      return new Response('Unauthorized', { status: 401 });
    }

    const accessToken = await jwt.sign({
      sub: stored.user_id,
      role: stored.role,
    });
    cookie.accessToken.set({
      value: accessToken,
      ...accessCookieOptions,
    });
    console.log('Generated new access token for user:', accessToken);
    return {
      success: true,
      message: 'Refresh token diperbarui',
      accessToken,
    };
  })
  .post('/refresh', async ({ jwt, cookie }) => {
    const refreshToken = String(cookie.refreshToken?.value || '');
    if (!refreshToken) {
      return new Response('Unauthorized', { status: 401 });
    }

    const stored = await getRefreshToken(refreshToken);
    if (!stored || stored.revoked) {
      return new Response('Unauthorized', { status: 401 });
    }

    const newAccessToken = await jwt.sign({
      sub: stored.user_id,
      role: stored.role,
    });

    const newRefreshToken = randomUUID();
    const newExpiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);

    await rotateRefreshToken(refreshToken, newRefreshToken, newExpiresAt);

    cookie.refreshToken.set({
      value: newRefreshToken,
      ...refreshCookieOptions,
    });

    return { accessToken: newAccessToken };
  })
  .get('/verify', async ({ jwt, headers }) => {
    const auth = headers.authorization;
    if (!auth) {
      return new Response('Unauthorized', { status: 401 });
    }

    const token = auth.replace('Bearer ', '');
    const payload = await jwt.verify(token);

    if (!payload) {
      return new Response('Unauthorized', { status: 401 });
    }

    return payload;
  })
  /* ================= CHECK AUTH ================= */
  .get('/check', async ({ jwt, cookie, set }) => {
    const token = cookie.accessToken?.value;
    console.log('Cookie accessToken:', token);
    if (!token) {
      set.status = 401;
      return { message: 'Unauthenticated' };
    }

    try {
      const payload = await jwt.verify(String(token));
      return { success: true, user: payload };
    } catch {
      set.status = 401;
      return { message: 'Invalid token' };
    }
  })

  /* ================= LOGOUT ================= */
  .post('/logout', async ({ set, cookie }) => {
    const refreshToken = String(cookie.refreshToken?.value || '');
    if (refreshToken) {
      await updateLogoutTokens(refreshToken);
    }
    cookie.refreshToken.remove();

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
  })
  .onError(({ code, error }) => {
    if (code === 401) {
      return { success: false, message: 'Unauthorized Access' };
    }
    if (code === 'VALIDATION') {
      return {
        success: false,
        message: error.message ?? 'Invalid request',
      };
    }
  });
