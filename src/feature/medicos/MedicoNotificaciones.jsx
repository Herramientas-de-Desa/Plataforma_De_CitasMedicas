import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CalendarDays,
  CheckCheck,
  ClipboardList,
  Clock3,
  FileText,
  Info,
  Trash2,
  Check,
  ArrowRight,
  Filter,
  Inbox,
} from "lucide-react";

import "./Medico.css";

const CATEGORIAS = {
  cita: {
    etiqueta: "Citas",
    icono: CalendarDays,
    clase: "cita",
  },
  consulta: {
    etiqueta: "Consultas",
    icono: FileText,
    clase: "consulta",
  },
  sistema: {
    etiqueta: "Sistema",
    icono: Info,
    clase: "sistema",
  },
  paciente: {
    etiqueta: "Pacientes",
    icono: ClipboardList,
    clase: "paciente",
  },
};

function formatearFecha(fecha) {
  if (!fecha) return "";

  const fechaNotificacion = new Date(fecha);

  if (Number.isNaN(fechaNotificacion.getTime())) {
    return "";
  }

  return fechaNotificacion.toLocaleString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function MedicoNotificaciones() {
  const navigate = useNavigate();

  // Sustituye este estado local por los datos de tu servicio
  // de notificaciones de Supabase.
  const [notificaciones, setNotificaciones] = useState([]);

  const [filtroCategoria, setFiltroCategoria] = useState("todas");
  const [filtroLectura, setFiltroLectura] = useState("todas");

  const noLeidas = useMemo(
    () => notificaciones.filter((n) => !n.leida).length,
    [notificaciones]
  );

  const notificacionesFiltradas = useMemo(() => {
    return notificaciones.filter((notificacion) => {
      const coincideCategoria =
        filtroCategoria === "todas" ||
        notificacion.categoria === filtroCategoria;

      const coincideLectura =
        filtroLectura === "todas" ||
        (filtroLectura === "no-leidas" && !notificacion.leida) ||
        (filtroLectura === "leidas" && notificacion.leida);

      return coincideCategoria && coincideLectura;
    });
  }, [notificaciones, filtroCategoria, filtroLectura]);

  function marcarComoLeida(id) {
    setNotificaciones((actuales) =>
      actuales.map((notificacion) =>
        notificacion.id === id
          ? { ...notificacion, leida: true }
          : notificacion
      )
    );
  }

  function marcarTodasComoLeidas() {
    setNotificaciones((actuales) =>
      actuales.map((notificacion) => ({
        ...notificacion,
        leida: true,
      }))
    );
  }

  function eliminarNotificacion(id) {
    setNotificaciones((actuales) =>
      actuales.filter((notificacion) => notificacion.id !== id)
    );
  }

  function abrirNotificacion(notificacion) {
    marcarComoLeida(notificacion.id);

    if (notificacion.ruta) {
      navigate(notificacion.ruta);
    }
  }

  function limpiarFiltros() {
    setFiltroCategoria("todas");
    setFiltroLectura("todas");
  }

  return (
    <main className="medico-notificaciones">
      <header className="medico-notificaciones__encabezado">
        <div>
          <span className="medico-notificaciones__eyebrow">
            CENTRO DE AVISOS
          </span>

          <h1>Notificaciones</h1>

          <p>
            Mantente al tanto de las novedades de tus citas y consultas.
          </p>
        </div>

        <div className="medico-notificaciones__campana">
          <Bell size={25} />
          {noLeidas > 0 && (
            <span className="medico-notificaciones__contador">
              {noLeidas > 99 ? "99+" : noLeidas}
            </span>
          )}
        </div>
      </header>

      <section className="medico-notificaciones__resumen">
        <div className="medico-notificaciones__resumen-icono">
          <Inbox size={24} />
        </div>

        <div className="medico-notificaciones__resumen-texto">
          <strong>
            {noLeidas === 0
              ? "Estás al día"
              : `Tienes ${noLeidas} ${
                  noLeidas === 1
                    ? "notificación sin leer"
                    : "notificaciones sin leer"
                }`}
          </strong>

          <p>
            {noLeidas === 0
              ? "No tienes notificaciones pendientes de revisar."
              : "Revisa los avisos pendientes para mantener tu agenda organizada."}
          </p>
        </div>

        {noLeidas > 0 && (
          <button
            type="button"
            className="medico-notificaciones__marcar-todas"
            onClick={marcarTodasComoLeidas}
          >
            <CheckCheck size={17} />
            Marcar todas como leídas
          </button>
        )}
      </section>

      <section className="medico-notificaciones__panel">
        <div className="medico-notificaciones__panel-cabecera">
          <div>
            <h2>Todas las notificaciones</h2>
            <p>
              {notificacionesFiltradas.length}{" "}
              {notificacionesFiltradas.length === 1
                ? "notificación"
                : "notificaciones"}
            </p>
          </div>

          <Filter size={19} />
        </div>

        <div className="medico-notificaciones__filtros">
          <label>
            <span>Categoría</span>
            <select
              value={filtroCategoria}
              onChange={(e) => setFiltroCategoria(e.target.value)}
            >
              <option value="todas">Todas las categorías</option>
              <option value="cita">Citas</option>
              <option value="consulta">Consultas</option>
              <option value="paciente">Pacientes</option>
              <option value="sistema">Sistema</option>
            </select>
          </label>

          <label>
            <span>Estado</span>
            <select
              value={filtroLectura}
              onChange={(e) => setFiltroLectura(e.target.value)}
            >
              <option value="todas">Todas</option>
              <option value="no-leidas">No leídas</option>
              <option value="leidas">Leídas</option>
            </select>
          </label>

          {(filtroCategoria !== "todas" ||
            filtroLectura !== "todas") && (
            <button
              type="button"
              className="medico-notificaciones__limpiar"
              onClick={limpiarFiltros}
            >
              Limpiar filtros
            </button>
          )}
        </div>

        {notificacionesFiltradas.length === 0 ? (
          <div className="medico-notificaciones__vacio">
            <div className="medico-notificaciones__vacio-icono">
              <Bell size={30} />
            </div>

            <h3>
              {notificaciones.length === 0
                ? "No tienes notificaciones"
                : "No hay resultados"}
            </h3>

            <p>
              {notificaciones.length === 0
                ? "Cuando se registren avisos en tu cuenta, podrás consultarlos aquí."
                : "Prueba cambiando los filtros para encontrar otras notificaciones."}
            </p>

            {notificaciones.length > 0 && (
              <button
                type="button"
                onClick={limpiarFiltros}
              >
                Mostrar todas
              </button>
            )}
          </div>
        ) : (
          <div className="medico-notificaciones__lista">
            {notificacionesFiltradas.map((notificacion) => {
              const categoria =
                CATEGORIAS[notificacion.categoria] ||
                CATEGORIAS.sistema;

              const IconoCategoria = categoria.icono;

              return (
                <article
                  key={notificacion.id}
                  className={`medico-notificaciones__item ${
                    notificacion.leida
                      ? "medico-notificaciones__item--leida"
                      : "medico-notificaciones__item--nueva"
                  }`}
                >
                  <div
                    className={`medico-notificaciones__item-icono medico-notificaciones__item-icono--${categoria.clase}`}
                  >
                    <IconoCategoria size={21} />
                  </div>

                  <button
                    type="button"
                    className="medico-notificaciones__contenido"
                    onClick={() => abrirNotificacion(notificacion)}
                  >
                    <div className="medico-notificaciones__meta">
                      <span className="medico-notificaciones__categoria">
                        {categoria.etiqueta}
                      </span>

                      {!notificacion.leida && (
                        <span className="medico-notificaciones__punto" />
                      )}
                    </div>

                    <strong>{notificacion.titulo}</strong>

                    <p>{notificacion.mensaje}</p>

                    <span className="medico-notificaciones__fecha">
                      <Clock3 size={13} />
                      {formatearFecha(notificacion.created_at)}
                    </span>
                  </button>

                  <div className="medico-notificaciones__acciones">
                    {!notificacion.leida && (
                      <button
                        type="button"
                        title="Marcar como leída"
                        aria-label="Marcar como leída"
                        onClick={() =>
                          marcarComoLeida(notificacion.id)
                        }
                      >
                        <Check size={17} />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Quitar de la lista"
                      aria-label="Quitar notificación de la lista"
                      onClick={() =>
                        eliminarNotificacion(notificacion.id)
                      }
                    >
                      <Trash2 size={17} />
                    </button>

                    {notificacion.ruta && (
                      <button
                        type="button"
                        title="Abrir detalle"
                        aria-label="Abrir detalle"
                        onClick={() => abrirNotificacion(notificacion)}
                      >
                        <ArrowRight size={17} />
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
