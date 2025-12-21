import { query } from '../../mysql.config';

const MAX = 5;
const BLOCK_MINUTES = 15;

export async function checkBruteforce(email: string, ip: string) {
  const rows = await query(
    'SELECT * FROM login_attempts WHERE email = ? AND ip = ?',
    [email, ip]
  );

  if (!rows.length) return true;

  const row = rows[0];
  if (row.blocked_until && new Date() < row.blocked_until) return false;

  return true;
}

export async function recordFailure(email: string, ip: string) {
  const now = new Date();

  const rows = await query(
    'SELECT * FROM login_attempts WHERE email = ? AND ip = ?',
    [email, ip]
  );

  if (!rows.length) {
    await query(
      'INSERT INTO login_attempts (email, ip, attempts, blocked_until) VALUES (?, ?, 1, ?)',
      [email, ip, now]
    );
    return;
  }

  const attempts = rows[0].attempts + 1;

  if (attempts >= MAX) {
    const blocked = new Date(now.getTime() + BLOCK_MINUTES * 60_000);
    await query(
      'UPDATE login_attempts SET attempts=?, blocked_until=? WHERE id=?',
      [attempts, blocked, rows[0].id]
    );
    return;
  }

  await query(
    'UPDATE login_attempts SET attempts=?, blocked_until=? WHERE id=?',
    [attempts, now, rows[0].id]
  );
}

export async function clearBruteforce(email: string, ip: string) {
  await query('DELETE FROM login_attempts WHERE email = ? AND ip = ?', [
    email,
    ip,
  ]);
}
