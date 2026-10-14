// Punto 3: carga futura agregada de cada médico para el administrador.
import { useEffect, useState } from 'react';
import { prediccionesService } from '../services/prediccionesService';

const formateadorFecha = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatearFecha(fecha) {
  if (!fecha) return '—';
  return formateadorFecha.format(new Date(`${fecha}T00:00:00Z`)).replace('.', '');
}

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

  const promedioDemanda = predicciones.length
    ? predicciones.reduce((total, p) => total + p.demanda_estimada, 0) / predicciones.length
    : 0;
  const mayorDemanda = predicciones.reduce(
    (mayor, p) => (!mayor || p.demanda_estimada > mayor.demanda_estimada ? p : mayor),
    null,
  );

  return (
    <section className="tarjeta panel-demanda-medicos" aria-labelledby="demanda-medicos-titulo">
      <div className="encabezado-tabla demanda-medicos-cabecera">
        <div>
          <p className="etiqueta-seccion">Predicción de los próximos 14 días</p>
          <h3 id="demanda-medicos-titulo">Demanda por médico</h3>
          <p className="detalle">Carga futura estimada por el modelo entrenado en Kaggle.</p>
        </div>
        {predicciones.length > 0 && (
          <span className="demanda-medicos-total">{predicciones.length} médicos analizados</span>
        )}
      </div>

      {predicciones.length > 0 && (
        <div className="demanda-medicos-resumen" aria-label="Resumen de las predicciones">
          <article className="demanda-resumen-item">
            <span>Médicos evaluados</span>
            <strong>{predicciones.length}</strong>
            <small>Con predicción vigente</small>
          </article>
          <article className="demanda-resumen-item">
            <span>Demanda promedio</span>
            <strong>{promedioDemanda.toFixed(0)}%</strong>
            <small>Durante el periodo</small>
          </article>
          <article className="demanda-resumen-item demanda-resumen-destacado">
            <span>Mayor demanda</span>
            <strong>{mayorDemanda?.demanda_estimada.toFixed(0)}%</strong>
            <small>{mayorDemanda?.medico?.nombre || `Médico ${mayorDemanda?.medico_id}`}</small>
          </article>
        </div>
      )}

      <div className="demanda-medicos-tabla-contenedor">
        <table className="tabla tabla-tarjetas tabla-demanda-medicos">
          <thead>
            <tr>
              <th>Médico</th><th>Especialidad</th><th>Clínica</th>
              <th>Demanda</th><th>Disponibilidad</th><th>Periodo</th>
            </tr>
          </thead>
          <tbody>
            {predicciones.map((p) => (
              <tr key={p.id_prediccion}>
                <td data-label="Médico">
                  <strong className="demanda-medico-nombre">
                    {p.medico?.nombre || `Médico ${p.medico_id}`}
                  </strong>
                </td>
                <td data-label="Especialidad">{p.medico?.especialidad?.nombre || '—'}</td>
                <td data-label="Clínica">{p.medico?.clinica?.nombre || '—'}</td>
                <td data-label="Demanda">
                  <span className={`nivel-demanda nivel-${p.nivel_demanda}`}>
                    {p.demanda_estimada.toFixed(0)}% · {p.nivel_demanda}
                  </span>
                </td>
                <td data-label="Disponibilidad">
                  <div className="disponibilidad-tabla">
                    <div
                      className="disponibilidad-tabla-barra"
                      role="progressbar"
                      aria-label={`Disponibilidad de ${p.medico?.nombre || `médico ${p.medico_id}`}`}
                      aria-valuemin="0"
                      aria-valuemax="100"
                      aria-valuenow={Math.round(p.disponibilidad_estimada)}
                    >
                      <span style={{ width: `${p.disponibilidad_estimada}%` }} />
                    </div>
                    <strong>{p.disponibilidad_estimada.toFixed(0)}%</strong>
                  </div>
                </td>
                <td data-label="Periodo">
                  <span className="demanda-periodo">
                    {formatearFecha(p.fecha_inicio)}<small>al</small>{formatearFecha(p.fecha_fin)}
                  </span>
                </td>
              </tr>
            ))}
            {predicciones.length === 0 && (
              <tr><td colSpan="6">Todavía no se importaron predicciones desde Kaggle.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

