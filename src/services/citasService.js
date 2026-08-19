// ============================================================
// citasService.js — Reserva, cancelación e historial de citas
// (RF05, RF06). Genera horas disponibles cruzando los horarios
// del médico con las citas ya reservadas.
// ============================================================
import { supabase } from './supabaseClient';
import { medicosService } from './medicosService';

const DURACION_CITA_MIN = 30; // minutos por cita

export const citasService = {
  /** RF04/RF05: Horas libres de un médico para una fecha concreta */
  async horasDisponibles(idMedico, fechaISO) {
    // dia_semana: 1 = Lunes ... 7 = Domingo (getUTCDay: 0 = Domingo)
    const dia = new Date(fechaISO + 'T00:00:00').getDay() || 7;

    const horarios = await medicosService.obtenerHorarios(idMedico);
    const bloques = horarios.filter((h) => h.dia_semana === dia);
    if (!bloques.length) return [];

    const { data: ocupadas, error } = await supabase
      .from('citas')
      .select('hora')
      .eq('medico_id', idMedico)
      .eq('fecha', fechaISO)
      .neq('estado', 'cancelada');
    if (error) throw new Error(error.message);
    const horasOcupadas = new Set((ocupadas || []).map((c) => c.hora.slice(0, 5)));

    const libres = [];
    for (const b of bloques) {
      let [h, m] = b.hora_inicio.split(':').map(Number);
      const [hf, mf] = b.hora_fin.split(':').map(Number);
      while (h * 60 + m + DURACION_CITA_MIN <= hf * 60 + mf) {
        const hora = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        if (!horasOcupadas.has(hora)) libres.push(hora);
        m += DURACION_CITA_MIN;
        if (m >= 60) { h += 1; m -= 60; }
      }
    }
    return libres;
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
