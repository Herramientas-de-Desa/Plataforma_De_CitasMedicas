// ============================================================
// especialidadesService.js — CRUD del catálogo de especialidades
// (reutiliza la API REST de Supabase vía supabaseClient).
// ============================================================
import { supabase } from './supabaseClient';

export const especialidadesService = {
  async listar() {
    const { data, error } = await supabase
      .from('especialidades')
      .select('*')
      .order('nombre');
    if (error) throw new Error(error.message);
    return data;
  },

  async crear(nombre) {
    const { data, error } = await supabase
      .from('especialidades')
      .insert({ nombre })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async eliminar(id) {
    const { error } = await supabase
      .from('especialidades')
      .delete()
      .eq('id_especialidad', id);
    if (error) throw new Error(error.message);
  },
};
