// ============================================================
// citasService.js — Reserva, cancelación e historial de citas
// (RF05, RF06). Genera horas disponibles cruzando los horarios
// del médico con las citas ya reservadas.
// ============================================================
import { supabase } from './supabaseClient';
import { medicosService } from './medicosService';
import { diaSemana, fechaActualEnIca, horaActualEnIca, sumarDias } from './fechas';

const DURACION_CITA_MIN = 30; // minutos por cita
const DIAS_BUSQUEDA_PROXIMA = 30; // hasta dónde buscar el próximo día con horas libres

/** Turnos libres de un día: horario semanal menos citas activas y, si es hoy, horas ya pasadas. */
function turnosLibres(horarios, fechaISO, horasOcupadas) {
  const dia = diaSemana(fechaISO);
  const hoy = fechaActualEnIca();
  const ahora = fechaISO === hoy ? horaActualEnIca() : null;
  const libres = [];
  for (const b of horarios.filter((h) => h.dia_semana === dia)) {
    let [h, m] = b.hora_inicio.split(':').map(Number);
    const [hf, mf] = b.hora_fin.split(':').map(Number);
    while (h * 60 + m + DURACION_CITA_MIN <= hf * 60 + mf) {
      const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      if (!horasOcupadas.has(hora) && (!ahora || hora > ahora)) libres.push(hora);
      m += DURACION_CITA_MIN;
      if (m >= 60) { h += 1; m -= 60; }
    }
  }
  return libres.sort();
}

async function citasActivas(idMedico, desdeISO, hastaISO) {
  const { data, error } = await supabase
    .from('citas')
    .select('fecha, hora')
    .eq('medico_id', idMedico)
    .gte('fecha', desdeISO)
    .lte('fecha', hastaISO)
    .neq('estado', 'cancelada');
  if (error) throw new Error(error.message);
  return data || [];
}

export const citasService = {
  /** RF04/RF05: Horas libres de un médico para una fecha concreta */
  async horasDisponibles(idMedico, fechaISO) {
    const horarios = await medicosService.obtenerHorarios(idMedico);
    if (!horarios.some((h) => h.dia_semana === diaSemana(fechaISO))) return [];
    const ocupadas = await citasActivas(idMedico, fechaISO, fechaISO);
    return turnosLibres(horarios, fechaISO, new Set(ocupadas.map((c) => c.hora.slice(0, 5))));
  },

  /** Primer día posterior a fechaISO con al menos una hora libre, o null si no hay en 30 días. */
  async proximaFechaDisponible(idMedico, fechaISO) {
    const horarios = await medicosService.obtenerHorarios(idMedico);
    if (!horarios.length) return null;
    const desde = sumarDias(fechaISO, 1);
    const hasta = sumarDias(fechaISO, DIAS_BUSQUEDA_PROXIMA);
    const ocupadasPorFecha = new Map();
    for (const c of await citasActivas(idMedico, desde, hasta)) {
      if (!ocupadasPorFecha.has(c.fecha)) ocupadasPorFecha.set(c.fecha, new Set());
      ocupadasPorFecha.get(c.fecha).add(c.hora.slice(0, 5));
    }
    for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) {
      if (turnosLibres(horarios, fecha, ocupadasPorFecha.get(fecha) || new Set()).length) return fecha;
    }
    return null;
  },

  /** RF05: Reservar una cita */
  async reservar({ pacienteId, medicoId, fecha, hora }) {
    const { data, error } = await supabase
      .from('citas')
      .insert({ paciente_id: pacienteId, medico_id: medicoId, fecha, hora, estado: 'pendiente' })
      .select()
      .single();
    if (error) {
      if (error.code === '23505') throw new Error('Ese horario acaba de ser reservado. Elige otra hora.');
      throw new Error(error.message);
    }
    return data;
  },

  /** RF06: Cancelar una cita programada */
  async cancelar(idCita) {
    const { error } = await supabase
      .from('citas')
      .update({ estado: 'cancelada' })
      .eq('id_cita', idCita);
    if (error) throw new Error(error.message);
  },

  /** RF06: Reprogramar (modificar fecha/hora) */
  async reprogramar(idCita, { fecha, hora }) {
    const { error } = await supabase
      .from('citas')
      .update({ fecha, hora, estado: 'pendiente' })
      .eq('id_cita', idCita);
    if (error) {
      if (error.code === '23505') throw new Error('Ese horario ya está reservado.');
      throw new Error(error.message);
    }
  },

  /** Historial de citas del paciente (vista historial_citas) */
  async historialPaciente(pacienteId) {
    const { data, error } = await supabase
      .from('historial_citas')
      .select('*')
      .eq('paciente_id', pacienteId)
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  /** Agenda del médico */
  async agendaMedico(idMedico) {
    const { data, error } = await supabase
      .from('historial_citas')
      .select('*')
      .eq('id_medico', idMedico)
      .order('fecha')
      .order('hora');
    if (error) throw new Error(error.message);
    return data;
  },

  /** Supervisión de todas las citas (administrador) */
  async listarTodas() {
    const { data, error } = await supabase
      .from('historial_citas')
      .select('*')
      .order('fecha', { ascending: false })
      .order('hora', { ascending: false });
    if (error) throw new Error(error.message);
    return data;
  },

  async cambiarEstado(idCita, estado) {
    const { error } = await supabase
      .from('citas')
      .update({ estado })
      .eq('id_cita', idCita);
    if (error) throw new Error(error.message);
  },
};
