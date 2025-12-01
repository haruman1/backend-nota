import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { authRoutes } from '../src/routes/auth';
import { userRoutes } from '../src/routes/users';
import openapi from '@elysiajs/openapi';
import { stockRoutes } from '../src/routes/stock';
import { cors } from '@elysiajs/cors';
import { movementStockRoutes } from '../src/routes/movementStock';
import { backupRoutes } from '../src/routes/backup';

const app = new Elysia()
  .use(
    jwt({
      name: 'jwt',
      secret: process.env.JWT_SECRET!,
      exp: '2h',
    })
  )
  .guard({
    headers: t.Object({
      authorization: t.Optional(t.String()),
    }),
  })
  .onError(({ code, error }) => {
    if (code === 401) {
      return { success: false, message: 'Unauthorized Access' };
    }
    if (code === 'NOT_FOUND') {
      return { success: false, message: 'Unauthorized Access' };
    }
  })
  .get('/', () => 'Hello Elysia')
  .use(
    cors({
      origin: ['*'],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )
  .use(openapi())
  .use(authRoutes)
  .use(userRoutes)
  .use(stockRoutes)
  .use(movementStockRoutes)
  .use(backupRoutes);

// ❗ Vercel tidak boleh pakai .listen(), jadi hilangkan
// .listen(parseInt(process.env.PORT!));

// Vercel akan menjalankan ini sebagai handler
export default app;
