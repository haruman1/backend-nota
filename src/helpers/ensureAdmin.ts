import { query } from '../../mysql.config';

export const ensureAdmin = async (userId: number | string) => {
  const rows = await query(
    'SELECT id, role FROM user WHERE id = ? AND deleted_at IS NULL',
    [userId]
  );

  if (rows.length === 0) throw new Error('UNAUTHORIZED');
  if (rows[0].role !== 'admin') throw new Error('UNAUTHORIZED');

  return rows[0];
};
