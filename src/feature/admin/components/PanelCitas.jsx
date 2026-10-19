import { useState } from 'react';

const formateadorFecha = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

function formatearFecha(fecha) {
  if (!fecha) return '—';

  return formateadorFecha
    .format(new Date(`${fecha}T00:00:00Z`))
    .replace('.', '');
}

export default function PanelCitas({ citas }) {
  const [filtroFecha, setFiltroFecha] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('');

  const visibles = citas.filter(
    (cita) =>
      (!filtroFecha || cita.fecha === filtroFecha) &&
      (!filtroEstado || cita.estado === filtroEstado)
  );

  function limpiarFiltros() {
    setFiltroFecha('');
    setFiltroEstado('');
  }

  return (
    <section
      className="tarjeta admin-seccion"
      aria-labelledby="admin-citas-titulo"
    >
      <div className="admin-seccion-cabecera">
        <div>
          <h2 id="admin-citas-titulo">Citas</h2>
          <p>Consulta las reservas y su estado actual.</p>
        </div>

        <span className="admin-seccion-total">
          {visibles.length} de {citas.length} citas
        </span>
      </div>

      <div className="admin-filtros">
        <label htmlFor="admin-filtro-fecha-cita">
          Fecha
          <input
            id="admin-filtro-fecha-cita"
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
          />
        </label>

        <label htmlFor="admin-filtro-estado-cita">
          Estado
          <select
            id="admin-filtro-estado-cita"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="pendiente">Pendiente</option>
            <option value="confirmada">Confirmada</option>
            <option value="atendida">Atendida</option>
            <option value="cancelada">Cancelada</option>
          </select>
        </label>

        {(filtroFecha || filtroEstado) && (
          <button
            type="button"
            className="boton boton-secundario boton-mini"
            onClick={limpiarFiltros}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      <div className="admin-tabla-contenedor">
        <table className="tabla tabla-tarjetas admin-tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Hora</th>
              <th>Paciente</th>
              <th>Médico</th>
              <th>Clínica</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {visibles.map((c) => (
              <tr key={c.id_cita}>
                <td data-label="Fecha">
                  <strong>{formatearFecha(c.fecha)}</strong>
                </td>
                <td data-label="Hora">{c.hora?.slice(0, 5) || '—'}</td>
                <td data-label="Paciente">{c.paciente}</td>
                <td data-label="Médico">{c.medico}</td>
                <td data-label="Clínica">{c.clinica}</td>
                <td data-label="Estado">
                  <span className={`estado estado-${c.estado}`}>
                    {c.estado}
                  </span>
                </td>
              </tr>
            ))}

            {visibles.length === 0 && (
              <tr>
                <td colSpan="6">
                  {citas.length
                    ? 'No hay citas que coincidan con los filtros.'
                    : 'No hay citas registradas.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
