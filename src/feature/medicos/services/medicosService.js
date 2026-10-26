import { validarHorarios } from '../../citas/services/horariosValidacion';
import { supabase } from '../../../core/clients/supabaseClient';
import { uploadUserImage } from '../../../core/services/cloudinaryService';

const SELECT_MEDICO = `
  id_medico,
  usuario_id,
  nombre,
  telefono,
  disponible,
  usuario:usuarios!medicos_usuario_id_fkey (
    id_usuario,
    foto_url,
    foto_public_id,
    foto_version
  ),
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
  async guardarMiConfiguracion({
    nombre,
    telefono,
    especialidad_id,
    clinica_id,
    horarios,
    usuarioId = null,
  }) {
    const problema = validarHorarios(horarios);
    if (problema) throw new Error(problema);

    const { data, error } = await supabase.rpc(
      'guardar_mi_configuracion_medica',
      {
        p_usuario_id: usuarioId,
        p_nombre: nombre.trim(),
        p_telefono: (telefono || '').trim(),
        p_especialidad_id: Number(especialidad_id),
        p_clinica_id: Number(clinica_id),
        p_horarios: horarios.map((h) => ({
          dia_semana: Number(h.dia_semana),
          hora_inicio: h.hora_inicio,
          hora_fin: h.hora_fin,
        })),
      },
    );

    if (error) {
      if (error.code === 'PGRST202') {
        throw new Error(
          'La configuración médica aún no está habilitada. Solicita al administrador que active esta función.',
        );
      }

      throw new Error(
        error.code === 'P0001'
          ? error.message
          : 'No pudimos guardar tu atención y horarios. Revisa la conexión e inténtalo nuevamente.',
      );
    }

    return data;
  },

  async obtenerPorUsuario(idUsuario) {
    const { data, error } = await supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .eq('usuario_id', idUsuario)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  },

  async buscar({
    especialidadId = null,
    clinicaId = null,
    texto = '',
  } = {}) {
    let consulta = supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .eq('disponible', true)
      .order('nombre');

    if (especialidadId) {
      consulta = consulta.eq('especialidad_id', especialidadId);
    }

    if (clinicaId) {
      consulta = consulta.eq('clinica_id', clinicaId);
    }

    if (texto.trim()) {
      consulta = consulta.ilike('nombre', `%${texto.trim()}%`);
    }

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

  async listarTodos() {
    const { data, error } = await supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .order('id_medico');

    if (error) throw new Error(error.message);
    return data;
  },

  async crear({
    nombre,
    telefono,
    especialidad_id,
    clinica_id,
  }) {
    const { data, error } = await supabase
      .from('medicos')
      .insert({
        nombre,
        telefono,
        especialidad_id,
        clinica_id,
      })
      .select(SELECT_MEDICO)
      .single();

    if (error) throw new Error(error.message);
    return data;
  },

  async subirFoto(idMedico, file) {
    if (idMedico == null || String(idMedico).trim() === '') {
      throw new Error('Se necesita el ID del médico.');
    }

    if (!file) {
      throw new Error('Se necesita seleccionar una imagen.');
    }

    const { data: medico, error: errorMedico } = await supabase
      .from('medicos')
      .select('id_medico, usuario_id')
      .eq('id_medico', idMedico)
      .single();

    if (errorMedico) {
      throw new Error(`No se pudo obtener el médico: ${errorMedico.message}`);
    }

    if (!medico.usuario_id) {
      throw new Error('Este médico no tiene un usuario asociado.');
    }

    const image = await uploadUserImage(file, medico.usuario_id);

    if (!image?.url) {
      throw new Error('Cloudinary no devolvió una URL válida.');
    }

    const { data: usuario, error: errorUsuario } = await supabase
      .from('usuarios')
      .update({
        foto_url: image.url,
        foto_public_id: image.publicId ?? null,
        foto_version: image.version ?? null,
      })
      .eq('id_usuario', medico.usuario_id)
      .select('id_usuario, foto_url, foto_public_id, foto_version')
      .single();

    if (errorUsuario) {
      throw new Error(
        `La imagen se subió a Cloudinary, pero no se guardó en usuarios: ${errorUsuario.message}`,
      );
    }

    return {
      ...medico,
      usuario,
    };
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
