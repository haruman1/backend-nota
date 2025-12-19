import { Elysia, t } from 'elysia';
import { authMiddleware } from '../middlewares/authMiddleware';

import { query } from '../../mysql.config';
import PDFDocument from 'pdfkit';
import { generateUUID } from '../utils/uuid';
import { ensureAdmin } from '../helpers/ensureAdmin';
export const stockRoutes = new Elysia({ prefix: '/stocks' })
  .post(
    '/tambah',
    async ({ body, user }: any) => {
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }
      const userCheck = await ensureAdmin(user.id);
      if (!userCheck) {
        throw new Error('UNAUTHORIZED');
      }
      if (!body.nama_produk || !body.jumlah_produk || !body.harga_produk) {
        return { success: false, message: 'Ada isian yang kosong' };
      }
      const insertStock = await query(
        'INSERT INTO stock (id, nama_produk, jumlah_produk, harga_produk, user_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
        [
          generateUUID(),
          body.nama_produk,
          body.jumlah_produk,
          body.harga_produk,
          userCheck.id,
        ]
      );
      return {
        success: true,
        message: 'Stock berhasil ditambahkan',
        data: insertStock,
        timestamp: new Date(),
      };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
      body: t.Object({
        nama_produk: t.String(),
        jumlah_produk: t.Number(),
        harga_produk: t.Number(),
      }),
    }
  )
  .get(
    '/',
    async ({ user }) => {
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }

      const userCheck = await ensureAdmin(user.id);
      const Stocks = await query(
        'SELECT stock.id as Stock_ID, stock.nama_produk, stock.jumlah_produk, stock.harga_produk, user.name as Ditambahkan_oleh FROM stock LEFT JOIN user ON stock.user_id = user.id WHERE stock.user_id = ? AND stock.deleted_at IS NULL ORDER BY stock.created_at DESC',
        [userCheck.id]
      );
      if (Stocks.length === 0) {
        return { success: false, message: 'Tidak ada stock tersedia' };
      }
      if (!userCheck) {
        return { success: false, message: 'Unauthorized access' };
      }
      return {
        success: true,
        message: 'Daftar Stock',
        data: Stocks.map((stock: any) => ({
          Stock_ID: stock.Stock_ID,
          nama_produk: stock.nama_produk,
        })),
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
    '/:id',
    async ({ params, user }: any) => {
      const id = String(params.id).trim();
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }

      const userCheck = await ensureAdmin(user.id);
      if (!userCheck) {
        return { success: false, message: 'Unauthorized access' };
      }
      const Stock = await query(
        'SELECT stock.id as Stock_ID, stock.nama_produk, stock.jumlah_produk, stock.harga_produk, user.name as Ditambahkan_oleh FROM stock LEFT JOIN user ON stock.user_id = user.id WHERE stock.id = ? AND stock.user_id = ? LIMIT 1 ORDER BY stock.created_at DESC',

        [id, userCheck.id]
      );
      if (Stock.length === 0) {
        return { success: false, message: 'Stock tidak ditemukan' };
      }
      return {
        success: true,
        message: 'Stock ditemukan',
        data: Stock,
        timestamp: new Date(),
      };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
    }
  )
  .get('preview/:id', async ({ params, user, set }: any) => {
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }
    const rows = await query(
      'SELECT * FROM stock WHERE user_id = ? AND deleted_at IS NULL',
      [user.id]
    );

    // PDF header
    set.headers['Content-Type'] = 'application/pdf';

    const doc = new PDFDocument();

    // PDF CONTENT
    doc
      .fontSize(18)
      .text(`Laporan Stock oleh: ${rows[0].name}`, { underline: true });
    doc.moveDown();

    if (!rows.length) {
      doc.fontSize(14).text('Tidak ada data stock.', { align: 'left' });
    } else {
      rows.forEach(
        (
          item: {
            nama_produk: string;
            jumlah_produk: number;
            harga_produk: number;
            name: string;
          },
          index: number
        ) => {
          doc.fontSize(14).text(`${index + 1}. ${item.nama_produk}`);
          doc.text(`Jumlah        : ${item.jumlah_produk}`);
          doc.text(`Harga          : ${item.harga_produk}`);
          doc.text(`Ditambahkan oleh: ${item.name}`);
          doc.moveDown();
        }
      );
    }

    doc.end();
    return doc;
  })
  .patch(
    '/:id',
    async ({ params, body, user }: any) => {
      const id = String(params.id).trim();
      if (!user) {
        throw new Error('UNAUTHORIZED');
      }
      const userCheck = await query('SELECT id FROM user WHERE id = ?', [
        user.id,
      ]);
      if (userCheck.length === 0) {
        return { success: false, message: 'Unauthorized access' };
      }
      const stockCheck = await query(
        'SELECT id FROM stock WHERE id = ? AND user_id = ?',
        [id, userCheck[0].id]
      );
      if (stockCheck.length === 0) {
        return { success: false, message: 'Stock tidak ditemukan' };
      }
      const updateStock = await query(
        'UPDATE stock SET nama_produk = ?, jumlah_produk = ?, harga_produk = ?, updated_at = NOW() WHERE id = ? AND user_id = ?',
        [
          body.nama_produk,
          body.jumlah_produk,
          body.harga_produk,
          id,
          userCheck[0].id,
        ]
      );
      return {
        success: true,
        message: 'Stock berhasil diupdate',
        data: updateStock,
        timestamp: new Date(),
      };
    },
    {
      headers: t.Object({
        authorization: t.String(),
      }),
      body: t.Object({
        nama_produk: t.String(),
        jumlah_produk: t.Number(),
        harga_produk: t.Number(),
      }),
    }
  )
  .patch('/revive/:id', async ({ params, user }: any) => {
    if (!user) {
      throw new Error('UNAUTHORIZED');
    }
    const id = String(params.id).trim();
    const userCheck = await query('SELECT * FROM user WHERE id = ?', [user.id]);
    if (userCheck.length === 0) {
      return { success: false, message: 'Unauthorized access' };
    }
    const stockCheck = await query(
      'SELECT id FROM stock WHERE id = ? AND user_id = ?',
      [id, userCheck[0].id]
    );
    if (stockCheck[0].deleted_at === null) {
      return { success: false, message: 'Stock tidak dalam status terhapus' };
    }
    if (stockCheck.length === 0) {
      return { success: false, message: 'Stock tidak ditemukan' };
    }
    const updateStock = await query(
      'UPDATE stock SET deleted_at = NULL WHERE id = ? AND user_id = ?',
      [id, userCheck[0].id]
    );
    if (updateStock.affectedRows === 0) {
      return {
        success: false,
        message: 'Stock tidak ditemukan atau tidak bisa dihapus',
      };
    }
    return {
      success: true,
      message: 'Stock berhasil dipulihkan',
      data: {
        id,
      },
      timestamp: new Date(),
    };
  });
