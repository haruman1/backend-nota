import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { cors } from '@elysiajs/cors';
import openapi from '@elysiajs/openapi';

import { authRoutes } from '../src/routes/auth';
import { userRoutes } from '../src/routes/users';
import { stockRoutes } from '../src/routes/stock';
import { movementStockRoutes } from './routes/movementStock';
import { backupRoutes } from './routes/backup';
import { gphRoutes } from './routes/gph';

const app = new Elysia()

  /* 🔥 CORS HARUS PALING ATAS */
  .use(
    cors({
      origin: ['http://localhost:4321'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    })
  )

  /* JWT plugin OK */
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET!,
      exp: '2h',
    })
  )
  .onError(({ code }) => {
    if (code === 401) {
      return { success: false, message: 'Unauthorized Access 3' };
    }
    if (code === 'NOT_FOUND') {
      return { success: false, message: 'Not Found' };
    }
  })

  .get('/', () => 'Hello Elysia')

  .use(openapi())
  .use(authRoutes)
  .use(userRoutes)

  .use(backupRoutes)
  .use(gphRoutes);

export default app;
