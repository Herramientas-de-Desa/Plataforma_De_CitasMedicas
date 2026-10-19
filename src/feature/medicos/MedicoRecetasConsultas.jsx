import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  ClipboardList,
  FileText,
  Search,
  RefreshCw,
  CalendarDays,
  UserRound,
  Pill,
  Eye,
  AlertCircle,
  CheckCircle2,
  Clock3,
  Filter,
  ChevronRight,
  XCircle,
} from "lucide-react";

import EstadoCarga from "../../components/medico/EstadoCarga";
import { obtenerCitasMedico } from "../../services/citasService";
import "./Medico.css";

function normalizarTexto(valor) {
  return String(valor ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obtenerPaciente(cita) {
  const paciente = cita?.paciente || cita?.pacientes || null;
  return Array.isArray(paciente) ? paciente[0] || null : paciente;
}

function obtenerNombrePaciente(cita) {
  const paciente = obtenerPaciente(cita);

  if (!paciente) {
    return cita?.nombre_paciente || "Paciente no identificado";
  }

  return (
    paciente.nombre_completo ||
    [paciente.nombres, paciente.apellidos].filter(Boolean).join(" ") ||
    paciente.nombre ||
    "Paciente"
  );
}

function obtenerConsulta(cita) {
  const consulta =
    cita?.consulta ||
    cita?.consultas ||
    cita?.consulta_medica ||
    null;

  return Array.isArray(consulta) ? consulta[0] || {} : consulta || {};
}

function obtenerRecetas(cita, consulta) {
  const datos =
    cita?.recetas ||
    consulta?.recetas ||
    cita?.receta ||
    consulta?.receta ||
    [];

  if (Array.isArray(datos)) return datos.filter(Boolean);
  if (datos && typeof datos === "object") return [datos];

  return [];
}

function fechaISO(valor) {
  return valor ? String(valor).slice(0, 10) : "";
}

function formatearFecha(valor) {
  const fecha = fechaISO(valor);
  if (!fecha) return "Sin fecha";

  const partes = fecha.split("-");
  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function normalizarEstado(estado) {
  const valor = normalizarTexto(estado);

  if (
    ["anulada", "anulado", "cancelada", "cancelado", "revocada"].includes(valor)
  ) {
    return "anulada";
  }

  if (
    ["emitida", "emitido", "activa", "activo", "vigente", "completada"].includes(
      valor
    )
  ) {
    return "emitida";
  }

  if (
    ["borrador", "pendiente", "en proceso", "por emitir"].includes(valor)
  ) {
    return "pendiente";
  }

  return valor || "sin estado";
}

function obtenerMedicamentos(receta) {
  const lista =
    receta?.medicamentos ||
    receta?.detalles ||
    receta?.detalle_receta ||
    receta?.items ||
    [];

  if (Array.isArray(lista)) {
    return lista.map((item) => {
      if (typeof item === "string") return item;

      return (
        item?.nombre_medicamento ||
        item?.medicamento?.nombre ||
        item?.nombre ||
        item?.medicamento ||
        "Medicamento"
      );
    });
  }

  if (typeof lista === "string" && lista.trim()) {
    return [lista];
  }

  return [];
}

function crearListadoRecetas(citas) {
  const resultado = [];

  citas.forEach((cita) => {
    const consulta = obtenerConsulta(cita);
    const recetas = obtenerRecetas(cita, consulta);

    recetas.forEach((receta, indice) => {
      const id = receta?.id || `${cita.id}-receta-${indice}`;

      resultado.push({
        id,
        citaId: cita.id,
        paciente: obtenerNombrePaciente(cita),
        pacienteId:
          obtenerPaciente(cita)?.id ||
          cita?.paciente_id ||
          obtenerPaciente(cita)?.usuario_id ||
          null,
        fecha:
          receta?.fecha_emision ||
          receta?.fecha ||
          receta?.created_at ||
          consulta?.fecha_consulta ||
          cita?.fecha ||
          cita?.fecha_cita ||
          "",
        estado: normalizarEstado(
          receta?.estado || receta?.estado_receta || "sin estado"
        ),
        diagnostico:
          receta?.diagnostico ||
          consulta?.diagnostico ||
          cita?.motivo ||
          "",
        indicaciones:
          receta?.indicaciones ||
          receta?.instrucciones ||
          receta?.observaciones ||
          "",
        medicamentos: obtenerMedicamentos(receta),
        receta,
      });
    });
  });

  return resultado.sort((a, b) =>
    fechaISO(b.fecha).localeCompare(fechaISO(a.fecha))
  );
}

function IconoEstado({ estado }) {
  if (estado === "emitida") {
    return <CheckCircle2 size={15} />;
  }

  if (estado === "anulada") {
    return <XCircle size={15} />;
  }

  return <Clock3 size={15} />;
}

export default function MedicoRecetasConsultas() {
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [fechaFiltro, setFechaFiltro] = useState("");

  const cargarRecetas = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const resultado = await obtenerCitasMedico();

      if (!Array.isArray(resultado)) {
        throw new Error("El servicio no devolvió una lista válida de citas.");
      }

      setCitas(resultado);
    } catch (err) {
      console.error("Error al cargar recetas médicas:", err);
      setError(err?.message || "No se pudieron cargar las recetas.");
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarRecetas();
  }, [cargarRecetas]);

  const recetas = useMemo(() => crearListadoRecetas(citas), [citas]);

  const filtradas = useMemo(() => {
    const termino = normalizarTexto(busqueda);

    return recetas.filter((receta) => {
      const texto = normalizarTexto(
        [
          receta.paciente,
          receta.diagnostico,
          receta.indicaciones,
          receta.id,
          receta.medicamentos.join(" "),
        ].join(" ")
      );

      const coincideTexto = !termino || texto.includes(termino);
      const coincideEstado =
        estadoFiltro === "todos" || receta.estado === estadoFiltro;
      const coincideFecha =
        !fechaFiltro || fechaISO(receta.fecha) === fechaFiltro;

      return coincideTexto && coincideEstado && coincideFecha;
    });
  }, [recetas, busqueda, estadoFiltro, fechaFiltro]);

  const estadisticas = useMemo(
    () => ({
      total: recetas.length,
      emitidas: recetas.filter((r) => r.estado === "emitida").length,
      pendientes: recetas.filter((r) => r.estado === "pendiente").length,
      anuladas: recetas.filter((r) => r.estado === "anulada").length,
    }),
    [recetas]
  );

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstadoFiltro("todos");
    setFechaFiltro("");
  };

  if (cargando) {
    return (
      <main className="medico-recetas">
        <div className="medico-recetas__carga">
          <EstadoCarga />
          <p>Cargando recetas de tus consultas...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="medico-recetas">
        <section className="medico-recetas__mensaje">
          <AlertCircle size={30} />
          <h2>No se pudieron cargar las recetas</h2>
          <p>{error}</p>
          <button type="button" onClick={cargarRecetas}>
            <RefreshCw size={16} />
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="medico-recetas">
      <div className="medico-recetas__barra">
        <button
          type="button"
          className="medico-recetas__volver"
          onClick={() => navigate("/medico")}
        >
          <ArrowLeft size={17} />
          Volver al panel
        </button>

        <button
          type="button"
          className="medico-recetas__actualizar"
          onClick={cargarRecetas}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      <header className="medico-recetas__encabezado">
        <div className="medico-recetas__encabezado-icono">
          <ClipboardList size={27} />
        </div>
        <div>
          <span>ÁREA MÉDICA</span>
          <h1>Recetas de consultas</h1>
          <p>
            Consulta y organiza las recetas asociadas a tus atenciones médicas.
          </p>
        </div>
      </header>

      <section className="medico-recetas__estadisticas">
        <article className="medico-recetas__estadistica">
          <div className="medico-recetas__estadistica-icono">
            <FileText size={21} />
          </div>
          <div>
            <span>Total de recetas</span>
            <strong>{estadisticas.total}</strong>
          </div>
        </article>

        <article className="medico-recetas__estadistica">
          <div className="medico-recetas__estadistica-icono medico-recetas__estadistica-icono--verde">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Emitidas</span>
            <strong>{estadisticas.emitidas}</strong>
          </div>
        </article>

        <article className="medico-recetas__estadistica">
          <div className="medico-recetas__estadistica-icono medico-recetas__estadistica-icono--coral">
            <Clock3 size={21} />
          </div>
          <div>
            <span>Pendientes</span>
            <strong>{estadisticas.pendientes}</strong>
          </div>
        </article>

        <article className="medico-recetas__estadistica">
          <div className="medico-recetas__estadistica-icono medico-recetas__estadistica-icono--gris">
            <XCircle size={21} />
          </div>
          <div>
            <span>Anuladas</span>
            <strong>{estadisticas.anuladas}</strong>
          </div>
        </article>
      </section>

      <section className="medico-recetas__panel">
        <div className="medico-recetas__panel-titulo">
          <div>
            <h2>Listado de recetas</h2>
            <p>
              {filtradas.length}{" "}
              {filtradas.length === 1 ? "resultado" : "resultados"}
            </p>
          </div>
          <Pill size={23} />
        </div>

        <div className="medico-recetas__filtros">
          <label className="medico-recetas__buscador">
            <Search size={18} />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar paciente, medicamento o diagnóstico..."
            />
          </label>

          <label className="medico-recetas__filtro">
            <Filter size={16} />
            <select
              value={estadoFiltro}
              onChange={(event) => setEstadoFiltro(event.target.value)}
              aria-label="Filtrar por estado"
            >
              <option value="todos">Todos los estados</option>
              <option value="emitida">Emitidas</option>
              <option value="pendiente">Pendientes</option>
              <option value="anulada">Anuladas</option>
              <option value="sin estado">Sin estado</option>
            </select>
          </label>

          <label className="medico-recetas__fecha">
            <CalendarDays size={16} />
            <input
              type="date"
              value={fechaFiltro}
              onChange={(event) => setFechaFiltro(event.target.value)}
              aria-label="Filtrar por fecha"
            />
          </label>

          <button
            type="button"
            className="medico-recetas__limpiar"
            onClick={limpiarFiltros}
          >
            Limpiar
          </button>
        </div>

        {filtradas.length === 0 ? (
          <div className="medico-recetas__vacio">
            <div className="medico-recetas__vacio-icono">
              <FileText size={30} />
            </div>
            <h3>
              {recetas.length === 0
                ? "No hay recetas disponibles"
                : "No encontramos resultados"}
            </h3>
            <p>
              {recetas.length === 0
                ? "Las recetas aparecerán aquí cuando el servicio de citas incluya recetas asociadas a las consultas."
                : "Prueba con otro término de búsqueda o cambia los filtros."}
            </p>
            {recetas.length > 0 && (
              <button type="button" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="medico-recetas__lista">
            {filtradas.map((receta) => (
              <article className="medico-recetas__tarjeta" key={receta.id}>
                <div className="medico-recetas__tarjeta-icono">
                  <FileText size={22} />
                </div>

                <div className="medico-recetas__contenido">
                  <div className="medico-recetas__titulo-fila">
                    <div>
                      <h3>Receta médica</h3>
                      <p>
                        <UserRound size={14} />
                        {receta.paciente}
                      </p>
                    </div>

                    <span
                      className={`medico-recetas__estado medico-recetas__estado--${receta.estado.replace(/\s+/g, "-")}`}
                    >
                      <IconoEstado estado={receta.estado} />
                      {receta.estado === "sin estado"
                        ? "Sin estado"
                        : receta.estado.charAt(0).toUpperCase() +
                          receta.estado.slice(1)}
                    </span>
                  </div>

                  <div className="medico-recetas__metadatos">
                    <span>
                      <CalendarDays size={15} />
                      {formatearFecha(receta.fecha)}
                    </span>
                    <span>
                      <Pill size={15} />
                      {receta.medicamentos.length}{" "}
                      {receta.medicamentos.length === 1
                        ? "medicamento"
                        : "medicamentos"}
                    </span>
                  </div>

                  {receta.diagnostico && (
                    <div className="medico-recetas__detalle">
                      <strong>Diagnóstico o motivo</strong>
                      <p>{receta.diagnostico}</p>
                    </div>
                  )}

                  {receta.medicamentos.length > 0 && (
                    <div className="medico-recetas__medicamentos">
                      <strong>Medicamentos</strong>
                      <div className="medico-recetas__etiquetas">
                        {receta.medicamentos.map((medicamento, indice) => (
                          <span key={`${receta.id}-${indice}`}>
                            <Pill size={13} />
                            {medicamento}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {receta.indicaciones && (
                    <div className="medico-recetas__detalle">
                      <strong>Indicaciones</strong>
                      <p>{receta.indicaciones}</p>
                    </div>
                  )}

                  <div className="medico-recetas__acciones">
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/medico/citas/${receta.citaId}/consulta`)
                      }
                    >
                      <Eye size={16} />
                      Ver consulta
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
