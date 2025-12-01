// src/types/jwt.d.ts
export interface AuthUser {
  id: string;
  email: string;
  role: 'admin' | 'user';
}

// Extend Elysia context
declare module 'elysia' {
  interface Context {
    user: AuthUser | null;
  }
}
