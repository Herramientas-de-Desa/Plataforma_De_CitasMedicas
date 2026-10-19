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

function grupoConMayorPromedio(predicciones, obtenerNombre) {
  const grupos = new Map();
  for (const prediccion of predicciones) {
    const nombre = obtenerNombre(prediccion);
    if (!nombre) continue;
    const grupo = grupos.get(nombre) || { nombre, total: 0, medicos: 0 };
    grupo.total += prediccion.demanda_estimada;
    grupo.medicos += 1;
    grupos.set(nombre, grupo);
  }

  return [...grupos.values()]
    .sort((a, b) => b.total / b.medicos - a.total / a.medicos
      || a.nombre.localeCompare(b.nombre, 'es'))[0] || null;
}

export default function PanelDemandaMedicos() {
  const [predicciones, setPredicciones] = useState([]);
  const [especialidad, setEspecialidad] = useState('');
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

  const especialidades = [...new Set(
    predicciones.map((p) => p.medico?.especialidad?.nombre).filter(Boolean),
  )].sort((a, b) => a.localeCompare(b, 'es'));
  const prediccionesVisibles = predicciones
    .filter((p) => !especialidad || p.medico?.especialidad?.nombre === especialidad)
    .sort((a, b) => b.demanda_estimada - a.demanda_estimada
      || (a.medico?.nombre || '').localeCompare(b.medico?.nombre || '', 'es'));
  const promedioDemanda = prediccionesVisibles.length
    ? prediccionesVisibles.reduce((total, p) => total + p.demanda_estimada, 0) / prediccionesVisibles.length
    : 0;
  const mayorDemanda = prediccionesVisibles[0];
  const clinicaMayorPromedio = grupoConMayorPromedio(
    prediccionesVisibles, (p) => p.medico?.clinica?.nombre,
  );
  const especialidadMayorPromedio = grupoConMayorPromedio(
    prediccionesVisibles, (p) => p.medico?.especialidad?.nombre,
  );
  const periodos = new Set(prediccionesVisibles.map((p) => `${p.fecha_inicio}|${p.fecha_fin}`));
  const periodo = periodos.size === 1
    ? `${formatearFecha(prediccionesVisibles[0].fecha_inicio)} – ${formatearFecha(prediccionesVisibles[0].fecha_fin)}`
    : 'Los periodos varían según el médico';
  const origenes = new Set(prediccionesVisibles.map((p) => p.origen_datos));
  const origen = origenes.size === 1 && origenes.has('sintetico')
    ? 'Simulación con datos sintéticos'
    : origenes.size === 1 && origenes.has('historico')
      ? 'Predicciones basadas en datos históricos'
      : 'Origen de datos mixto o no verificado';

  return (
    <section className="tarjeta panel-demanda-medicos" aria-labelledby="demanda-medicos-titulo">
      <div className="encabezado-tabla demanda-medicos-cabecera">
        <div>
          <p className="etiqueta-seccion">Predicciones por médico</p>
          <h3 id="demanda-medicos-titulo">Demanda por médico</h3>
          <p className="detalle">Carga futura estimada por el modelo entrenado en Kaggle.</p>
          {prediccionesVisibles.length > 0 && (
            <>
              <p className="demanda-medicos-periodo"><strong>Periodo:</strong> {periodo}</p>
              <p className="demanda-medicos-origen">{origen}</p>
            </>
          )}
        </div>
        {predicciones.length > 0 && (
          <span className="demanda-medicos-total">{prediccionesVisibles.length} médicos analizados</span>
        )}
      </div>

      {predicciones.length > 0 && (
        <>
          <div className="demanda-medicos-filtros">
            <label htmlFor="filtro-especialidad-demanda">Especialidad</label>
            <select
              id="filtro-especialidad-demanda"
              value={especialidad}
              onChange={(evento) => setEspecialidad(evento.target.value)}
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map((nombre) => (
                <option key={nombre} value={nombre}>{nombre}</option>
              ))}
            </select>
            <span>Ordenados de mayor a menor demanda</span>
          </div>
          <div className="demanda-medicos-vista">
            <figure className="demanda-medicos-grafica">
              <figcaption>
                <strong>Comparación de demanda</strong>
                <span>Porcentaje estimado · mayor a menor</span>
              </figcaption>
              {prediccionesVisibles.length > 0 ? (
                <ol className="demanda-grafica-lista">
                  {prediccionesVisibles.map((p) => (
                    <li key={p.id_prediccion} className="demanda-grafica-fila">
                      <span className="demanda-grafica-nombre" title={p.medico?.nombre || `Médico ${p.medico_id}`}>
                        {p.medico?.nombre || `Médico ${p.medico_id}`}
                      </span>
                      <span className="demanda-grafica-pista" aria-hidden="true">
                        <span
                          className={`demanda-grafica-barra ${p.demanda_estimada > 50 ? 'demanda-grafica-barra-alta' : ''}`}
                          style={{ width: `${p.demanda_estimada}%` }}
                        />
                      </span>
                      <strong className="demanda-grafica-valor">{p.demanda_estimada.toFixed(0)}%</strong>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="demanda-grafica-vacia">No hay médicos para la especialidad seleccionada.</p>
              )}
            </figure>
            <div className="demanda-medicos-resumen" aria-label="Resumen de las predicciones">
              <article className="demanda-resumen-item">
                <span>Médicos evaluados</span>
                <strong>{prediccionesVisibles.length}</strong>
                <small>Con predicción vigente</small>
              </article>
              <article className="demanda-resumen-item">
                <span>Demanda promedio</span>
                <strong>{promedioDemanda.toFixed(0)}%</strong>
                <small>Durante el periodo</small>
              </article>
              <article className="demanda-resumen-item demanda-resumen-destacado">
                <span>Mayor demanda</span>
                <strong>{mayorDemanda ? `${mayorDemanda.demanda_estimada.toFixed(0)}%` : '—'}</strong>
                <small>{mayorDemanda?.medico?.nombre || (mayorDemanda ? `Médico ${mayorDemanda.medico_id}` : 'Sin datos')}</small>
              </article>
              <p className="demanda-resumen-nota">La disponibilidad es una estimación, no horarios libres en tiempo real.</p>
            </div>
          </div>
          {prediccionesVisibles.length > 0 && (
            <section className="demanda-medicos-agrupacion" aria-label="Comparación por clínica y especialidad">
              <div className="demanda-medicos-agrupacion-cabecera">
                <h4>Comparación por grupos</h4>
                <p>Promedio de demanda estimada de los médicos mostrados, no total de citas.</p>
              </div>
              <article className="demanda-grupo-item">
                <span>Clínica con mayor promedio</span>
                <strong>{clinicaMayorPromedio?.nombre || 'Sin datos'}</strong>
                <p>
                  {clinicaMayorPromedio
                    ? `${(clinicaMayorPromedio.total / clinicaMayorPromedio.medicos).toFixed(0)}% de demanda · ${clinicaMayorPromedio.medicos} ${clinicaMayorPromedio.medicos === 1 ? 'médico' : 'médicos'}`
                    : 'No hay clínicas asociadas'}
                </p>
              </article>
              <article className="demanda-grupo-item">
                <span>Especialidad con mayor promedio</span>
                <strong>{especialidadMayorPromedio?.nombre || 'Sin datos'}</strong>
                <p>
                  {especialidadMayorPromedio
                    ? `${(especialidadMayorPromedio.total / especialidadMayorPromedio.medicos).toFixed(0)}% de demanda · ${especialidadMayorPromedio.medicos} ${especialidadMayorPromedio.medicos === 1 ? 'médico' : 'médicos'}`
                    : 'No hay especialidades asociadas'}
                </p>
              </article>
            </section>
          )}
        </>
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
            {prediccionesVisibles.map((p) => (
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

