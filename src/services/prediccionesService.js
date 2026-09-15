// Resultados agregados del modelo entrenado en Kaggle.
import { supabase } from './supabaseClient';

const HORIZONTE_PREDETERMINADO = 14;

function normalizar(prediccion) {
  if (!prediccion) return null;
  return {
    ...prediccion,
    demanda_estimada: Number(prediccion.demanda_estimada),
    disponibilidad_estimada: Number(prediccion.disponibilidad_estimada),
    mae_modelo: prediccion.mae_modelo == null ? null : Number(prediccion.mae_modelo),
  };
}

export const prediccionesService = {
  /** Última predicción vigente de cada médico para el horizonte solicitado. */
  async listarUltimas(horizonteDias = HORIZONTE_PREDETERMINADO) {
    const hoy = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('predicciones_medicos')
      .select(`
        *,
        medico:medicos (
          id_medico, nombre,
          especialidad:especialidades ( nombre ),
          clinica:clinicas ( nombre )
        )
      `)
      .eq('horizonte_dias', horizonteDias)
      .gte('fecha_fin', hoy)
      .order('fecha_generacion', { ascending: false });

    if (error) throw new Error(error.message);

    const porMedico = new Map();
    for (const fila of data || []) {
      if (!porMedico.has(fila.medico_id)) {
        porMedico.set(fila.medico_id, normalizar(fila));
      }
    }
    return [...porMedico.values()];
  },

  /** Última predicción vigente para un médico. */
  async obtenerUltima(medicoId, horizonteDias = HORIZONTE_PREDETERMINADO) {
    const hoy = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('predicciones_medicos')
      .select('*')
      .eq('medico_id', medicoId)
      .eq('horizonte_dias', horizonteDias)
      .gte('fecha_fin', hoy)
      .order('fecha_generacion', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return normalizar(data);
  },
};

export { HORIZONTE_PREDETERMINADO };

