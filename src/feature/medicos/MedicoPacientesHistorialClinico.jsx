import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  ClipboardList,
  Stethoscope,
  FileText,
  CalendarDays,
  Search,
  RefreshCw,
  AlertCircle,
  Activity,
  Pill,
  HeartPulse,
  ChevronRight,
} from "lucide-react";

import EstadoCarga from "../../components/medico/EstadoCarga";
import EstadoCita from "../../components/medico/EstadoCita";
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
  if (!paciente) return "Paciente";

  return (
    paciente.nombre_completo ||
    [paciente.nombres, paciente.apellidos].filter(Boolean).join(" ") ||
    paciente.nombre ||
    "Paciente"
  );
}

function obtenerFecha(cita) {
  return String(cita?.fecha || cita?.fecha_cita || "").slice(0, 10);
}

function formatearFecha(fecha) {
  if (!fecha) return "Fecha no disponible";

  const partes = String(fecha).slice(0, 10).split("-");

  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function obtenerConsulta(cita) {
  const consulta =
    cita?.consulta ||
    cita?.consultas ||
    cita?.consulta_medica ||
    cita?.historial_clinico ||
    null;

  return Array.isArray(consulta) ? consulta[0] || {} : consulta || {};
}

function obtenerCampo(cita, consulta, campos) {
  for (const campo of campos) {
    const valor = consulta?.[campo] ?? cita?.[campo];

    if (valor !== null && valor !== undefined && String(valor).trim()) {
      return valor;
    }
  }

  return "";
}

function obtenerRegistrosClinicos(citas) {
  return citas
    .map((cita) => {
      const consulta = obtenerConsulta(cita);

      const diagnostico = obtenerCampo(cita, consulta, [
        "diagnostico",
        "diagnostico_principal",
        "diagnosticos",
      ]);

      const tratamiento = obtenerCampo(cita, consulta, [
        "tratamiento",
        "plan_tratamiento",
        "indicaciones",
      ]);

      const observaciones = obtenerCampo(cita, consulta, [
        "observaciones_consulta",
        "observaciones",
        "notas_medicas",
        "evolucion",
      ]);

      const motivo = obtenerCampo(cita, consulta, [
        "motivo",
        "motivo_consulta",
        "descripcion",
      ]);

      const antecedentes = obtenerCampo(cita, consulta, [
        "antecedentes",
        "antecedentes_medicos",
        "historia_medica",
      ]);

      const medicamentos = obtenerCampo(cita, consulta, [
        "medicamentos",
        "medicacion",
        "prescripcion",
      ]);

      const fecha = obtenerCampo(cita, consulta, [
        "fecha_consulta",
        "fecha",
        "fecha_cita",
      ]);

      const tieneRegistro =
        Boolean(diagnostico) ||
        Boolean(tratamiento) ||
        Boolean(observaciones) ||
        Boolean(antecedentes) ||
        Boolean(medicamentos) ||
        Boolean(consulta?.id);

      return {
        id: cita.id,
        cita,
        consulta,
        fecha: String(fecha || "").slice(0, 10),
        diagnostico,
        tratamiento,
        observaciones,
        motivo,
        antecedentes,
        medicamentos,
        tieneRegistro,
      };
    })
    .filter((registro) => registro.tieneRegistro)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
}

function mostrarContenido(valor) {
  if (Array.isArray(valor)) {
    return valor
      .map((item) => {
        if (typeof item === "string") return item;

        return (
          item?.nombre ||
          item?.descripcion ||
          item?.medicamento ||
          JSON.stringify(item)
        );
      })
      .filter(Boolean)
      .join(", ");
  }

  if (typeof valor === "object" && valor !== null) {
    return (
      valor.descripcion ||
      valor.nombre ||
      valor.detalle ||
      JSON.stringify(valor)
    );
  }

  return String(valor ?? "");
}

export default function MedicoPacientesHistorialClinico() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState("todos");

  const cargarHistorial = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const resultado = await obtenerCitasMedico();

      if (!Array.isArray(resultado)) {
        throw new Error("El servicio no devolvió una lista válida de citas.");
      }

      const citasPaciente = resultado.filter((cita) => {
        const pacienteId = obtenerIdPaciente(cita);

        return (
          pacienteId !== null &&
          pacienteId !== undefined &&
          String(pacienteId) === String(id)
        );
      });

      setCitas(citasPaciente);
    } catch (err) {
      console.error("Error al cargar el historial clínico:", err);
      setError(
        err?.message || "No se pudo cargar el historial clínico."
      );
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargarHistorial();
  }, [cargarHistorial]);

  const paciente = useMemo(
    () => obtenerPaciente(citas[0]),
    [citas]
  );

  const registros = useMemo(
    () => obtenerRegistrosClinicos(citas),
    [citas]
  );

  const registrosFiltrados = useMemo(() => {
    const termino = normalizarTexto(busqueda);

    return registros.filter((registro) => {
      const texto = normalizarTexto(
        [
          mostrarContenido(registro.diagnostico),
          mostrarContenido(registro.tratamiento),
          mostrarContenido(registro.observaciones),
          mostrarContenido(registro.motivo),
          mostrarContenido(registro.antecedentes),
          mostrarContenido(registro.medicamentos),
        ].join(" ")
      );

      const coincideBusqueda = !termino || texto.includes(termino);

      const coincideFiltro =
        filtro === "todos" ||
        (filtro === "diagnostico" && Boolean(registro.diagnostico)) ||
        (filtro === "tratamiento" && Boolean(registro.tratamiento)) ||
        (filtro === "observaciones" && Boolean(registro.observaciones));

      return coincideBusqueda && coincideFiltro;
    });
  }, [registros, busqueda, filtro]);

  const estadisticas = useMemo(
    () => ({
      citas: citas.length,
      registros: registros.length,
      diagnosticos: registros.filter((r) => Boolean(r.diagnostico)).length,
      tratamientos: registros.filter((r) => Boolean(r.tratamiento)).length,
    }),
    [citas, registros]
  );

  if (cargando) {
    return (
      <main className="medico-historial-clinico">
        <div className="medico-historial-clinico__carga">
          <EstadoCarga />
          <p>Cargando historial clínico...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="medico-historial-clinico">
        <button
          type="button"
          className="medico-historial-clinico__volver"
          onClick={() => navigate(`/medico/pacientes/${id}`)}
        >
          <ArrowLeft size={17} />
          Volver a la ficha
        </button>

        <section className="medico-historial-clinico__mensaje">
          <AlertCircle size={28} />
          <h2>No se pudo cargar el historial</h2>
          <p>{error}</p>
          <button type="button" onClick={cargarHistorial}>
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  if (!paciente) {
    return (
      <main className="medico-historial-clinico">
        <button
          type="button"
          className="medico-historial-clinico__volver"
          onClick={() => navigate("/medico/pacientes")}
        >
          <ArrowLeft size={17} />
          Volver a pacientes
        </button>

        <section className="medico-historial-clinico__mensaje">
          <UserRound size={28} />
          <h2>Paciente no encontrado</h2>
          <p>
            No encontramos citas relacionadas con este paciente en los datos
            disponibles para tu cuenta.
          </p>
        </section>
      </main>
    );
  }

  const nombre = obtenerNombre(paciente);
  const documento =
    paciente.numero_documento || paciente.documento || paciente.dni || "";

  return (
    <main className="medico-historial-clinico">
      <div className="medico-historial-clinico__barra">
        <button
          type="button"
          className="medico-historial-clinico__volver"
          onClick={() => navigate(`/medico/pacientes/${id}`)}
        >
          <ArrowLeft size={17} />
          Volver a la ficha
        </button>

        <button
          type="button"
          className="medico-historial-clinico__actualizar"
          onClick={cargarHistorial}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      <header className="medico-historial-clinico__encabezado">
        <div className="medico-historial-clinico__encabezado-icono">
          <HeartPulse size={27} />
        </div>

        <div className="medico-historial-clinico__encabezado-texto">
          <span>ÁREA MÉDICA</span>
          <h1>Historial clínico</h1>
          <p>
            Registros de consulta y seguimiento de <strong>{nombre}</strong>
            {documento ? ` · Documento: ${documento}` : ""}
          </p>
        </div>
      </header>

      <section
        className="medico-historial-clinico__estadisticas"
        aria-label="Resumen clínico"
      >
        <article className="medico-historial-clinico__estadistica">
          <CalendarDays size={21} />
          <div>
            <span>Citas registradas</span>
            <strong>{estadisticas.citas}</strong>
          </div>
        </article>

        <article className="medico-historial-clinico__estadistica">
          <ClipboardList size={21} />
          <div>
            <span>Registros clínicos</span>
            <strong>{estadisticas.registros}</strong>
          </div>
        </article>

        <article className="medico-historial-clinico__estadistica">
          <Stethoscope size={21} />
          <div>
            <span>Con diagnóstico</span>
            <strong>{estadisticas.diagnosticos}</strong>
          </div>
        </article>

        <article className="medico-historial-clinico__estadistica">
          <Pill size={21} />
          <div>
            <span>Con tratamiento</span>
            <strong>{estadisticas.tratamientos}</strong>
          </div>
        </article>
      </section>

      <section className="medico-historial-clinico__panel">
        <div className="medico-historial-clinico__panel-cabecera">
          <div>
            <h2>Registros clínicos</h2>
            <p>
              Diagnósticos, tratamientos y observaciones disponibles en las
              consultas registradas.
            </p>
          </div>
          <FileText size={22} />
        </div>

        <div className="medico-historial-clinico__filtros">
          <label className="medico-historial-clinico__buscador">
            <Search size={18} />
            <input
              type="search"
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              placeholder="Buscar diagnóstico, tratamiento u observación..."
              aria-label="Buscar en el historial clínico"
            />
          </label>

          <select
            value={filtro}
            onChange={(event) => setFiltro(event.target.value)}
            aria-label="Filtrar registros clínicos"
          >
            <option value="todos">Todos los registros</option>
            <option value="diagnostico">Con diagnóstico</option>
            <option value="tratamiento">Con tratamiento</option>
            <option value="observaciones">Con observaciones</option>
          </select>
        </div>

        {registrosFiltrados.length === 0 ? (
          <div className="medico-historial-clinico__vacio">
            <Activity size={34} />
            <h3>
              {registros.length === 0
                ? "No hay registros clínicos disponibles"
                : "No se encontraron coincidencias"}
            </h3>
            <p>
              {registros.length === 0
                ? "Las consultas con información clínica aparecerán aquí cuando estén registradas y el servicio las devuelva."
                : "Prueba con otro término o cambia el filtro seleccionado."}
            </p>
          </div>
        ) : (
          <div className="medico-historial-clinico__lista">
            {registrosFiltrados.map((registro) => (
              <article
                className="medico-historial-clinico__registro"
                key={registro.id}
              >
                <div className="medico-historial-clinico__registro-fecha">
                  <CalendarDays size={17} />
                  <span>{formatearFecha(registro.fecha)}</span>
                </div>

                <div className="medico-historial-clinico__registro-cuerpo">
                  <div className="medico-historial-clinico__registro-titulo">
                    <div>
                      <h3>
                        {mostrarContenido(registro.diagnostico) ||
                          mostrarContenido(registro.motivo) ||
                          "Registro de consulta"}
                      </h3>
                      <p>
                        {mostrarContenido(registro.motivo) ||
                          "Consulta médica"}
                      </p>
                    </div>

                    <EstadoCita estado={registro.cita.estado} />
                  </div>

                  {registro.antecedentes && (
                    <div className="medico-historial-clinico__campo">
                      <strong>Antecedentes</strong>
                      <p>{mostrarContenido(registro.antecedentes)}</p>
                    </div>
                  )}

                  {registro.diagnostico && (
                    <div className="medico-historial-clinico__campo">
                      <strong>Diagnóstico</strong>
                      <p>{mostrarContenido(registro.diagnostico)}</p>
                    </div>
                  )}

                  {registro.tratamiento && (
                    <div className="medico-historial-clinico__campo">
                      <strong>Tratamiento / indicaciones</strong>
                      <p>{mostrarContenido(registro.tratamiento)}</p>
                    </div>
                  )}

                  {registro.medicamentos && (
                    <div className="medico-historial-clinico__campo">
                      <strong>Medicamentos</strong>
                      <p>{mostrarContenido(registro.medicamentos)}</p>
                    </div>
                  )}

                  {registro.observaciones && (
                    <div className="medico-historial-clinico__campo">
                      <strong>Observaciones y evolución</strong>
                      <p>{mostrarContenido(registro.observaciones)}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    className="medico-historial-clinico__ver-cita"
                    onClick={() =>
                      navigate(`/medico/citas/${registro.id}/consulta`)
                    }
                  >
                    Ver consulta completa
                    <ChevronRight size={16} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
