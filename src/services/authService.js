// ============================================================
// authService.js — Registro, inicio de sesión y sesión actual.
// Reutiliza la API de Supabase Auth (JWT + hash de contraseñas),
// cumpliendo RF01, RF02 y RNF01.
// ============================================================
import { supabase } from './supabaseClient';

export const authService = {
  /** RF01: Registrar un nuevo usuario (rol por defecto: paciente) */
  async registrar({ nombres, correo, password, rol = 'paciente' }) {
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

  async cerrarSesion() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  /** Perfil del usuario autenticado (tabla usuarios) */
  async obtenerPerfil() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .eq('id_usuario', user.id)
      .single();
    if (error) return null;
    return data;
  },

  async actualizarPerfil(idUsuario, cambios) {
    const { data, error } = await supabase
      .from('usuarios')
      .update(cambios)
      .eq('id_usuario', idUsuario)
      .select()
      .single();
    if (error) throw new Error(error.message);
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
  };
  return mapa[msg] || msg;
}
