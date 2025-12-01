import { Elysia } from 'elysia';
import { exec } from 'child_process';
import fs from 'fs';

export const backupRoutes = new Elysia().get(
  '/backup/run',
  async ({ query }) => {
    if (query.token !== process.env.BACKUP_TOKEN) {
      return { success: false, message: 'UNAUTHORIZED' };
    }
    const filename = `/tmp/db_${Date.now()}.sql`;

    await new Promise((resolve, reject) => {
      exec(
        `mysqldump -h ${process.env.DB_HOST} -u ${process.env.DB_USER} -p${process.env.DB_PASS} ${process.env.DB_NAME} > ${filename}`,
        (err) => {
          if (err) reject(err);
          else resolve(true);
        }
      );
    });

    const fileBuffer = fs.readFileSync(filename);

    // TODO: Upload ke S3 atau Supabase Storage
    // contoh: await supabase.storage.from('backup').upload(...)

    return {
      success: true,
      message: 'Backup berhasil',
    };
  }
);
