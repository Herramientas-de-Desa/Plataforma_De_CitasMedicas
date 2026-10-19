import EstadoCita from "./EstadoCita";

function obtenerNombrePaciente(cita) {
  return (
    cita.paciente?.nombre_completo ||
    cita.paciente?.nombre ||
    cita.nombre_paciente ||
    "Paciente"
  );
}

function formatearFecha(fecha) {
  if (!fecha) return "—";

  const resultado = new Date(`${fecha}T12:00:00`);

  if (Number.isNaN(resultado.getTime())) return fecha;

  return new Intl.DateTimeFormat("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(resultado);
}

export default function TablaCitas({
  citas = [],
  cargando = false,
  onVerDetalle,
  onRegistrarConsulta,
}) {
  if (cargando) {
    return (
      <div className="tabla-placeholder">
        <span className="medico-spinner" />
        <p>Cargando citas...</p>
      </div>
    );
  }

  return (
    <div className="tabla-container">
      <table className="tabla-citas">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Fecha</th>
            <th>Hora</th>
            <th>Motivo</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>

        <tbody>
          {citas.length === 0 ? (
            <tr>
              <td colSpan={6} className="tabla-empty">
                No hay citas para mostrar.
              </td>
            </tr>
          ) : (
            citas.map((cita) => (
              <tr key={cita.id}>
                <td>
                  <strong>{obtenerNombrePaciente(cita)}</strong>
                  {cita.paciente?.correo && (
                    <small className="tabla-subtext">
                      {cita.paciente.correo}
                    </small>
                  )}
                </td>

                <td>{formatearFecha(cita.fecha)}</td>
                <td>{cita.hora || cita.hora_inicio || "—"}</td>
                <td>{cita.motivo || cita.descripcion || "Consulta médica"}</td>

                <td>
                  <EstadoCita estado={cita.estado} />
                </td>

                <td>
                  <div className="tabla-actions">
                    {onVerDetalle && (
                      <button
                        type="button"
                        className="btn-table-secondary"
                        onClick={() => onVerDetalle(cita)}
                      >
                        Ver
                      </button>
                    )}

                    {onRegistrarConsulta &&
                      !["cancelada", "completada", "atendida"].includes(
                        String(cita.estado || "").toLowerCase()
                      ) && (
                        <button
                          type="button"
                          className="btn-table-primary"
                          onClick={() => onRegistrarConsulta(cita)}
                        >
                          Atender
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
