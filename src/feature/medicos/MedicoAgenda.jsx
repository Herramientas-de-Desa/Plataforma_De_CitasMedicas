import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import TarjetaEstadistica from "./TarjetaEstadistica";
import FiltrosCitas from "./FiltrosCitas";
import TablaCitas from "./TablaCitas";
import EstadoCarga from "./EstadoCarga";

// Ajusta la ruta y el nombre de la función a tu servicio real.
import { obtenerCitasMedico } from "../../services/citasService";

import "./styles/Medico.css";

function fechaLocalISO() {
  const fecha = new Date();
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

export default function MedicoAgenda() {
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("todos");
  const [fecha, setFecha] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarCitas() {
      setCargando(true);
      setError("");

      try {
        // Se asume que el servicio devuelve un array de citas.
        const resultado = await obtenerCitasMedico();

        if (activo) {
          setCitas(Array.isArray(resultado) ? resultado : []);
        }
      } catch (err) {
        if (activo) {
          setError(
            err?.message || "No fue posible cargar la agenda médica."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    cargarCitas();

    return () => {
      activo = false;
    };
  }, []);

  const citasFiltradas = useMemo(() => {
    const termino = busqueda.trim().toLowerCase();

    return citas.filter((cita) => {
      const nombrePaciente =
        cita.paciente?.nombre_completo ||
        cita.paciente?.nombre ||
        cita.nombre_paciente ||
        "";

      const coincideBusqueda =
        !termino || nombrePaciente.toLowerCase().includes(termino);

      const estadoCita = String(cita.estado || "").toLowerCase();
      const coincideEstado =
        estado === "todos" || estadoCita === estado;

      const coincideFecha = !fecha || cita.fecha === fecha;

      return coincideBusqueda && coincideEstado && coincideFecha;
    });
  }, [citas, busqueda, estado, fecha]);

  const hoy = fechaLocalISO();

  const citasHoy = citas.filter((cita) => cita.fecha === hoy);

  const pendientes = citas.filter((cita) =>
    ["pendiente", "confirmada", "programada"].includes(
      String(cita.estado || "").toLowerCase()
    )
  );

  const completadas = citas.filter((cita) =>
    ["completada", "atendida"].includes(
      String(cita.estado || "").toLowerCase()
    )
  );

  function limpiarFiltros() {
    setBusqueda("");
    setEstado("todos");
    setFecha("");
  }

  function verDetalle(cita) {
    navigate(`/medico/agenda/${cita.id}`);
  }

  function registrarConsulta(cita) {
    navigate(`/medico/agenda/${cita.id}/consulta`);
  }

  if (cargando) {
    return <EstadoCarga mensaje="Cargando tu agenda médica..." pantallaCompleta />;
  }

  return (
    <section className="medico-agenda">
      <div className="agenda-heading">
        <div>
          <span className="agenda-eyebrow">GESTIÓN DE ATENCIONES</span>
          <h1>Mi agenda</h1>
          <p>Consulta tus citas y organiza la atención de tus pacientes.</p>
        </div>

        <button
          type="button"
          className="btn-primary"
          onClick={() => window.location.reload()}
        >
          ↻ Actualizar agenda
        </button>
      </div>

      {error && (
        <div className="agenda-error" role="alert">
          <strong>No se pudo cargar la agenda</strong>
          <p>{error}</p>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => window.location.reload()}
          >
            Intentar nuevamente
          </button>
        </div>
      )}

      <div className="agenda-stats">
        <TarjetaEstadistica
          titulo="Citas de hoy"
          valor={citasHoy.length}
          descripcion="Programadas para hoy"
          icono="▣"
          color="verde"
        />

        <TarjetaEstadistica
          titulo="Pendientes"
          valor={pendientes.length}
          descripcion="Por atender o confirmar"
          icono="◷"
          color="coral"
        />

        <TarjetaEstadistica
          titulo="Completadas"
          valor={completadas.length}
          descripcion="Consultas atendidas"
          icono="✓"
          color="menta"
        />

        <TarjetaEstadistica
          titulo="Total de citas"
          valor={citas.length}
          descripcion="Citas cargadas"
          icono="▤"
          color="oscuro"
        />
      </div>

      <section className="agenda-panel">
        <div className="agenda-panel-heading">
          <div>
            <h2>Listado de citas</h2>
            <p>Filtra y encuentra rápidamente una atención.</p>
          </div>

          <span className="agenda-count">
            {citasFiltradas.length}{" "}
            {citasFiltradas.length === 1 ? "cita" : "citas"}
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

        <TablaCitas
          citas={citasFiltradas}
          onVerDetalle={verDetalle}
          onRegistrarConsulta={registrarConsulta}
        />
      </section>
    </section>
  );
}
