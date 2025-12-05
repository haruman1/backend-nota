import { query } from '../../mysql.config';

export async function saveRefreshToken(
  userId: string,
  token: string,
  expiresAt: Date
) {
  await query(
    'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES (?, ?, ?)  ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)',
    [userId, token, expiresAt]
  );
}

export async function getRefreshToken(token: string) {
  const rows = await query(
    `SELECT * FROM refresh_tokens WHERE token = ? LIMIT 1`,
    [token]
  );
  return rows[0] || null;
}
export async function deleteRefreshToken(token: string) {
  await query(`DELETE FROM refresh_tokens WHERE token = ?`, [token]);
}
export async function deleteRefreshTokenByUser(userId: string) {
  await query(`DELETE FROM refresh_tokens WHERE user_id = ?`, [userId]);
}
export async function rotateRefreshToken(
  oldToken: string,
  newToken: string,
  newExpiresAt: Date
) {
  await query(
    `UPDATE refresh_tokens
     SET token = ?, expires_at = ?
     WHERE token = ?`,
    [newToken, newExpiresAt, oldToken]
  );
}
