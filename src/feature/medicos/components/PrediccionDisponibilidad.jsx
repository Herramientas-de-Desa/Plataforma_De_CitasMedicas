// Indicador reutilizable calculado a partir de la demanda estimada.
export default function PrediccionDisponibilidad({ prediccion, mostrarDemanda = false, compacto = false }) {
  if (!prediccion) {
    return (
      <p className="prediccion-vacia">
        {compacto ? 'Demanda no disponible' : 'Predicción pendiente de generar'}
      </p>
    );
  }

  const disponibilidad = Math.round(prediccion.disponibilidad_estimada);
  const demanda = Math.round(prediccion.demanda_estimada);
  if (compacto) {
    const nivel = prediccion.nivel_demanda === 'baja'
      ? 'baja'
      : prediccion.nivel_demanda === 'media'
        ? 'media'
        : prediccion.nivel_demanda === 'alta' || prediccion.nivel_demanda === 'saturada'
          ? 'alta'
          : null;

    return (
      <p className={`demanda-directorio demanda-directorio-${nivel || 'sin-datos'}`}>
        {nivel ? `${nivel[0].toUpperCase()}${nivel.slice(1)} demanda` : 'Demanda no disponible'}
      </p>
    );
  }

  const origen = prediccion.origen_datos === 'sintetico'
    ? 'Simulación con datos sintéticos'
    : prediccion.origen_datos === 'historico'
      ? 'Basado en datos históricos'
      : 'Origen de datos no verificado';
  const nivelDisponibilidad = disponibilidad >= 70
    ? 'alta'
    : disponibilidad >= 40
      ? 'media'
      : disponibilidad > 0 ? 'baja' : 'sin disponibilidad';

  return (
    <section className="prediccion" aria-label="Estimación de disponibilidad">
      <div className="prediccion-cabecera">
        <strong>Disponibilidad estimada: {nivelDisponibilidad}</strong>
        <span>{disponibilidad}%</span>
      </div>
      <div
        className="prediccion-barra"
        role="progressbar"
        aria-label="Disponibilidad estimada"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={disponibilidad}
      >
        <span style={{ width: `${disponibilidad}%` }} />
      </div>
      <p>{origen} · próximos {prediccion.horizonte_dias} días.</p>
      <small>No indica horarios libres en tiempo real.</small>
      {mostrarDemanda && <p>Demanda futura estimada: <strong>{demanda}%</strong>.</p>}
      <small className="prediccion-modelo">Modelo {prediccion.version_modelo}</small>
    </section>
  );
}

