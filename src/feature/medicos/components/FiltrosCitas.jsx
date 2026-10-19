export default function FiltrosCitas({
  busqueda = "",
  onBusquedaChange,
  estado = "todos",
  onEstadoChange,
  fecha = "",
  onFechaChange,
  onLimpiar,
}) {
  return (
    <section className="filtros-citas" aria-label="Filtros de citas">
      <div className="filtro-busqueda">
        <label htmlFor="buscar-paciente">Buscar paciente</label>
        <input
          id="buscar-paciente"
          type="search"
          value={busqueda}
          onChange={(e) => onBusquedaChange?.(e.target.value)}
          placeholder="Nombre del paciente..."
        />
      </div>

      <div className="filtro-campo">
        <label htmlFor="filtro-estado">Estado</label>
        <select
          id="filtro-estado"
          value={estado}
          onChange={(e) => onEstadoChange?.(e.target.value)}
        >
          <option value="todos">Todos los estados</option>
          <option value="pendiente">Pendiente</option>
          <option value="confirmada">Confirmada</option>
          <option value="completada">Completada</option>
          <option value="cancelada">Cancelada</option>
        </select>
      </div>

      <div className="filtro-campo">
        <label htmlFor="filtro-fecha">Fecha</label>
        <input
          id="filtro-fecha"
          type="date"
          value={fecha}
          onChange={(e) => onFechaChange?.(e.target.value)}
        />
      </div>

      <button
        type="button"
        className="btn-filtro-limpiar"
        onClick={() => onLimpiar?.()}
      >
        Limpiar filtros
      </button>
    </section>
  );
}
