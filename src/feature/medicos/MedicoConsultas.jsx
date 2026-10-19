
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  Search,
  CalendarDays,
  Eye,
  ClipboardList,
  CheckCircle2,
  Clock3,
  RefreshCw,
} from "lucide-react";

import EstadoCarga from "../../components/medico/EstadoCarga";
import { obtenerCitasMedico } from "../../services/citasService";
import "./Medico.css";

function normalizarTexto(valor) {
  return String(valor ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obtenerNombrePaciente(cita) {
  return (
    cita?.paciente?.nombre_completo ||
    cita?.paciente?.nombre ||
    cita?.nombre_paciente ||
    "Paciente sin nombre"
  );
}

function obtenerFecha(cita) {
  return cita?.fecha || cita?.fecha_cita || "";
}

function tieneConsultaRegistrada(cita) {
  // Ajusta estos campos si tu esquema utiliza otros nombres.
  return Boolean(
    cita?.consulta ||
    cita?.diagnostico ||
    cita?.tratamiento ||
    cita?.observaciones_consulta
  );
}

function formatearFecha(fecha) {
  if (!fecha) return "Fecha no disponible";

  const fechaLocal = String(fecha).slice(0, 10);
  const partes = fechaLocal.split("-");

  if (partes.length !== 3) return fechaLocal;

  const [anio, mes, dia] = partes;
  return `${dia}/${mes}/${anio}`;
}

export default function MedicoConsultas() {
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [busqueda, setBusqueda] = useState("");
  const [fecha, setFecha] = useState("");
  const [filtro, setFiltro] = useState("todas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarConsultas = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const resultado = await obtenerCitasMedico();

      if (!Array.isArray(resultado)) {
        throw new Error(
          "El servicio de citas no devolvió una lista válida."
        );
      }

      setCitas(resultado);
    } catch (err) {
      console.error("Error al cargar consultas:", err);
      setError(
        err?.message ||
          "No fue posible cargar las consultas. Inténtalo nuevamente."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarConsultas();
  }, [cargarConsultas]);

  // En esta versión se muestran las citas que contienen datos
  // de consulta. Si las consultas están en otra tabla, cambia
  // la carga para utilizar el servicio correspondiente.
  const consultas = useMemo(() => {
    return citas.filter(tieneConsultaRegistrada);
  }, [citas]);

  const consultasFiltradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);

    return consultas.filter((cita) => {
      const paciente = normalizarTexto(obtenerNombrePaciente(cita));
      const diagnostico = normalizarTexto(
        cita?.diagnostico || cita?.consulta?.diagnostico
      );
      const motivo = normalizarTexto(cita?.motivo || cita?.descripcion);

      const coincideBusqueda =
        !termino ||
        paciente.includes(termino) ||
        diagnostico.includes(termino) ||
        motivo.includes(termino);

      const coincideFecha =
        !fecha || String(obtenerFecha(cita)).slice(0, 10) === fecha;

      const estadoConsulta = normalizarTexto(
        cita?.estado_consulta ||
          cita?.consulta?.estado ||
          "registrada"
      );

      const coincideFiltro =
        filtro === "todas" ||
        (filtro === "registradas" &&
          ["registrada", "completada", "completado"].includes(
            estadoConsulta
          )) ||
        (filtro === "pendientes" &&
          ["pendiente", "borrador"].includes(estadoConsulta));

      return coincideBusqueda && coincideFecha && coincideFiltro;
    });
  }, [consultas, busqueda, fecha, filtro]);

  const totalConsultas = consultas.length;

  const consultasRegistradas = consultas.filter((cita) => {
    const estado = normalizarTexto(
      cita?.estado_consulta || cita?.consulta?.estado || "registrada"
    );

    return ["registrada", "completada", "completado"].includes(estado);
  }).length;

  const consultasPendientes = consultas.filter((cita) => {
    const estado = normalizarTexto(
      cita?.estado_consulta || cita?.consulta?.estado || ""
    );

    return ["pendiente", "borrador"].includes(estado);
  }).length;

  function limpiarFiltros() {
    setBusqueda("");
    setFecha("");
    setFiltro("todas");
  }

  function verConsulta(cita) {
    navigate(`/medico/citas/${cita.id}/consulta`);
  }

  return (
    <main className="medico-consultas">
      <header className="medico-consultas__encabezado">
        <div>
          <span className="medico-consultas__eyebrow">
            HISTORIAL MÉDICO
          </span>

          <h1>Mis consultas</h1>

          <p>
            Consulta los registros clínicos asociados a tus citas médicas.
          </p>
        </div>

        <button
          type="button"
          className="medico-consultas__actualizar"
          onClick={cargarConsultas}
          disabled={cargando}
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </header>

      <section
        className="medico-consultas__estadisticas"
        aria-label="Resumen de consultas"
      >
        <article className="medico-consultas__estadistica">
          <div className="medico-consultas__icono">
            <FileText size={21} />
          </div>

          <div>
            <span>Total de consultas</span>
            <strong>{totalConsultas}</strong>
            <small>Con información clínica registrada</small>
          </div>
        </article>

        <article className="medico-consultas__estadistica">
          <div className="medico-consultas__icono medico-consultas__icono--verde">
            <CheckCircle2 size={21} />
          </div>

          <div>
            <span>Registradas</span>
            <strong>{consultasRegistradas}</strong>
            <small>Consultas guardadas</small>
          </div>
        </article>

        <article className="medico-consultas__estadistica">
          <div className="medico-consultas__icono medico-consultas__icono--coral">
            <Clock3 size={21} />
          </div>

          <div>
            <span>Pendientes</span>
            <strong>{consultasPendientes}</strong>
            <small>Registros por completar</small>
          </div>
        </article>
      </section>

      <section className="medico-consultas__panel">
        <div className="medico-consultas__panel-titulo">
          <div>
            <h2>Historial de consultas</h2>
            <p>
              Busca por paciente, diagnóstico o motivo de atención.
            </p>
          </div>

          <span className="medico-consultas__contador">
            {consultasFiltradas.length} resultados
          </span>
        </div>

        <div className="medico-consultas__filtros">
          <label className="medico-consultas__busqueda">
            <Search size={18} />

            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar paciente o diagnóstico..."
              aria-label="Buscar consultas"
            />
          </label>

          <label className="medico-consultas__fecha">
            <CalendarDays size={18} />

            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              aria-label="Filtrar por fecha"
            />
          </label>

          <select
            value={filtro}
            onChange={(e) => setFiltro(e.target.value)}
            aria-label="Filtrar por estado"
          >
            <option value="todas">Todos los estados</option>
            <option value="registradas">Registradas</option>
            <option value="pendientes">Pendientes</option>
          </select>

          <button
            type="button"
            className="medico-consultas__limpiar"
            onClick={limpiarFiltros}
          >
            Limpiar
          </button>
        </div>

        {cargando ? (
          <div className="medico-consultas__estado">
            <EstadoCarga />
            <p>Cargando consultas...</p>
          </div>
        ) : error ? (
          <div className="medico-consultas__estado medico-consultas__estado--error">
            <p>{error}</p>

            <button type="button" onClick={cargarConsultas}>
              Reintentar
            </button>
          </div>
        ) : consultasFiltradas.length === 0 ? (
          <div className="medico-consultas__vacio">
            <div className="medico-consultas__vacio-icono">
              <ClipboardList size={30} />
            </div>

            <h3>No se encontraron consultas</h3>

            <p>
              {consultas.length === 0
                ? "Cuando registres información clínica en tus citas, aparecerá aquí."
                : "Prueba con otro término o elimina los filtros aplicados."}
            </p>

            {(busqueda || fecha || filtro !== "todas") && (
              <button type="button" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="medico-consultas__tabla-contenedor">
            <table className="medico-consultas__tabla">
              <thead>
                <tr>
                  <th>Paciente</th>
                  <th>Fecha</th>
                  <th>Motivo</th>
                  <th>Diagnóstico</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody>
                {consultasFiltradas.map((cita) => {
                  const estado = normalizarTexto(
                    cita?.estado_consulta ||
                      cita?.consulta?.estado ||
                      "registrada"
                  );

                  const pendiente = ["pendiente", "borrador"].includes(
                    estado
                  );

                  return (
                    <tr key={cita.id}>
                      <td>
                        <div className="medico-consultas__paciente">
                          <div className="medico-consultas__avatar">
                            {obtenerNombrePaciente(cita)
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <span>{obtenerNombrePaciente(cita)}</span>
                        </div>
                      </td>

                      <td>{formatearFecha(obtenerFecha(cita))}</td>

                      <td>
                        {cita?.motivo ||
                          cita?.descripcion ||
                          "No especificado"}
                      </td>

                      <td>
                        {cita?.diagnostico ||
                          cita?.consulta?.diagnostico ||
                          "Pendiente"}
                      </td>

                      <td>
                        <span
                          className={`medico-consultas__estado ${
                            pendiente
                              ? "medico-consultas__estado--pendiente"
                              : "medico-consultas__estado--registrada"
                          }`}
                        >
                          {pendiente ? "Pendiente" : "Registrada"}
                        </span>
                      </td>

                      <td>
                        <button
                          type="button"
                          className="medico-consultas__ver"
                          onClick={() => verConsulta(cita)}
                          title="Ver consulta"
                          aria-label={`Ver consulta de ${obtenerNombrePaciente(cita)}`}
                        >
                          <Eye size={17} />
                          Ver
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
