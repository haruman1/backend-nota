import { query } from '../../mysql.config';

export async function detectSuspiciousLogin(
  userId: string,
  ip: string,
  userAgent: string
) {
  const last = await query(
    `SELECT ip, user_agent 
     FROM suspicious_logins 
     WHERE user_id = ? 
     ORDER BY created_at DESC 
     LIMIT 1`,
    [userId]
  );

  if (!last.length) return false;

  if (last[0].ip !== ip || last[0].user_agent !== userAgent) {
    return true;
  }

  return false;
}

export async function saveLoginAudit(
  userId: string,
  ip: string,
  userAgent: string
) {
  await query(
    'INSERT INTO suspicious_logins (user_id, ip, user_agent) VALUES (?, ?, ?)',
    [userId, ip, userAgent]
  );
}
