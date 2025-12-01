import { Elysia, t } from 'elysia';

import { query } from '../../mysql.config';
import { authMiddleware } from '../middlewares/authMiddleware';
import { generateUUID } from '../utils/uuid';

export const movementStockRoutes = new Elysia({
  prefix: '/stocks/movement',
})
  .use(authMiddleware)
  .post(
    '/',
    async ({ body, user }) => {
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }
      const userCheck = await query('SELECT id FROM user WHERE id = ?', [
        user.id,
      ]);
      if (userCheck.length === 0) {
        throw new Error('UNAUTHORIZED');
      }
      if (
        !body.stock_id ||
        (!body.jumlah_masuk && body.jumlah_masuk !== 0) ||
        (!body.jumlah_keluar && body.jumlah_keluar !== 0)
      ) {
        return { success: false, message: 'Ada isian yang kosong' };
      }
      const insertMovement = await query(
        'INSERT INTO movement_stock (id, stock_id, jumlah_masuk, jumlah_keluar, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [
          generateUUID(),
          body.stock_id,
          body.jumlah_masuk,
          body.jumlah_keluar,
          userCheck[0].id,
        ]
      );
      return {
        success: true,
        message: 'Movement stock berhasil ditambahkan',
        data: [
          userCheck[0].id,
          body.stock_id,
          body.jumlah_masuk,
          body.jumlah_keluar,
        ],
        timestamp: new Date(),
      };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
      body: t.Object({
        stock_id: t.String(),
        jumlah_masuk: t.Number(),
        jumlah_keluar: t.Number(),
      }),
    }
  )
  .get(
    '/:id',
    async ({ user, params }) => {
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }
      const userCheck = await query('SELECT id FROM user WHERE id = ?', [
        user.id,
      ]);
      if (userCheck.length === 0) {
        throw new Error('UNAUTHORIZED');
      }
      const movementId = String(params.id).trim();
      const movementData = await query(
        'SELECT * FROM movement_stock WHERE id = ?',
        [movementId]
      );
      if (movementData.length === 0) {
        return { success: false, message: 'Movement stock not found' };
      }
      return {
        success: true,
        message: 'Movement stock found',
        data: movementData[0],
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
  )
  .get(
    '/',
    async ({ user }) => {
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }
      const userCheck = await query(
        'SELECT id FROM user WHERE id = ? AND deleted_at IS NULL',
        [user.id]
      );
      if (userCheck[0].role !== 'admin') {
        return { success: false, message: 'UNAUTHORIZED' };
      }
      if (userCheck.length === 0) {
        throw new Error('UNAUTHORIZED');
      }
      const movementData = await query(
        'SELECT * FROM movement_stock WHERE user_id = ?',
        [userCheck[0].id]
      );
      return {
        success: true,
        message: 'List of movement stocks',
        data: movementData,
        timestamp: new Date(),
      };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
    }
  )
  .get(
    '/stock/:stock_id',
    async ({ user, params }) => {
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }
      const userCheck = await query(
        'SELECT id FROM user WHERE id = ? AND deleted_at IS NULL',
        [user.id]
      );
      if (userCheck[0].role !== 'admin') {
        return { success: false, message: 'UNAUTHORIZED' };
      }
      if (userCheck.length === 0) {
        throw new Error('UNAUTHORIZED');
      }
      const stockId = String(params.stock_id).trim();
      const movementData = await query(
        'SELECT * FROM movement_stock WHERE stock_id = ?',
        [stockId]
      );
      return {
        success: true,
        message: 'List of movement stocks for the specified stock',
        data: movementData,
        timestamp: new Date(),
      };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
      params: t.Object({
        stock_id: t.String(),
      }),
    }
  )
  .patch(
    '/:id',
    async ({ user, params, body }) => {
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }
      const userCheck = await query('SELECT id FROM user WHERE id = ?', [
        user.id,
      ]);
      if (userCheck.length === 0) {
        throw new Error('UNAUTHORIZED');
      }
      if (userCheck[0].role !== 'admin') {
        return { success: false, message: 'UNAUTHORIZED' };
      }
      const movementId = String(params.id).trim();
      const movementData = await query(
        'SELECT * FROM movement_stock WHERE id = ? AND deleted_at IS NULL',
        [movementId]
      );
      if (movementData.length === 0) {
        return { success: false, message: 'Movement stock not found' };
      }
      const updateMovement = await query(
        'UPDATE movement_stock SET jumlah_masuk = ?, jumlah_keluar = ?, updated_at = NOW() WHERE id = ?',
        [body.jumlah_masuk, body.jumlah_keluar, movementId]
      );
      if (updateMovement.affectedRows === 0) {
        return { success: false, message: 'Movement stock not found' };
      }
      return {
        success: true,
        message: 'Movement stock updated',
        data: {
          ...movementData[0],
          jumlah_masuk: body.jumlah_masuk,
          jumlah_keluar: body.jumlah_keluar,
        },
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
      body: t.Object({
        jumlah_masuk: t.Number(),
        jumlah_keluar: t.Number(),
      }),
    }
  )
  .patch(
    '/delete/:id',
    async ({ user, params }) => {
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }
      const userCheck = await query('SELECT id FROM user WHERE id = ?', [
        user.id,
      ]);
      if (userCheck.length === 0) {
        throw new Error('UNAUTHORIZED');
      }
      if (userCheck[0].role !== 'admin') {
        return { success: false, message: 'UNAUTHORIZED' };
      }
      const movementId = String(params.id).trim();
      const movementData = await query(
        'SELECT * FROM movement_stock WHERE id = ?',
        [movementId]
      );
      if (movementData.length === 0) {
        return { success: false, message: 'Movement stock not found' };
      }
      const deleteMovement = await query(
        'UPDATE movement_stock SET deleted_at = NOW() WHERE id = ?',
        [movementId]
      );
      if (deleteMovement.affectedRows === 0) {
        return { success: false, message: 'Movement stock not found' };
      }
      return {
        success: true,
        message: 'Movement stock deleted',
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
