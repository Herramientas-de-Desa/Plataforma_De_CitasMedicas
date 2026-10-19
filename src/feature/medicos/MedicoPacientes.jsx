import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  Search,
  RefreshCw,
  Eye,
  CalendarDays,
  ClipboardList,
  UserRound,
  ChevronRight,
} from "lucide-react";

import EstadoCarga from "../../components/medico/EstadoCarga";
import { obtenerCitasMedico } from "../../services/citasService";
import "./Medico.css";

function normalizarTexto(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

function obtenerPaciente(cita) {
  return cita?.paciente || cita?.pacientes || null;
}

function obtenerIdPaciente(cita) {
  const paciente = obtenerPaciente(cita);

  return (
    paciente?.id ||
    cita?.paciente_id ||
    paciente?.usuario_id ||
    null
  );
}

function obtenerNombre(paciente) {
  if (!paciente) return "Paciente sin nombre";

  return (
    paciente.nombre_completo ||
    [paciente.nombres, paciente.apellidos].filter(Boolean).join(" ") ||
    paciente.nombre ||
    "Paciente sin nombre"
  );
}

function obtenerDocumento(paciente) {
  return (
    paciente?.numero_documento ||
    paciente?.documento ||
    paciente?.dni ||
    ""
  );
}

function obtenerFecha(cita) {
  return String(cita?.fecha || cita?.fecha_cita || "").slice(0, 10);
}

function formatearFecha(fecha) {
  if (!fecha) return "Sin citas registradas";

  const partes = fecha.split("-");
  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function normalizarEstado(estado) {
  return normalizarTexto(estado);
}

function esCitaCompletada(cita) {
  return [
    "completada",
    "completado",
    "atendida",
    "atendido",
    "finalizada",
    "finalizado",
  ].includes(normalizarEstado(cita?.estado));
}

function crearListadoPacientes(citas) {
  const pacientesMap = new Map();

  citas.forEach((cita) => {
    const paciente = obtenerPaciente(cita);
    if (!paciente) return;

    const id = obtenerIdPaciente(cita);
    const nombre = obtenerNombre(paciente);
    const clave = id
      ? String(id)
      : normalizarTexto(nombre) || null;

    if (!clave) return;

    if (!pacientesMap.has(clave)) {
      pacientesMap.set(clave, {
        id: id || clave,
        nombre,
        documento: obtenerDocumento(paciente),
        correo: paciente.email || paciente.correo || "",
        telefono:
          paciente.telefono ||
          paciente.celular ||
          paciente.telefono_contacto ||
          "",
        citas: [],
      });
    }

    pacientesMap.get(clave).citas.push(cita);
  });

  return Array.from(pacientesMap.values())
    .map((paciente) => {
      const citasOrdenadas = [...paciente.citas].sort((a, b) =>
        obtenerFecha(b).localeCompare(obtenerFecha(a))
      );

      return {
        ...paciente,
        totalCitas: paciente.citas.length,
        citasCompletadas: paciente.citas.filter(esCitaCompletada).length,
        ultimaFecha: citasOrdenadas[0]
          ? obtenerFecha(citasOrdenadas[0])
          : "",
        ultimaCitaId: citasOrdenadas[0]?.id || null,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
}

export default function MedicoPacientes() {
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [filtroActividad, setFiltroActividad] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarPacientes = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const resultado = await obtenerCitasMedico();

      if (!Array.isArray(resultado)) {
        throw new Error("El servicio no devolvió una lista válida de citas.");
      }

      setCitas(resultado);
    } catch (err) {
      console.error("Error al cargar pacientes:", err);
      setError(
        err?.message || "No fue posible cargar el listado de pacientes."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarPacientes();
  }, [cargarPacientes]);

  const pacientes = useMemo(
    () => crearListadoPacientes(citas),
    [citas]
  );

  const pacientesFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda);

    return pacientes.filter((paciente) => {
      const coincideBusqueda =
        !termino ||
        normalizarTexto(paciente.nombre).includes(termino) ||
        normalizarTexto(paciente.documento).includes(termino) ||
        normalizarTexto(paciente.correo).includes(termino) ||
        normalizarTexto(paciente.telefono).includes(termino);

      const coincideActividad =
        filtroActividad === "todos" ||
        (filtroActividad === "con-citas" && paciente.totalCitas > 0) ||
        (filtroActividad === "atendidos" &&
          paciente.citasCompletadas > 0);

      return coincideBusqueda && coincideActividad;
    });
  }, [pacientes, busqueda, filtroActividad]);

  const totalCitas = citas.length;

  const totalAtenciones = citas.filter(esCitaCompletada).length;

  function limpiarFiltros() {
    setBusqueda("");
    setFiltroActividad("todos");
  }

  function verPaciente(paciente) {
    // Ajusta esta ruta cuando tengas la página de detalle de paciente.
    navigate(`/medico/pacientes/${paciente.id}`);
  }

  return (
    <main className="medico-pacientes">
      <header className="medico-pacientes__encabezado">
        <div>
          <span className="medico-pacientes__eyebrow">
            GESTIÓN CLÍNICA
          </span>

          <h1>Mis pacientes</h1>

          <p>
            Consulta los pacientes asociados a tus citas y revisa su actividad.
          </p>
        </div>

        <button
          type="button"
          className="medico-pacientes__actualizar"
          onClick={cargarPacientes}
          disabled={cargando}
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </header>

      <section
        className="medico-pacientes__estadisticas"
        aria-label="Resumen de pacientes"
      >
        <article className="medico-pacientes__estadistica">
          <div className="medico-pacientes__estadistica-icono">
            <Users size={22} />
          </div>
          <div>
            <span>Pacientes registrados</span>
            <strong>{pacientes.length}</strong>
            <small>Identificados en tus citas</small>
          </div>
        </article>

        <article className="medico-pacientes__estadistica">
          <div className="medico-pacientes__estadistica-icono medico-pacientes__estadistica-icono--menta">
            <CalendarDays size={22} />
          </div>
          <div>
            <span>Total de citas</span>
            <strong>{totalCitas}</strong>
            <small>Citas incluidas en el listado</small>
          </div>
        </article>

        <article className="medico-pacientes__estadistica">
          <div className="medico-pacientes__estadistica-icono medico-pacientes__estadistica-icono--coral">
            <ClipboardList size={22} />
          </div>
          <div>
            <span>Atenciones completadas</span>
            <strong>{totalAtenciones}</strong>
            <small>Citas marcadas como atendidas</small>
          </div>
        </article>
      </section>

      <section className="medico-pacientes__panel">
        <div className="medico-pacientes__panel-cabecera">
          <div>
            <h2>Directorio de pacientes</h2>
            <p>
              Busca por nombre, documento, correo o teléfono.
            </p>
          </div>

          <span className="medico-pacientes__contador">
            {pacientesFiltrados.length} resultados
          </span>
        </div>

        <div className="medico-pacientes__filtros">
          <label className="medico-pacientes__busqueda">
            <Search size={18} />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar paciente..."
              aria-label="Buscar pacientes"
            />
          </label>

          <label className="medico-pacientes__filtro-actividad">
            <span>Actividad</span>
            <select
              value={filtroActividad}
              onChange={(e) => setFiltroActividad(e.target.value)}
            >
              <option value="todos">Todos los pacientes</option>
              <option value="con-citas">Con citas registradas</option>
              <option value="atendidos">Con atenciones completadas</option>
            </select>
          </label>

          {(busqueda || filtroActividad !== "todos") && (
            <button
              type="button"
              className="medico-pacientes__limpiar"
              onClick={limpiarFiltros}
            >
              Limpiar
            </button>
          )}
        </div>

        {cargando ? (
          <div className="medico-pacientes__estado">
            <EstadoCarga />
            <p>Cargando pacientes...</p>
          </div>
        ) : error ? (
          <div className="medico-pacientes__estado medico-pacientes__estado--error">
            <p>{error}</p>
            <button type="button" onClick={cargarPacientes}>
              Reintentar
            </button>
          </div>
        ) : pacientesFiltrados.length === 0 ? (
          <div className="medico-pacientes__vacio">
            <div className="medico-pacientes__vacio-icono">
              <UserRound size={30} />
            </div>

            <h3>
              {pacientes.length === 0
                ? "Todavía no hay pacientes"
                : "No se encontraron pacientes"}
            </h3>

            <p>
              {pacientes.length === 0
                ? "Los pacientes aparecerán aquí cuando tus citas incluyan sus datos."
                : "Prueba con otro término o modifica los filtros."}
            </p>

            {(busqueda || filtroActividad !== "todos") && (
              <button type="button" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="medico-pacientes__tabla-contenedor">
            <table className="medico-pacientes__tabla">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Documento</th>
                  <th>Contacto</th>
                  <th>Total de citas</th>
                  <th>Última cita</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {pacientesFiltrados.map((paciente) => (
                  <tr key={paciente.id}>
                    <td>
                      <div className="medico-pacientes__identidad">
                        <div className="medico-pacientes__avatar">
                          {paciente.nombre.charAt(0).toUpperCase()}
                        </div>

                        <div className="medico-pacientes__nombre">
                          <strong>{paciente.nombre}</strong>
                          <span>
                            {paciente.citasCompletadas > 0
                              ? "Con atenciones realizadas"
                              : "Sin atenciones completadas"}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td>{paciente.documento || "No registrado"}</td>

                    <td>
                      <div className="medico-pacientes__contacto">
                        <span>{paciente.telefono || "Sin teléfono"}</span>
                        <small>{paciente.correo || "Sin correo"}</small>
                      </div>
                    </td>

                    <td>
                      <span className="medico-pacientes__numero-citas">
                        {paciente.totalCitas}
                      </span>
                    </td>

                    <td>{formatearFecha(paciente.ultimaFecha)}</td>

                    <td>
                      <button
                        type="button"
                        className="medico-pacientes__ver"
                        onClick={() => verPaciente(paciente)}
                        title="Ver detalle del paciente"
                        aria-label={`Ver detalle de ${paciente.nombre}`}
                      >
                        <Eye size={16} />
                        Ver
                        <ChevronRight size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
