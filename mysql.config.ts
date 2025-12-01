import serverlessMysql from 'serverless-mysql';
import dotenv from 'dotenv';

dotenv.config();

// Flag apakah sedang jalan di Vercel (serverless)

// Membuat instance serverless-mysql
const Mysql = serverlessMysql({
  config: {
    host: process.env.DB_HOST,
    database: process.env.DB_DATABASE,
    user: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD || '',
    port: parseInt(process.env.DB_PORT || '3306'),
    connectionLimit: 1,
  },
  returnFinalSqlQuery: true,
});

// Helper untuk query
export async function query<T = any>(sql: string, values: any[] = []) {
  try {
    // open connection
    await Mysql.connect();

    // execute query
    const results = await Mysql.query<T>(sql, values);

    return results;
  } catch (err) {
    console.error('MySQL ERROR:', err);
    throw err;
  } finally {
    // wajib close connection kalau serverless (Vercel)
    await Mysql.end();
  }
}

// Export instance untuk kasus advanced
export default Mysql;
