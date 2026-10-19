import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Phone,
  Mail,
  IdCard,
  CalendarDays,
  ClipboardList,
  CheckCircle2,
  Clock3,
  FileText,
  Eye,
  RefreshCw,
  MapPin,
  AlertCircle,
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

function obtenerFecha(cita) {
  return String(cita?.fecha || cita?.fecha_cita || "").slice(0, 10);
}

function obtenerHora(cita) {
  return cita?.hora || cita?.hora_inicio || cita?.hora_cita || "";
}

function formatearFecha(fecha) {
  if (!fecha) return "No disponible";

  const partes = String(fecha).slice(0, 10).split("-");
  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function esCompletada(cita) {
  return [
    "completada",
    "completado",
    "atendida",
    "atendido",
    "finalizada",
    "finalizado",
  ].includes(normalizarTexto(cita?.estado));
}

function esCancelada(cita) {
  return [
    "cancelada",
    "cancelado",
    "no asistio",
    "rechazada",
    "rechazado",
  ].includes(normalizarTexto(cita?.estado));
}

function obtenerMotivo(cita) {
  return cita?.motivo || cita?.descripcion || "Sin motivo especificado";
}

function obtenerDiagnostico(cita) {
  return (
    cita?.diagnostico ||
    cita?.consulta?.diagnostico ||
    cita?.consulta_medica?.diagnostico ||
    ""
  );
}

function obtenerCitasDelPaciente(citas, idPaciente) {
  return citas.filter((cita) => {
    const id = obtenerIdPaciente(cita);

    return id != null && String(id) === String(idPaciente);
  });
}

export default function MedicoPacienteDetalles() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const resultado = await obtenerCitasMedico();

      if (!Array.isArray(resultado)) {
        throw new Error("No se pudo obtener una lista válida de citas.");
      }

      setCitas(resultado);
    } catch (err) {
      console.error("Error al cargar el detalle del paciente:", err);
      setError(
        err?.message || "No fue posible cargar la información del paciente."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const paciente = useMemo(() => {
    const cita = citas.find((item) => {
      const idPaciente = obtenerIdPaciente(item);
      return idPaciente != null && String(idPaciente) === String(id);
    });

    return cita ? obtenerPaciente(cita) : null;
  }, [citas, id]);

  const citasPaciente = useMemo(() => {
    return obtenerCitasDelPaciente(citas, id).sort((a, b) => {
      const fechaHoraA = `${obtenerFecha(a)} ${obtenerHora(a)}`;
      const fechaHoraB = `${obtenerFecha(b)} ${obtenerHora(b)}`;

      return fechaHoraB.localeCompare(fechaHoraA);
    });
  }, [citas, id]);

  const estadisticas = useMemo(() => {
    const completadas = citasPaciente.filter(esCompletada).length;
    const canceladas = citasPaciente.filter(esCancelada).length;

    return {
      total: citasPaciente.length,
      completadas,
      canceladas,
      pendientes: citasPaciente.filter(
        (cita) => !esCompletada(cita) && !esCancelada(cita)
      ).length,
    };
  }, [citasPaciente]);

  const nombre = obtenerNombre(paciente);

  if (cargando) {
    return (
      <main className="medico-paciente-detalle">
        <div className="medico-paciente-detalle__carga">
          <EstadoCarga />
          <p>Cargando ficha del paciente...</p>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="medico-paciente-detalle">
        <button
          type="button"
          className="medico-paciente-detalle__volver"
          onClick={() => navigate("/medico/pacientes")}
        >
          <ArrowLeft size={17} />
          Volver a pacientes
        </button>

        <section className="medico-paciente-detalle__mensaje medico-paciente-detalle__mensaje--error">
          <AlertCircle size={28} />
          <h2>No se pudo cargar la ficha</h2>
          <p>{error}</p>
          <button type="button" onClick={cargarDatos}>
            Reintentar
          </button>
        </section>
      </main>
    );
  }

  if (!paciente) {
    return (
      <main className="medico-paciente-detalle">
        <button
          type="button"
          className="medico-paciente-detalle__volver"
          onClick={() => navigate("/medico/pacientes")}
        >
          <ArrowLeft size={17} />
          Volver a pacientes
        </button>

        <section className="medico-paciente-detalle__mensaje">
          <UserRound size={30} />
          <h2>Paciente no encontrado</h2>
          <p>
            No encontramos un paciente con este identificador entre las citas
            disponibles para tu cuenta.
          </p>
        </section>
      </main>
    );
  }

  const documento =
    paciente.numero_documento || paciente.documento || paciente.dni || "";

  const correo = paciente.email || paciente.correo || "";
  const telefono =
    paciente.telefono ||
    paciente.celular ||
    paciente.telefono_contacto ||
    "";

  const direccion =
    paciente.direccion ||
    paciente.direccion_completa ||
    paciente.domicilio ||
    "";

  const fechaNacimiento =
    paciente.fecha_nacimiento || paciente.fechaNacimiento || "";

  return (
    <main className="medico-paciente-detalle">
      <div className="medico-paciente-detalle__barra-superior">
        <button
          type="button"
          className="medico-paciente-detalle__volver"
          onClick={() => navigate("/medico/pacientes")}
        >
          <ArrowLeft size={17} />
          Volver a pacientes
        </button>

        <button
          type="button"
          className="medico-paciente-detalle__actualizar"
          onClick={cargarDatos}
        >
          <RefreshCw size={16} />
          Actualizar
        </button>
      </div>

      <section className="medico-paciente-detalle__perfil">
        <div className="medico-paciente-detalle__avatar">
          {paciente.avatar_url ? (
            <img src={paciente.avatar_url} alt="" />
          ) : (
            nombre.charAt(0).toUpperCase()
          )}
        </div>

        <div className="medico-paciente-detalle__perfil-info">
          <span className="medico-paciente-detalle__eyebrow">
            FICHA DEL PACIENTE
          </span>

          <h1>{nombre}</h1>

          <p>
            {documento
              ? `Documento: ${documento}`
              : "Información general del paciente"}
          </p>
        </div>

        <div className="medico-paciente-detalle__perfil-acciones">
          <button
            type="button"
            onClick={() => navigate("/medico/consultas")}
          >
            <FileText size={17} />
            Ver consultas
          </button>
        </div>
      </section>

      <section
        className="medico-paciente-detalle__estadisticas"
        aria-label="Resumen del paciente"
      >
        <article className="medico-paciente-detalle__estadistica">
          <div className="medico-paciente-detalle__estadistica-icono">
            <CalendarDays size={21} />
          </div>
          <div>
            <span>Total de citas</span>
            <strong>{estadisticas.total}</strong>
          </div>
        </article>

        <article className="medico-paciente-detalle__estadistica">
          <div className="medico-paciente-detalle__estadistica-icono medico-paciente-detalle__estadistica-icono--verde">
            <CheckCircle2 size={21} />
          </div>
          <div>
            <span>Completadas</span>
            <strong>{estadisticas.completadas}</strong>
          </div>
        </article>

        <article className="medico-paciente-detalle__estadistica">
          <div className="medico-paciente-detalle__estadistica-icono medico-paciente-detalle__estadistica-icono--coral">
            <Clock3 size={21} />
          </div>
          <div>
            <span>Pendientes</span>
            <strong>{estadisticas.pendientes}</strong>
          </div>
        </article>

        <article className="medico-paciente-detalle__estadistica">
          <div className="medico-paciente-detalle__estadistica-icono medico-paciente-detalle__estadistica-icono--gris">
            <ClipboardList size={21} />
          </div>
          <div>
            <span>Canceladas / ausencias</span>
            <strong>{estadisticas.canceladas}</strong>
          </div>
        </article>
      </section>

      <div className="medico-paciente-detalle__columnas">
        <section className="medico-paciente-detalle__panel">
          <div className="medico-paciente-detalle__panel-cabecera">
            <div>
              <h2>Información personal</h2>
              <p>Datos disponibles del paciente</p>
            </div>
            <UserRound size={20} />
          </div>

          <div className="medico-paciente-detalle__datos">
            <div className="medico-paciente-detalle__dato">
              <span className="medico-paciente-detalle__dato-icono">
                <IdCard size={17} />
              </span>
              <div>
                <small>Documento</small>
                <strong>{documento || "No registrado"}</strong>
              </div>
            </div>

            <div className="medico-paciente-detalle__dato">
              <span className="medico-paciente-detalle__dato-icono">
                <Mail size={17} />
              </span>
              <div>
                <small>Correo electrónico</small>
                <strong>{correo || "No registrado"}</strong>
              </div>
            </div>

            <div className="medico-paciente-detalle__dato">
              <span className="medico-paciente-detalle__dato-icono">
                <Phone size={17} />
              </span>
              <div>
                <small>Teléfono</small>
                <strong>{telefono || "No registrado"}</strong>
              </div>
            </div>

            <div className="medico-paciente-detalle__dato">
              <span className="medico-paciente-detalle__dato-icono">
                <CalendarDays size={17} />
              </span>
              <div>
                <small>Fecha de nacimiento</small>
                <strong>
                  {fechaNacimiento
                    ? formatearFecha(fechaNacimiento)
                    : "No registrada"}
                </strong>
              </div>
            </div>

            <div className="medico-paciente-detalle__dato">
              <span className="medico-paciente-detalle__dato-icono">
                <MapPin size={17} />
              </span>
              <div>
                <small>Dirección</small>
                <strong>{direccion || "No registrada"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="medico-paciente-detalle__panel">
          <div className="medico-paciente-detalle__panel-cabecera">
            <div>
              <h2>Historial de citas</h2>
              <p>Registro de atenciones de este paciente</p>
            </div>

            <span className="medico-paciente-detalle__contador">
              {citasPaciente.length}
            </span>
          </div>

          {citasPaciente.length === 0 ? (
            <div className="medico-paciente-detalle__vacio">
              <CalendarDays size={28} />
              <strong>No hay citas registradas</strong>
              <p>Las citas del paciente aparecerán aquí.</p>
            </div>
          ) : (
            <div className="medico-paciente-detalle__historial">
              {citasPaciente.map((cita) => (
                <article
                  className="medico-paciente-detalle__cita"
                  key={cita.id}
                >
                  <div className="medico-paciente-detalle__cita-icono">
                    <CalendarDays size={19} />
                  </div>

                  <div className="medico-paciente-detalle__cita-info">
                    <strong>{obtenerMotivo(cita)}</strong>

                    <span>
                      {formatearFecha(obtenerFecha(cita))}
                      {obtenerHora(cita) ? ` · ${obtenerHora(cita)}` : ""}
                    </span>

                    {obtenerDiagnostico(cita) && (
                      <small>
                        Diagnóstico: {obtenerDiagnostico(cita)}
                      </small>
                    )}

                    <div className="medico-paciente-detalle__cita-estado">
                      <EstadoCita estado={cita.estado} />
                    </div>
                  </div>

                  <div className="medico-paciente-detalle__cita-acciones">
                    <button
                      type="button"
                      title="Ver cita"
                      aria-label="Ver cita"
                      onClick={() =>
                        navigate(`/medico/citas/${cita.id}`)
                      }
                    >
                      <Eye size={16} />
                    </button>

                    {esCompletada(cita) && (
                      <button
                        type="button"
                        title="Ver consulta"
                        aria-label="Ver consulta"
                        onClick={() =>
                          navigate(`/medico/citas/${cita.id}/consulta`)
                        }
                      >
                        <FileText size={16} />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
