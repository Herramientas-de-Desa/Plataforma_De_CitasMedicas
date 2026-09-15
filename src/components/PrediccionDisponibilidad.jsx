// Indicador reutilizable para la probabilidad de encontrar horarios libres.
export default function PrediccionDisponibilidad({ prediccion, mostrarDemanda = false }) {
  if (!prediccion) {
    return (
      <p className="prediccion-vacia">
        Predicción pendiente de generar
      </p>
    );
  }

  const disponibilidad = Math.round(prediccion.disponibilidad_estimada);
  const demanda = Math.round(prediccion.demanda_estimada);
  const nivelDisponibilidad = disponibilidad >= 70
    ? 'alta'
    : disponibilidad >= 40
      ? 'media'
      : disponibilidad > 0 ? 'baja' : 'sin disponibilidad';

  return (
    <section className="prediccion" aria-label="Predicción de disponibilidad">
      <div className="prediccion-cabecera">
        <strong>Disponibilidad {nivelDisponibilidad}</strong>
        <span>{disponibilidad}%</span>
      </div>
      <div
        className="prediccion-barra"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={disponibilidad}
      >
        <span style={{ width: `${disponibilidad}%` }} />
      </div>
      <p>
        Probabilidad estimada de encontrar horario en los próximos {prediccion.horizonte_dias} días.
      </p>
      {mostrarDemanda && <p>Demanda futura estimada: <strong>{demanda}%</strong>.</p>}
      <small>Modelo {prediccion.version_modelo}</small>
    </section>
  );
}

