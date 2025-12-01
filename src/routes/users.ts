import { Elysia, t } from 'elysia';
import { authMiddleware } from '../middlewares/authMiddleware';

import { hashPassword, comparePassword } from '../utils/password';
import { query } from '../../mysql.config';

export const userRoutes = new Elysia({ prefix: '/users' })
  .use(authMiddleware)
  .get(
    '/:id',
    async ({ user, params }) => {
      const id = String(params.id).trim();

      if (!user || (user.id !== params.id && user.role !== 'admin')) {
        return { success: false, message: 'Anda bukan admin' };
      }
      const terdaftar = await query(
        'SELECT id, name, email FROM user WHERE id = ?',
        [id]
      );
      const daftar = terdaftar[0];
      if (!daftar) {
        return { success: false, message: 'Unauthorized access' };
      }
      return {
        success: true,
        message: 'Ini adalah user yang anda cari',
        data: daftar,
      };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
      body: t.Object({
        userId: t.String(),
      }),
    }
  )
  .get(
    '/profile/:id',
    ({ user, params }) => {
      const id = String(params.id).trim();
      if (!user) {
        return { success: false, message: 'Unauthorized access' };
      }
      if (user.id !== id) {
        return { success: false, message: 'Unauthorized access' };
      }

      return {
        success: true,
        message: 'Data profil pengguna',
        data: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
    }
  )
  .patch(
    'profile/:id',
    async ({ user, params, body }) => {
      const id = String(params.id).trim();
      const email = body.email?.trim();
      if (!user) {
        return { success: false, message: 'Unauthorized access' };
      }
      if (user.id !== id) {
        return { success: false, message: 'Unauthorized access' };
      }
      // Cek email sudah dipakai
      if (email && email !== user.email) {
        const emailTaken = await query(
          'SELECT id FROM user WHERE email = ? LIMIT 1',
          [email]
        );
        if (emailTaken.length > 0) {
          return {
            success: false,
            message: 'Email sudah digunakan, gunakan email lain',
          };
        }
      }
      // Only allowed fields
      const allowedUpdates = ['email', 'name'];
      const updates: any = {};
      for (const field of allowedUpdates) {
        if (body[field as keyof typeof body] !== undefined) {
          updates[field] = body[field as keyof typeof body];
        }
      }

      const setClause = Object.keys(updates)
        .map((key) => `${key} = ?`)
        .join(', ');
      const values = Object.values(updates);

      await query(`UPDATE user SET ${setClause} WHERE id = ?`, [...values, id]);
      return { success: true, message: 'Profile berhasil diupdate' };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
      body: t.Object({
        email: t.Optional(t.String()),
        name: t.Optional(t.String()),
      }),
    }
  )
  .patch(
    '/change-password/:id',
    async ({ user, params, body }) => {
      const id = String(params.id).trim();
      const passwordOld = String(body.oldPassword).trim();
      const passwordNew = String(body.newPassword).trim();
      const regextPassword =
        /^(?=.{8,20}$)(?=.*\p{L})(?=.*\p{N})(?!.*\p{Emoji}).+$/u;

      if (!regextPassword.test(passwordNew)) {
        return {
          success: false,
          message:
            'Password harus minimal 8 karakter, mengandung huruf dan angka',
        };
      }
      if (!user) {
        return { success: false, message: 'Unauthorized access' };
      }
      if (user.id !== id) {
        return { success: false, message: 'Unauthorized access' };
      }
      const existingUserResult = await query(
        'SELECT password FROM user WHERE id = ?',
        [id]
      );
      if (existingUserResult.length === 0) {
        return { success: false, message: 'Pengguna tidak ditemukan' };
      }
      const existingUser = existingUserResult[0];

      const match = await comparePassword(passwordOld, existingUser.password);
      if (!match) {
        return { success: false, message: 'Password lama salah' };
      }

      const hashed = await hashPassword(passwordNew);
      await query('UPDATE user SET password = ? WHERE id = ? LIMIT 1', [
        hashed,
        id,
      ]);
      return { success: true, message: 'Password berhasil diubah' };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
      body: t.Object({
        oldPassword: t.String(),
        newPassword: t.String(),
      }),
    }
  )
  .patch(
    '/change-role/:id',
    async ({ user, body, params }) => {
      if (!user || user.role !== 'admin') {
        return { success: false, message: 'Anda bukan admin' };
      }
      const userId = String(params.id).trim();
      const role = String(body.role).trim();
      const existingUserResult = await query(
        'SELECT role FROM user WHERE id = ? LIMIT 1',
        [userId]
      );
      if (existingUserResult.length === 0) {
        return { success: false, message: 'Pengguna tidak ditemukan' };
      }
      const existingUser = existingUserResult[0];
      if (existingUser.role === 'admin') {
        return { success: false, message: 'Tidak bisa merubah role admin' };
      }
      await query('UPDATE user SET role = ? WHERE id = ?', [role, userId]);
      return { success: true, message: 'Role berhasil diubah' };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
      body: t.Object({
        role: t.String(),
      }),
    }
  )
  .delete(
    '/delete-account/:id',
    async ({ user, params }) => {
      const targetId = String(params.id).trim();
      if (!user || user.role !== 'admin') {
        return { success: false, message: 'Anda bukan admin' };
      }
      const existingUserResult = await query(
        'SELECT name, email, role FROM user WHERE id = ? LIMIT 1',
        [targetId]
      );
      if (existingUserResult.length === 0) {
        return { success: false, message: 'Pengguna tidak ditemukan' };
      }
      if (!user || user.id === targetId) {
        return {
          success: false,
          message: 'Admin tidak boleh menghapus diri sendiri',
        };
      }
      const existingUser = existingUserResult[0];
      if (existingUser.role === 'admin') {
        return {
          success: false,
          message: 'Tidak bisa menghapus admin',
          timestamp: new Date(),
        };
      }
      await query('DELETE FROM user WHERE id = ?', [targetId]);
      return {
        success: true,
        message: 'Akun berhasil dihapus',
        timestamp: new Date(),
      };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
      params: t.Object({
        id: t.String(),
      }),
    }
  );
