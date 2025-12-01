// src/plugins/jwt.ts
import { jwt } from '@elysiajs/jwt';

export const jwtPlugin = jwt({
  name: 'jwt',
  secret: process.env.JWT_SECRET!,
  exp: '2h',
});
