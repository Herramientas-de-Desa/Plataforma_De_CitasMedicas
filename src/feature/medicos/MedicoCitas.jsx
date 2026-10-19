import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import TarjetaEstadistica from "../../components/medico/TarjetaEstadistica";
import FiltrosCitas from "../../components/medico/FiltrosCitas";
import TablaCitas from "../../components/medico/TablaCitas";
import EstadoCarga from "../../components/medico/EstadoCarga";

import { obtenerCitasMedico } from "../../services/citasService";

import "./Medico.css";

function fechaLocalISO() {
  const fecha = new Date();

  return [
    fecha.getFullYear(),
    String(fecha.getMonth() + 1).padStart(2, "0"),
    String(fecha.getDate()).padStart(2, "0"),
  ].join("-");
}

function normalizarEstado(estado) {
  return String(estado || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function nombrePaciente(cita) {
  return (
    cita.paciente?.nombre_completo ||
    cita.paciente?.nombre ||
    cita.nombre_paciente ||
    "Paciente"
  );
}

export default function MedicoCitas() {
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("todos");
  const [fecha, setFecha] = useState("");

  const cargarCitas = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const resultado = await obtenerCitasMedico();

      setCitas(Array.isArray(resultado) ? resultado : []);
    } catch (err) {
      console.error("Error al cargar las citas:", err);
      setError(err?.message || "No se pudieron cargar las citas.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarCitas();
  }, [cargarCitas]);

  const citasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return citas.filter((cita) => {
      const paciente = nombrePaciente(cita).toLowerCase();
      const motivo = String(cita.motivo || cita.descripcion || "")
        .toLowerCase();

      const coincideBusqueda =
        !termino ||
        paciente.includes(termino) ||
        motivo.includes(termino);

      const coincideEstado =
        estado === "todos" ||
        normalizarEstado(cita.estado) === normalizarEstado(estado);

      const coincideFecha =
        !fecha || String(cita.fecha || "").slice(0, 10) === fecha;

      return coincideBusqueda && coincideEstado && coincideFecha;
    });
  }, [citas, busqueda, estado, fecha]);

  const hoy = fechaLocalISO();

  const citasHoy = citas.filter(
    (cita) => String(cita.fecha || "").slice(0, 10) === hoy
  );

  const citasPendientes = citas.filter((cita) =>
    ["pendiente", "confirmada", "programada"].includes(
      normalizarEstado(cita.estado)
    )
  );

  const citasCompletadas = citas.filter((cita) =>
    ["completada", "atendida"].includes(normalizarEstado(cita.estado))
  );

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstado("todos");
    setFecha("");
  };

  const verDetalle = (cita) => {
    navigate(`/medico/citas/${cita.id}`);
  };

  const atenderCita = (cita) => {
    navigate(`/medico/citas/${cita.id}/consulta`);
  };

  if (cargando) {
    return (
      <EstadoCarga
        mensaje="Cargando tus citas médicas..."
        pantallaCompleta
      />
    );
  }

  return (
    <section className="medico-citas">
      <header className="medico-citas-heading">
        <div>
          <span className="medico-citas-eyebrow">
            GESTIÓN MÉDICA
          </span>

          <h1>Mis citas</h1>

          <p>
            Consulta tus citas, revisa los estados y organiza la
            atención de tus pacientes.
          </p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={cargarCitas}
          disabled={cargando}
        >
          ↻ Actualizar
        </button>
      </header>

      {error && (
        <div className="medico-citas-error" role="alert">
          <div>
            <strong>Error al consultar las citas</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={cargarCitas}
          >
            Reintentar
          </button>
        </div>
      )}

      <div className="medico-citas-estadisticas">
        <TarjetaEstadistica
          titulo="Citas de hoy"
          valor={citasHoy.length}
          descripcion="Programadas para hoy"
          icono="▣"
          color="verde"
        />

        <TarjetaEstadistica
          titulo="Pendientes"
          valor={citasPendientes.length}
          descripcion="Por atender o confirmar"
          icono="◷"
          color="coral"
        />

        <TarjetaEstadistica
          titulo="Completadas"
          valor={citasCompletadas.length}
          descripcion="Atenciones finalizadas"
          icono="✓"
          color="menta"
        />

        <TarjetaEstadistica
          titulo="Total de citas"
          valor={citas.length}
          descripcion="Citas disponibles"
          icono="▤"
          color="oscuro"
        />
      </div>

      <section className="medico-citas-panel">
        <div className="medico-citas-panel-heading">
          <div>
            <h2>Listado de citas</h2>
            <p>Busca y filtra las citas de tus pacientes.</p>
          </div>

          <span className="medico-citas-contador">
            {citasFiltradas.length}{" "}
            {citasFiltradas.length === 1 ? "resultado" : "resultados"}
          </span>
        </div>

        <FiltrosCitas
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          estado={estado}
          onEstadoChange={setEstado}
          fecha={fecha}
          onFechaChange={setFecha}
          onLimpiar={limpiarFiltros}
        />

        {citasFiltradas.length > 0 ? (
          <TablaCitas
            citas={citasFiltradas}
            onVerDetalle={verDetalle}
            onRegistrarConsulta={atenderCita}
          />
        ) : (
          <div className="medico-citas-vacio">
            <span className="medico-citas-vacio-icono" aria-hidden="true">
              ▣
            </span>

            <h3>
              {citas.length === 0
                ? "Todavía no tienes citas"
                : "No se encontraron citas"}
            </h3>

            <p>
              {citas.length === 0
                ? "Cuando tengas citas asignadas, aparecerán aquí."
                : "Prueba cambiando los filtros o el término de búsqueda."}
            </p>

            {citas.length > 0 && (
              <button
                type="button"
                className="btn-secondary"
                onClick={limpiarFiltros}
              >
                Limpiar filtros
              </button>
            )}
          </div>
        )}
      </section>
    </section>
  );
}
