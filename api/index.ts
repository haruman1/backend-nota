import { Elysia, t } from 'elysia';
import { jwt } from '@elysiajs/jwt';
import { authRoutes } from '../src/routes/auth';
import openapi from '@elysiajs/openapi';
import { cors } from '@elysiajs/cors';
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
      return { success: false, message: 'Unauthorized Access 1' };
    }
    if (code === 'NOT_FOUND') {
      return { success: false, message: 'Unauthorized Access 2' };
    }
  })
  .get('/', () => 'Hello Elysia')
  .use(
    cors({
      origin: [
        'http://localhost:4321',
        'http://localhost:4322',
        'https://accounts.haruman.me',
        'https://dashboard.haruman.me',
        'https://timker4.haruman.me',
      ],
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )
  .use(openapi())
  .use(authRoutes)
  .use(backupRoutes);

// ❗ Vercel tidak boleh pakai .listen(), jadi hilangkan
// .listen(parseInt(process.env.PORT!));

// Vercel akan menjalankan ini sebagai handler
export default app;
