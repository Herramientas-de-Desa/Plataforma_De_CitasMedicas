// ============================================================
// especialidadesService.js — CRUD del catálogo de especialidades
// (reutiliza la API REST de Supabase vía supabaseClient).
// ============================================================
import { supabase } from './supabaseClient';
import { errorAmigable } from './errores';

export const especialidadesService = {
  async listar() {
    const { data, error } = await supabase
      .from('especialidades')
      .select('*')
      .order('nombre');
    if (error) throw errorAmigable(error);
    return data;
  },

  async crear(nombre) {
    const { data, error } = await supabase
      .from('especialidades')
      .insert({ nombre })
      .select()
      .single();
    if (error) throw errorAmigable(error);
    return data;
  },

  async eliminar(id) {
    const { error } = await supabase
      .from('especialidades')
      .delete()
      .eq('id_especialidad', id);
    if (error) throw errorAmigable(error);
  },
};
