import { Elysia } from 'elysia';
import { exec } from 'child_process';
import fs from 'fs';

export const backupRoutes = new Elysia().get(
  '/backup/run',
  async ({ query }) => {
    const filename = `/tmp/db_${Date.now()}.sql`;

    await new Promise((resolve, reject) => {
      exec(
        `mysqldump -h ${process.env.DB_HOST} -P ${process.env.DB_PORT} -u ${process.env.DB_USERNAME} -p${process.env.DB_PASSWORD} ${process.env.DB_DATABASE} > ${filename}`,
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });

    const fileBuffer = fs.readFileSync(filename);

    return {
      success: true,
      message: 'Backup berhasil',
    };
  }
);
