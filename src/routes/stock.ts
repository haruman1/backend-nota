import { Elysia, t } from 'elysia';
import { query } from '../../mysql.config';
import { authMiddleware } from '../middlewares/authMiddleware';
import { isAuthUser } from '../utils/isAuthUser';
import { accessCookieOptions } from '../utils/cookies';

export const stockRoutes = new Elysia({ prefix: '/stock' })
  .use(authMiddleware)
  /* ================= GET ALL STOCKS ================= */
  .get('/all', async ({ jwt }) => {
    const stocks = await query('SELECT * FROM stock');
    return { success: true, data: stocks };
  })
  .get('/detail/:id', async ({ params, jwt }) => {
    const stocks = await query('SELECT * FROM stock WHERE id = ?', [params.id]);
    return { success: true, data: stocks };
  });
