import { validarHorarios } from './horariosValidacion';
// ============================================================
// medicosService.js — Búsqueda y gestión de médicos
// (RF03, RF04, RF08 + imágenes)
// ============================================================

import { supabase } from './supabaseClient';
import { uploadDoctorImage } from './cloudinaryService';

// Selección reutilizable con relaciones (especialidad y clínica)
const SELECT_MEDICO = `
  id_medico,
  nombre,
  telefono,
  disponible,
  foto_url,
  foto_public_id,
  foto_version,
  especialidad:especialidades (
    id_especialidad,
    nombre
  ),
  clinica:clinicas (
    id_clinica,
    nombre,
    direccion,
    latitud,
    longitud
  )
`;

export const medicosService = {
  async guardarMiConfiguracion({ nombre, telefono, especialidad_id, clinica_id, horarios, usuarioId = null }) {
    const problema = validarHorarios(horarios);
    if (problema) throw new Error(problema);
    const { data, error } = await supabase.rpc('guardar_mi_configuracion_medica', {
      p_usuario_id: usuarioId, p_nombre: nombre.trim(), p_telefono: (telefono || '').trim(),
      p_especialidad_id: Number(especialidad_id), p_clinica_id: Number(clinica_id),
      p_horarios: horarios.map(h => ({ dia_semana: Number(h.dia_semana), hora_inicio: h.hora_inicio, hora_fin: h.hora_fin })),
    });
    if (error) {
      if (error.code === 'PGRST202') throw new Error('La configuración médica aún no está habilitada. Solicita al administrador que active esta función.');
      throw new Error(error.code === 'P0001' ? error.message : 'No pudimos guardar tu atención y horarios. Revisa la conexión e inténtalo nuevamente.');
    }
    return data;
  },


  /** Registro profesional vinculado a una cuenta autenticada. */
  async obtenerPorUsuario(idUsuario) {
    const { data, error } = await supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .eq('usuario_id', idUsuario)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  },

  // ==========================================================
  // RF03: Buscar médicos
  // ==========================================================

  async buscar({ especialidadId = null, clinicaId = null, texto = '' } = {}) {

    let consulta = supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .eq('disponible', true)
      .order('nombre');

    if (especialidadId) {
      consulta = consulta.eq(
        'especialidad_id',
        especialidadId
      );
    }

    if (clinicaId) consulta = consulta.eq('clinica_id', clinicaId);

    if (texto.trim()) {
      consulta = consulta.ilike(
        'nombre',
        `%${texto.trim()}%`
      );
    }

    const { data, error } = await consulta;

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },


  // ==========================================================
  // Obtener médico por ID
  // ==========================================================

  async obtenerPorId(idMedico) {

    const { data, error } = await supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .eq('id_medico', idMedico)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },


  // ==========================================================
  // RF04: Horarios semanales
  // ==========================================================

  async obtenerHorarios(idMedico) {

    const { data, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('medico_id', idMedico)
      .order('dia_semana')
      .order('hora_inicio');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },


  // ==========================================================
  // RF08: Gestión de médicos - administrador
  // ==========================================================

  async listarTodos() {

    const { data, error } = await supabase
      .from('medicos')
      .select(`${SELECT_MEDICO}, usuario_id`)
      .order('id_medico');

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },



  // ==========================================================
  // Crear médico
  // ==========================================================

  async crear({
    nombre,
    telefono,
    especialidad_id,
    clinica_id
  }) {

    const { data, error } = await supabase
      .from('medicos')
      .insert({
        nombre,
        telefono,
        especialidad_id,
        clinica_id
      })
      .select(SELECT_MEDICO)
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  },


  // ==========================================================
  // Subir foto del médico
  //
  // Flujo:
  //
  // React
  //   ↓
  // Cloudinary
  //   ↓
  // foto_url
  // foto_public_id
  // foto_version
  //   ↓
  // Supabase.medicos
  // ==========================================================

  async subirFoto(idMedico, file) {

    if (!idMedico) {
      throw new Error(
        'Se necesita el ID del médico.'
      );
    }

    if (!file) {
      throw new Error(
        'Se necesita seleccionar una imagen.'
      );
    }

    // 1. Subir imagen a Cloudinary
    const image = await uploadDoctorImage(
      file,
      idMedico
    );

    // 2. Guardar referencias de Cloudinary en Supabase
    const { data, error } = await supabase
      .from('medicos')
      .update({
        foto_url: image.url,
        foto_public_id: image.publicId,
        foto_version: image.version
      })
      .eq('id_medico', idMedico)
      .select(SELECT_MEDICO)
      .single();

    if (error) {
      throw new Error(
        `La imagen se subió a Cloudinary, pero no se pudo guardar en Supabase: ${error.message}`
      );
    }

    return data;
  },


  // ==========================================================
  // Cambiar disponibilidad
  // ==========================================================

  async cambiarDisponibilidad(
    idMedico,
    disponible
  ) {

    const { error } = await supabase
      .from('medicos')
      .update({
        disponible
      })
      .eq('id_medico', idMedico);

    if (error) {
      throw new Error(error.message);
    }
  },


  // ==========================================================
  // Eliminar médico
  // ==========================================================

  async eliminar(idMedico) {

    const { error } = await supabase
      .from('medicos')
      .delete()
      .eq('id_medico', idMedico);

    if (error) {
      throw new Error(error.message);
    }
  }

};
