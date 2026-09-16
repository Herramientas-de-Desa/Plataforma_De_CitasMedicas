// Punto 3: carga futura agregada de cada médico para el administrador.
import { useEffect, useState } from 'react';
import { prediccionesService } from '../services/prediccionesService';

export default function PanelDemandaMedicos() {
  const [predicciones, setPredicciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    prediccionesService
      .listarUltimas()
      .then(setPredicciones)
      .catch(() => setError('No se pudieron cargar las predicciones. Verifica que la migración y los resultados de Kaggle estén aplicados.'))
      .finally(() => setCargando(false));
  }, []);

  if (cargando) return <p>Cargando predicciones…</p>;
  if (error) return <p className="alerta alerta-error">{error}</p>;

  return (
    <div className="tarjeta" style={{ overflowX: 'auto' }}>
      <div className="encabezado-tabla">
        <div>
          <h3>Demanda por médico</h3>
          <p className="detalle">Carga futura estimada por el modelo entrenado en Kaggle.</p>
        </div>
      </div>
      <table className="tabla tabla-tarjetas">
        <thead>
          <tr>
            <th>Médico</th><th>Especialidad</th><th>Clínica</th>
            <th>Demanda</th><th>Disponibilidad</th><th>Periodo</th>
          </tr>
        </thead>
        <tbody>
          {predicciones.map((p) => (
            <tr key={p.id_prediccion}>
              <td data-label="Médico">{p.medico?.nombre || `Médico ${p.medico_id}`}</td>
              <td data-label="Especialidad">{p.medico?.especialidad?.nombre || '—'}</td>
              <td data-label="Clínica">{p.medico?.clinica?.nombre || '—'}</td>
              <td data-label="Demanda">
                <span className={`nivel-demanda nivel-${p.nivel_demanda}`}>
                  {p.demanda_estimada.toFixed(0)}% · {p.nivel_demanda}
                </span>
              </td>
              <td data-label="Disponibilidad">{p.disponibilidad_estimada.toFixed(0)}%</td>
              <td data-label="Periodo">{p.fecha_inicio} — {p.fecha_fin}</td>
            </tr>
          ))}
          {predicciones.length === 0 && (
            <tr><td colSpan="6">Todavía no se importaron predicciones desde Kaggle.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

