// ============================================================
// medicosService.js — Búsqueda y gestión de médicos (RF03, RF04, RF08).
// ============================================================
import { supabase } from './supabaseClient';

// Selección reutilizable con relaciones (especialidad y clínica)
const SELECT_MEDICO = `
  id_medico, nombre, telefono, disponible,
  especialidad:especialidades ( id_especialidad, nombre ),
  clinica:clinicas ( id_clinica, nombre, direccion, latitud, longitud )
`;

export const medicosService = {
  /** RF03: Buscar médicos, con filtro opcional por especialidad y texto */
  async buscar({ especialidadId = null, texto = '' } = {}) {
    let consulta = supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .eq('disponible', true)
      .order('nombre');
    if (especialidadId) consulta = consulta.eq('especialidad_id', especialidadId);
    if (texto.trim()) consulta = consulta.ilike('nombre', `%${texto.trim()}%`);
    const { data, error } = await consulta;
    if (error) throw new Error(error.message);
    return data;
  },

  async obtenerPorId(idMedico) {
    const { data, error } = await supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .eq('id_medico', idMedico)
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  /** RF04: Horarios semanales de atención de un médico */
  async obtenerHorarios(idMedico) {
    const { data, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('medico_id', idMedico)
      .order('dia_semana')
      .order('hora_inicio');
    if (error) throw new Error(error.message);
    return data;
  },

  // ---------- Gestión (RF08, panel administrador) ----------
  async listarTodos() {
    const { data, error } = await supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .order('id_medico');
    if (error) throw new Error(error.message);
    return data;
  },

  async crear({ nombre, telefono, especialidad_id, clinica_id }) {
    const { data, error } = await supabase
      .from('medicos')
      .insert({ nombre, telefono, especialidad_id, clinica_id })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  async cambiarDisponibilidad(idMedico, disponible) {
    const { error } = await supabase
      .from('medicos')
      .update({ disponible })
      .eq('id_medico', idMedico);
    if (error) throw new Error(error.message);
  },

  async eliminar(idMedico) {
    const { error } = await supabase
      .from('medicos')
      .delete()
      .eq('id_medico', idMedico);
    if (error) throw new Error(error.message);
  },
};
