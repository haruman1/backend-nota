import { Elysia } from 'elysia';

export const errorHandler = (app: Elysia) =>
  app.onError(({ code, error, set }) => {
    if (code === 'VALIDATION') {
      set.status = 422;

      // Ambil error message singkat
      let msg =
        error.all?.[0]?.message || error.message || 'Input tidak valid.';

      // Format biar enak dibaca
      msg = msg.replace('Expected string', 'wajib diisi');
      msg = msg.replace('Expected object', 'Input tidak boleh kosong');

      return {
        success: false,
        message: msg,
      };
    }

    set.status = 500;
    return {
      success: false,
      message: 'Terjadi kesalahan pada server.',
    };
  });
