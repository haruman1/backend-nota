import { query } from '../../mysql.config';

type AdminUser = {
  id: number;
  role: 'admin' | 'user';
};

export const ensureAdmin = async (email: string): Promise<AdminUser> => {
  const user = await query<AdminUser>(
    'SELECT id, role FROM `user` WHERE email = ? AND deleted_at IS NULL LIMIT 1',
    [email]
  );

  if (!user) {
    throw new Error('User tidak ditemukan');
  }

  if (user.role !== 'admin') {
    throw new Error('Akses ditolak: bukan admin');
  }

  return user;
};
export default ensureAdmin;