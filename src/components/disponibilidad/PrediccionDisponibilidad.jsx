// Indicador reutilizable calculado a partir de la demanda estimada.
// En el directorio el paciente solo ve una pista útil para reservar; la demanda
// media o sin datos no le aporta nada, así que no se muestra.
const PISTA_PACIENTE = {
  baja: { clase: 'baja', texto: 'Buena disponibilidad de horarios' },
  alta: { clase: 'alta', texto: 'Suele llenarse rápido · reserva con tiempo' },
  saturada: { clase: 'alta', texto: 'Suele llenarse rápido · reserva con tiempo' },
};

export default function PrediccionDisponibilidad({ prediccion, mostrarDemanda = false, compacto = false }) {
  if (compacto) {
    const pista = PISTA_PACIENTE[prediccion?.nivel_demanda];
    if (!pista) return null;
    return <p className={`demanda-directorio demanda-directorio-${pista.clase}`}>{pista.texto}</p>;
  }

  if (!prediccion) {
    return <p className="prediccion-vacia">Predicción pendiente de generar</p>;
  }

  const disponibilidad = Math.round(prediccion.disponibilidad_estimada);
  const demanda = Math.round(prediccion.demanda_estimada);

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

