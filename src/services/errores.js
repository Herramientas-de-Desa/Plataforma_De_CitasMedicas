// errores.js — Convierte errores técnicos de Supabase en mensajes para el usuario.
// Los mensajes de nuestras funciones y triggers (código P0001) ya están en
// español y se muestran tal cual; el resto se traduce y el original va a la consola.

const POR_CODIGO = {
  '23505': 'Ese registro ya existe.',
  '23503': 'No se puede completar porque hay datos relacionados.',
  '23514': 'Algún dato no tiene un valor permitido. Revisa el formulario.',
  '42501': 'No tienes permiso para realizar esta acción.',
  PGRST116: 'No encontramos el registro solicitado.',
  PGRST301: 'Tu sesión expiró. Vuelve a iniciar sesión.',
  // Columna, tabla o función inexistente: falta aplicar una migración.
  '42703': 'La base de datos no está actualizada. Avisa al administrador.',
  '42P01': 'La base de datos no está actualizada. Avisa al administrador.',
  '42883': 'La base de datos no está actualizada. Avisa al administrador.',
  PGRST202: 'La base de datos no está actualizada. Avisa al administrador.',
  PGRST204: 'La base de datos no está actualizada. Avisa al administrador.',
};

export function errorAmigable(error) {
  if (!error) return new Error('Ocurrió un error inesperado. Inténtalo de nuevo.');
  if (error.code === 'P0001' && error.message) return new Error(error.message);
  const texto = String(error.message || '');
  let mensaje = POR_CODIGO[error.code];
  if (!mensaje && /failed to fetch|network|load failed/i.test(texto)) {
    mensaje = 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  } else if (!mensaje && /jwt expired/i.test(texto)) {
    mensaje = POR_CODIGO.PGRST301;
  } else if (!mensaje && /row-level security|permission denied/i.test(texto)) {
    mensaje = POR_CODIGO['42501'];
  }
  console.error('[Supabase]', error.code || '', texto, error);
  return new Error(mensaje || 'Ocurrió un error inesperado. Inténtalo de nuevo.');
}
