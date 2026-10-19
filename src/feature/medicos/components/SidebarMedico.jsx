import { NavLink } from "react-router-dom";

const opciones = [
  { nombre: "Panel principal", ruta: "/medico", icono: "▦", exacta: true },
  { nombre: "Mi agenda", ruta: "/medico/agenda", icono: "▣" },
  { nombre: "Mis pacientes", ruta: "/medico/pacientes", icono: "♙" },
  { nombre: "Mi perfil", ruta: "/medico/perfil", icono: "⚙" },
];

export default function SidebarMedico({ onCerrarSesion }) {
  return (
    <aside className="medico-sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">M</div>
        <div>
          <strong>MediCitas</strong>
          <span>Portal médico</span>
        </div>
      </div>

      <div className="sidebar-section-label">MENÚ PRINCIPAL</div>

      <nav className="sidebar-nav" aria-label="Navegación médica">
        {opciones.map((opcion) => (
          <NavLink
            key={opcion.ruta}
            to={opcion.ruta}
            end={opcion.exacta}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <span className="sidebar-icon" aria-hidden="true">
              {opcion.icono}
            </span>
            <span>{opcion.nombre}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <strong>¿Necesitas ayuda?</strong>
          <p>Consulta con el equipo de soporte.</p>
        </div>

        {onCerrarSesion && (
          <button
            className="sidebar-logout"
            type="button"
            onClick={onCerrarSesion}
          >
            ↪ Cerrar sesión
          </button>
        )}
      </div>
    </aside>
  );
}
