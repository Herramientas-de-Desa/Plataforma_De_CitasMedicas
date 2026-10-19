export default function TarjetaEstadistica({
  titulo,
  valor = 0,
  descripcion,
  icono = "▦",
  tendencia,
  color = "verde",
}) {
  const colores = {
    verde: "stat-icon-green",
    coral: "stat-icon-coral",
    menta: "stat-icon-mint",
    oscuro: "stat-icon-dark",
  };

  return (
    <article className="stat-card">
      <div className="stat-card-top">
        <div>
          <p className="stat-title">{titulo}</p>
          <strong className="stat-value">{valor}</strong>
        </div>

        <div
          className={`stat-icon ${colores[color] || colores.verde}`}
          aria-hidden="true"
        >
          {icono}
        </div>
      </div>

      {(descripcion || tendencia) && (
        <div className="stat-card-footer">
          {descripcion && <span>{descripcion}</span>}
          {tendencia && <strong>{tendencia}</strong>}
        </div>
      )}
    </article>
  );
}
