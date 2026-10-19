export default function HeaderMedico({ medico }) {
  const fecha = new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  const nombre = medico?.nombre_completo
    || medico?.nombre
    || "Médico";

  const especialidad = medico?.especialidad_nombre
    || medico?.especialidad
    || "Profesional de salud";

  const inicial = nombre.trim().charAt(0).toUpperCase() || "M";

  return (
    <header className="medico-header">
      <div className="header-greeting">
        <span className="header-date">{fecha}</span>
        <h1>Panel médico</h1>
        <p>Gestiona tus citas y la atención de tus pacientes.</p>
      </div>

      <div className="header-profile">
        <div className="header-profile-text">
          <strong>Dr. {nombre}</strong>
          <span>{especialidad}</span>
        </div>

        {medico?.avatar_url ? (
          <img
            className="header-avatar"
            src={medico.avatar_url}
            alt={`Foto de ${nombre}`}
          />
        ) : (
          <div className="header-avatar header-avatar-fallback">
            {inicial}
          </div>
        )}
      </div>
    </header>
  );
}
