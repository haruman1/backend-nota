import { Elysia, t } from 'elysia';
import { query } from '../../mysql.config';

export const gphRoutes = new Elysia({ prefix: '/gph' })
  // webhook endpoint
  .post(
    '/webhook/google-sheet',
    async ({ body, headers, set }) => {
      // 🔐 Optional API Key
      const apiKey = headers['x-api-key'];
      if (apiKey !== process.env.WEBHOOK_KEY) {
        set.status = 401;
        return { message: 'Unauthorized' };
      }
      const { name, email, phone, message } = body;

      if (!name || !email || !phone || !message) {
        set.status = 422;
        return { message: 'Name, email, phone, and message are required' };
      }

      try {
        await query(
          `INSERT INTO leads (name, email, phone, message)
         VALUES (?, ?, ?, ?)`,
          [name, email, phone, message]
        );
        set.status = 200;
        return { message: 'Success' };
      } catch (error) {
        set.status = 500;
        return { message: 'Sedang Gangguan, silahkan menunggu', error };
      }
    },
    {
      body: t.Object({
        name: t.String(),
        email: t.String({ format: 'email' }),
        phone: t.Optional(t.String()),
        message: t.Optional(t.String()),
      }),
    }
  );
