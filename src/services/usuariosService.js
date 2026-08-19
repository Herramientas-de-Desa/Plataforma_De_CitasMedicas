// ============================================================
// usuariosService.js — Gestión de usuarios (RF08, administrador).
// ============================================================
import { supabase } from './supabaseClient';

export const usuariosService = {
  async listar() {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*')
      .order('creado_en', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  async cambiarRol(idUsuario, rol) {
    const { error } = await supabase
      .from('usuarios')
      .update({ rol })
      .eq('id_usuario', idUsuario);
    if (error) throw new Error(error.message);
  },
};
