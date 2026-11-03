// ============================================================
// authService.js — Registro, inicio de sesión y sesión actual.
// Reutiliza la API de Supabase Auth (JWT + hash de contraseñas),
// cumpliendo RF01, RF02 y RNF01.
// ============================================================
import { supabase } from './supabaseClient';
import { errorAmigable } from './errores';

export const authService = {
  /** RF01: Registrar un nuevo usuario (rol por defecto: paciente) */
  async registrar({ nombres, correo, password, rol = 'paciente' }) {
    if (rol !== 'paciente') throw new Error('Tipo de cuenta no permitido.');
    const { data, error } = await supabase.auth.signUp({
      email: correo,
      password,
      options: { data: { nombres, rol } }, // el trigger crea el perfil en public.usuarios
    });
    if (error) throw new Error(traducirError(error.message));
    return data.user;
  },

  /** RF02: Autenticación segura (Supabase valida y devuelve un JWT) */
  async iniciarSesion({ correo, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: correo,
      password,
    });
    if (error) throw new Error(traducirError(error.message));
    return data.user;
  },

  async solicitarRecuperacion(correo) {
    const redirectTo = new URL('/login?recuperar=1', window.location.origin).toString();
    const { error } = await supabase.auth.resetPasswordForEmail(correo, { redirectTo });
    if (error) throw new Error(traducirError(error.message));
  },

  async cambiarPassword(password) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(traducirError(error.message));
  },

  async cerrarSesion() {
    const { error } = await supabase.auth.signOut();
    if (error) throw errorAmigable(error);
  },

  /** Perfil del usuario autenticado (tabla usuarios) */
  async obtenerPerfil() {
    const { data: { user }, error: errorSesion } = await supabase.auth.getUser();
    if (errorSesion && errorSesion.name !== 'AuthSessionMissingError') throw errorSesion;
    if (!user) return null;
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_usuario', user.id)
      .single();
    if (error) throw errorAmigable(error);
    return data;
  },

  async actualizarPerfil(idUsuario, cambios) {
    const { data, error } = await supabase
      .from('usuarios')
      .update(cambios)
      .eq('id_usuario', idUsuario)
      .select()
      .single();
    if (error) throw errorAmigable(error);
    return data;
  },

  /** Escuchar cambios de sesión (login/logout) */
  onCambioDeSesion(callback) {
    return supabase.auth.onAuthStateChange((_evento, sesion) => callback(sesion));
  },
};

function traducirError(msg) {
  const mapa = {
    'Invalid login credentials': 'Correo o contraseña incorrectos.',
    'User already registered': 'El correo ya está registrado.',
    'Password should be at least 6 characters': 'La contraseña debe tener al menos 6 caracteres.',
    'Email not confirmed': 'Debes confirmar tu correo antes de iniciar sesión.',
    'New password should be different from the old password.': 'La nueva contraseña debe ser distinta de la anterior.',
    'Unable to validate email address: invalid format': 'Escribe un correo electrónico válido.',
  };
  if (mapa[msg]) return mapa[msg];
  if (/password should|weak password/i.test(msg)) return 'La contraseña no cumple los requisitos de seguridad. Usa al menos 6 caracteres.';
  if (/rate limit|too many requests/i.test(msg)) return 'Hiciste demasiados intentos. Espera unos minutos y vuelve a intentarlo.';
  if (/failed to fetch|network/i.test(msg)) return 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';
  // Mensajes no previstos de Supabase Auth (en inglés): se registran y se muestra uno genérico.
  console.error('[Supabase Auth]', msg);
  return 'No pudimos completar la operación. Inténtalo de nuevo.';
}
