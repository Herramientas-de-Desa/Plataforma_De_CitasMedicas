
import { validarHorarios } from '../../citas/services/horariosValidacion';
import { supabase } from '../../../core/clients/supabaseClient';
import { uploadDoctorImage } from '../../../core/services/cloudinaryService';

// ============================================================
// medicosService.js — Gestión de médicos e imágenes
// ============================================================

const SELECT_MEDICO = `
  id_medico,
  usuario_id,
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

// ============================================================
// Validaciones auxiliares
// ============================================================

const validarIdMedico = (idMedico) => {
  if (
    idMedico === null ||
    idMedico === undefined ||
    String(idMedico).trim() === ''
  ) {
    throw new Error('Se necesita el ID del médico.');
  }
};

const validarRespuesta = (
  { error },
  mensaje = 'Ocurrió un error al consultar Supabase.'
) => {
  if (error) {
    throw new Error(`${mensaje} ${error.message || ''}`.trim());
  }
};

const validarArchivoImagen = (file) => {
  if (!file) {
    throw new Error('Selecciona una imagen antes de continuar.');
  }

  const tiposPermitidos = [
    'image/jpeg',
    'image/png',
    'image/webp',
  ];

  if (!tiposPermitidos.includes(file.type)) {
    throw new Error('Formato no permitido. Usa JPG, PNG o WEBP.');
  }

  if (file.size === 0) {
    throw new Error('El archivo seleccionado está vacío.');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('La imagen no puede superar los 5 MB.');
  }
};

export const medicosService = {
  // ==========================================================
  // Guardar configuración médica y horarios
  // ==========================================================

  async guardarMiConfiguracion({
    nombre,
    telefono,
    especialidad_id,
    clinica_id,
    horarios,
    usuarioId = null,
  }) {
    if (!nombre?.trim()) {
      throw new Error('El nombre del médico es obligatorio.');
    }

    if (!especialidad_id || !clinica_id) {
      throw new Error('Selecciona una especialidad y una clínica.');
    }

    if (!Array.isArray(horarios)) {
      throw new Error('Los horarios proporcionados no son válidos.');
    }

    const problema = validarHorarios(horarios);

    if (problema) {
      throw new Error(problema);
    }

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
      }
    );

    if (error) {
      if (error.code === 'PGRST202') {
        throw new Error(
          'La función de configuración médica no está disponible. Comprueba la función guardar_mi_configuracion_medica en Supabase.'
        );
      }

      throw new Error(
        error.code === 'P0001'
          ? error.message
          : `No se pudo guardar la configuración médica: ${error.message}`
      );
    }

    return data;
  },

  // ==========================================================
  // Obtener médico vinculado a un usuario
  // ==========================================================

  async obtenerPorUsuario(idUsuario) {
    if (!idUsuario) {
      throw new Error('Se necesita el ID del usuario.');
    }

    const { data, error } = await supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .eq('usuario_id', idUsuario)
      .maybeSingle();

    validarRespuesta(
      { error },
      'No se pudo obtener el médico.'
    );

    return data;
  },

  // ==========================================================
  // Buscar médicos disponibles
  // ==========================================================

  async buscar({ especialidadId = null, texto = '' } = {}) {
    let consulta = supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .eq('disponible', true)
      .order('nombre');

    if (especialidadId !== null && especialidadId !== '') {
      const id = Number(especialidadId);

      if (!Number.isFinite(id)) {
        throw new Error('El ID de especialidad no es válido.');
      }

      consulta = consulta.eq('especialidad_id', id);
    }

    const busqueda =
      typeof texto === 'string' ? texto.trim() : '';

    if (busqueda) {
      consulta = consulta.ilike('nombre', `%${busqueda}%`);
    }

    const { data, error } = await consulta;

    validarRespuesta(
      { error },
      'No se pudo realizar la búsqueda de médicos.'
    );

    return data ?? [];
  },

  // ==========================================================
  // Obtener médico por ID
  // ==========================================================

  async obtenerPorId(idMedico) {
    validarIdMedico(idMedico);

    const { data, error } = await supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .eq('id_medico', idMedico)
      .maybeSingle();

    validarRespuesta(
      { error },
      'No se pudo obtener el médico.'
    );

    if (!data) {
      throw new Error('No se encontró el médico solicitado.');
    }

    return data;
  },

  // ==========================================================
  // Obtener horarios semanales
  // ==========================================================

  async obtenerHorarios(idMedico) {
    validarIdMedico(idMedico);

    const { data, error } = await supabase
      .from('horarios')
      .select('*')
      .eq('medico_id', idMedico)
      .order('dia_semana')
      .order('hora_inicio');

    validarRespuesta(
      { error },
      'No se pudieron obtener los horarios.'
    );

    return data ?? [];
  },

  // ==========================================================
  // Listar médicos para administración
  // ==========================================================

  async listarTodos() {
    const { data, error } = await supabase
      .from('medicos')
      .select(SELECT_MEDICO)
      .order('id_medico');

    validarRespuesta(
      { error },
      'No se pudo obtener la lista de médicos.'
    );

    return data ?? [];
  },

  // ==========================================================
  // Crear médico
  // ==========================================================

  async crear({
    nombre,
    telefono,
    especialidad_id,
    clinica_id,
  }) {
    if (!nombre?.trim()) {
      throw new Error('El nombre del médico es obligatorio.');
    }

    if (!especialidad_id || !clinica_id) {
      throw new Error(
        'La especialidad y la clínica son obligatorias.'
      );
    }

    const { data, error } = await supabase
      .from('medicos')
      .insert({
        nombre: nombre.trim(),
        telefono: (telefono || '').trim(),
        especialidad_id: Number(especialidad_id),
        clinica_id: Number(clinica_id),
      })
      .select(SELECT_MEDICO)
      .single();

    validarRespuesta(
      { error },
      'No se pudo crear el médico.'
    );

    return data;
  },

  // ==========================================================
  // Subir foto a Cloudinary y guardar referencias en Supabase
  // ==========================================================

  async subirFoto(idMedico, file) {
    validarIdMedico(idMedico);
    validarArchivoImagen(file);

    // Comprobar que existe una sesión autenticada.
    const { data: sesionData, error: sesionError } =
      await supabase.auth.getSession();

    if (sesionError) {
      throw new Error(
        `No se pudo verificar la sesión: ${sesionError.message}`
      );
    }

    if (!sesionData?.session) {
      throw new Error(
        'Tu sesión ha expirado. Inicia sesión nuevamente para cambiar tu foto.'
      );
    }

    // 1. Subir la imagen a Cloudinary.
    // En este punto todavía no se ha modificado Supabase.
    const image = await uploadDoctorImage(file, idMedico);

    if (!image?.url || !image?.publicId) {
      throw new Error(
        'Cloudinary no devolvió la URL y el identificador de la imagen.'
      );
    }

    // 2. Guardar las referencias de Cloudinary.
    // Se seleccionan solo las columnas necesarias para esta operación.
    const { data, error } = await supabase
      .from('medicos')
      .update({
        foto_url: image.url,
        foto_public_id: image.publicId,
        foto_version: image.version ?? null,
      })
      .eq('id_medico', idMedico)
      .select(
        'id_medico, foto_url, foto_public_id, foto_version'
      )
      .maybeSingle();

    if (error) {
      throw new Error(
        `La imagen se subió a Cloudinary, pero Supabase rechazó el guardado. ${error.message} Código: ${error.code || 'no disponible'}.`
      );
    }

    if (!data) {
      throw new Error(
        'Cloudinary recibió la imagen, pero Supabase no devolvió el médico actualizado. Revisa las políticas RLS de UPDATE y SELECT de la tabla medicos, y verifica que id_medico corresponda al registro del usuario autenticado.'
      );
    }

    // 3. Recuperar el perfil completo con especialidad y clínica.
    // Así el componente recibe el mismo formato que utiliza al cargar el perfil.
    const { data: medicoCompleto, error: errorLectura } =
      await supabase
        .from('medicos')
        .select(SELECT_MEDICO)
        .eq('id_medico', idMedico)
        .maybeSingle();

    if (errorLectura) {
      // La actualización de la foto ya se confirmó.
      // Devolver los datos guardados evita comunicar un fallo
      // de subida cuando lo que falló fue la lectura de relaciones.
      console.warn(
        '[medicosService.subirFoto] La foto se guardó, pero no se pudo recargar el perfil completo:',
        errorLectura.message
      );

      return {
        ...data,
        nombre: '',
        telefono: '',
        disponible: null,
        especialidad: null,
        clinica: null,
      };
    }

    return medicoCompleto ?? data;
  },

  // ==========================================================
  // Cambiar disponibilidad
  // ==========================================================

  async cambiarDisponibilidad(idMedico, disponible) {
    validarIdMedico(idMedico);

    if (typeof disponible !== 'boolean') {
      throw new Error('El estado de disponibilidad no es válido.');
    }

    const { data, error } = await supabase
      .from('medicos')
      .update({ disponible })
      .eq('id_medico', idMedico)
      .select('id_medico, disponible')
      .maybeSingle();

    validarRespuesta(
      { error },
      'No se pudo cambiar la disponibilidad.'
    );

    if (!data) {
      throw new Error(
        'No se encontró el médico actualizado. Verifica el ID y los permisos de Supabase.'
      );
    }

    return data;
  },

  // ==========================================================
  // Eliminar médico
  // ==========================================================

  async eliminar(idMedico) {
    validarIdMedico(idMedico);

    const { data, error } = await supabase
      .from('medicos')
      .delete()
      .eq('id_medico', idMedico)
      .select('id_medico')
      .maybeSingle();

    validarRespuesta(
      { error },
      'No se pudo eliminar el médico.'
    );

    if (!data) {
      throw new Error(
        'No se encontró el médico eliminado. Verifica el ID y los permisos de Supabase.'
      );
    }

    return data;
  },
};
