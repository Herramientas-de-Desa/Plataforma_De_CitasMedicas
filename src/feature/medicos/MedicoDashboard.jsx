import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Clock3,
  CheckCircle2,
  Users,
  ArrowRight,
  RefreshCw,
  ClipboardList,
  FileText,
  CalendarPlus,
} from "lucide-react";

import TarjetaEstadistica from "../../components/medico/TarjetaEstadistica";
import EstadoCita from "../../components/medico/EstadoCita";
import EstadoCarga from "../../components/medico/EstadoCarga";
import { obtenerCitasMedico } from "../../services/citasService";
import "./Medico.css";

function fechaLocalISO() {
  const ahora = new Date();
  const anio = ahora.getFullYear();
  const mes = String(ahora.getMonth() + 1).padStart(2, "0");
  const dia = String(ahora.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function obtenerFecha(cita) {
  return String(cita?.fecha || cita?.fecha_cita || "").slice(0, 10);
}

function obtenerHora(cita) {
  return (
    cita?.hora ||
    cita?.hora_inicio ||
    cita?.hora_cita ||
    ""
  );
}

function normalizarEstado(estado) {
  return String(estado || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function obtenerNombrePaciente(cita) {
  return (
    cita?.paciente?.nombre_completo ||
    cita?.paciente?.nombre ||
    cita?.nombre_paciente ||
    "Paciente"
  );
}

function formatearFecha(fecha) {
  if (!fecha) return "Fecha pendiente";

  const partes = fecha.split("-");
  if (partes.length !== 3) return fecha;

  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function esPendiente(cita) {
  const estado = normalizarEstado(cita?.estado);

  return [
    "pendiente",
    "confirmada",
    "confirmado",
    "programada",
    "programado",
  ].includes(estado);
}

function esCompletada(cita) {
  const estado = normalizarEstado(cita?.estado);

  return [
    "completada",
    "completado",
    "atendida",
    "atendido",
    "finalizada",
    "finalizado",
  ].includes(estado);
}

export default function MedicoDashboard() {
  const navigate = useNavigate();

  const [citas, setCitas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargarDashboard = useCallback(async () => {
    setCargando(true);
    setError("");

    try {
      const resultado = await obtenerCitasMedico();

      if (!Array.isArray(resultado)) {
        throw new Error("No se pudo obtener una lista válida de citas.");
      }

      setCitas(resultado);
    } catch (err) {
      console.error("Error al cargar el dashboard médico:", err);
      setError(
        err?.message || "No fue posible cargar el resumen médico."
      );
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargarDashboard();
  }, [cargarDashboard]);

  const hoy = fechaLocalISO();

  const estadisticas = useMemo(() => {
    const citasHoy = citas.filter(
      (cita) => obtenerFecha(cita) === hoy
    );

    const pendientes = citas.filter(esPendiente);
    const completadasHoy = citasHoy.filter(esCompletada);

    const pacientesUnicos = new Set(
      citas
        .map((cita) => {
          return (
            cita?.paciente?.id ||
            cita?.paciente_id ||
            cita?.nombre_paciente ||
            null
          );
        })
        .filter(Boolean)
    );

    return {
      totalHoy: citasHoy.length,
      pendientes: pendientes.length,
      completadasHoy: completadasHoy.length,
      pacientes: pacientesUnicos.size,
    };
  }, [citas, hoy]);

  const proximasCitas = useMemo(() => {
    return citas
      .filter((cita) => {
        const fechaCita = obtenerFecha(cita);
        return fechaCita >= hoy && esPendiente(cita);
      })
      .sort((a, b) => {
        const fechaHoraA = `${obtenerFecha(a)} ${obtenerHora(a)}`;
        const fechaHoraB = `${obtenerFecha(b)} ${obtenerHora(b)}`;

        return fechaHoraA.localeCompare(fechaHoraB);
      })
      .slice(0, 5);
  }, [citas, hoy]);

  const citasRecientes = useMemo(() => {
    return [...citas]
      .sort((a, b) => {
        const fechaHoraA = `${obtenerFecha(a)} ${obtenerHora(a)}`;
        const fechaHoraB = `${obtenerFecha(b)} ${obtenerHora(b)}`;

        return fechaHoraB.localeCompare(fechaHoraA);
      })
      .slice(0, 5);
  }, [citas]);

  return (
    <main className="medico-dashboard">
      <header className="medico-dashboard__encabezado">
        <div>
          <span className="medico-dashboard__eyebrow">
            PANEL PROFESIONAL
          </span>

          <h1>Dashboard médico</h1>

          <p>
            Revisa tu actividad y organiza las próximas atenciones.
          </p>
        </div>

        <button
          type="button"
          className="medico-dashboard__actualizar"
          onClick={cargarDashboard}
          disabled={cargando}
        >
          <RefreshCw size={17} />
          Actualizar
        </button>
      </header>

      {cargando ? (
        <div className="medico-dashboard__carga">
          <EstadoCarga />
          <p>Cargando tu resumen...</p>
        </div>
      ) : error ? (
        <section className="medico-dashboard__error">
          <h2>No pudimos cargar el dashboard</h2>
          <p>{error}</p>
          <button type="button" onClick={cargarDashboard}>
            Intentar nuevamente
          </button>
        </section>
      ) : (
        <>
          <section className="medico-dashboard__bienvenida">
            <div className="medico-dashboard__bienvenida-texto">
              <span>RESUMEN DEL DÍA</span>
              <h2>Tu jornada médica</h2>
              <p>
                Aquí tienes un resumen de tus citas y de las atenciones
                que requieren seguimiento.
              </p>
            </div>

            <div className="medico-dashboard__fecha">
              <CalendarDays size={19} />
              <div>
                <small>Fecha de hoy</small>
                <strong>{formatearFecha(hoy)}</strong>
              </div>
            </div>
          </section>

          <section
            className="medico-dashboard__estadisticas"
            aria-label="Estadísticas médicas"
          >
            <TarjetaEstadistica
              titulo="Citas de hoy"
              valor={estadisticas.totalHoy}
              descripcion="Atenciones programadas"
              icono={<CalendarDays size={22} />}
              color="verde"
            />

            <TarjetaEstadistica
              titulo="Citas pendientes"
              valor={estadisticas.pendientes}
              descripcion="Por atender o confirmar"
              icono={<Clock3 size={22} />}
              color="coral"
            />

            <TarjetaEstadistica
              titulo="Completadas hoy"
              valor={estadisticas.completadasHoy}
              descripcion="Atenciones finalizadas"
              icono={<CheckCircle2 size={22} />}
              color="menta"
            />

            <TarjetaEstadistica
              titulo="Pacientes"
              valor={estadisticas.pacientes}
              descripcion="Pacientes identificados en tus citas"
              icono={<Users size={22} />}
              color="verde"
            />
          </section>

          <section className="medico-dashboard__accesos">
            <button
              type="button"
              className="medico-dashboard__acceso"
              onClick={() => navigate("/medico/agenda")}
            >
              <span className="medico-dashboard__acceso-icono">
                <CalendarDays size={21} />
              </span>
              <span>
                <strong>Mi agenda</strong>
                <small>Organiza tus citas</small>
              </span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="medico-dashboard__acceso"
              onClick={() => navigate("/medico/citas")}
            >
              <span className="medico-dashboard__acceso-icono">
                <ClipboardList size={21} />
              </span>
              <span>
                <strong>Mis citas</strong>
                <small>Consulta todas tus citas</small>
              </span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="medico-dashboard__acceso"
              onClick={() => navigate("/medico/consultas")}
            >
              <span className="medico-dashboard__acceso-icono">
                <FileText size={21} />
              </span>
              <span>
                <strong>Consultas</strong>
                <small>Revisa tus registros clínicos</small>
              </span>
              <ArrowRight size={18} />
            </button>

            <button
              type="button"
              className="medico-dashboard__acceso"
              onClick={() => navigate("/medico/pacientes")}
            >
              <span className="medico-dashboard__acceso-icono">
                <Users size={21} />
              </span>
              <span>
                <strong>Pacientes</strong>
                <small>Accede a tus pacientes</small>
              </span>
              <ArrowRight size={18} />
            </button>
          </section>

          <section className="medico-dashboard__columnas">
            <article className="medico-dashboard__panel">
              <div className="medico-dashboard__panel-cabecera">
                <div>
                  <h2>Próximas citas</h2>
                  <p>Atenciones pendientes desde hoy</p>
                </div>

                <button
                  type="button"
                  className="medico-dashboard__enlace"
                  onClick={() => navigate("/medico/agenda")}
                >
                  Ver agenda <ArrowRight size={15} />
                </button>
              </div>

              {proximasCitas.length === 0 ? (
                <div className="medico-dashboard__vacio">
                  <CalendarPlus size={27} />
                  <strong>No tienes citas pendientes</strong>
                  <p>Cuando tengas próximas atenciones, aparecerán aquí.</p>
                </div>
              ) : (
                <div className="medico-dashboard__lista">
                  {proximasCitas.map((cita) => (
                    <article
                      className="medico-dashboard__cita"
                      key={cita.id}
                    >
                      <div className="medico-dashboard__cita-fecha">
                        <CalendarDays size={18} />
                      </div>

                      <div className="medico-dashboard__cita-info">
                        <strong>{obtenerNombrePaciente(cita)}</strong>
                        <span>
                          {formatearFecha(obtenerFecha(cita))}
                          {obtenerHora(cita)
                            ? ` · ${obtenerHora(cita)}`
                            : ""}
                        </span>
                        <small>
                          {cita?.motivo ||
                            cita?.descripcion ||
                            "Sin motivo especificado"}
                        </small>
                      </div>

                      <button
                        type="button"
                        className="medico-dashboard__ver"
                        onClick={() =>
                          navigate(`/medico/citas/${cita.id}`)
                        }
                        aria-label={`Ver cita de ${obtenerNombrePaciente(cita)}`}
                      >
                        <ArrowRight size={18} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </article>

            <article className="medico-dashboard__panel">
              <div className="medico-dashboard__panel-cabecera">
                <div>
                  <h2>Actividad reciente</h2>
                  <p>Últimas citas de tu listado</p>
                </div>

                <button
                  type="button"
                  className="medico-dashboard__enlace"
                  onClick={() => navigate("/medico/citas")}
                >
                  Ver todas <ArrowRight size={15} />
                </button>
              </div>

              {citasRecientes.length === 0 ? (
                <div className="medico-dashboard__vacio">
                  <ClipboardList size={27} />
                  <strong>Aún no hay citas</strong>
                  <p>Tu actividad aparecerá aquí cuando existan citas.</p>
                </div>
              ) : (
                <div className="medico-dashboard__lista">
                  {citasRecientes.map((cita) => (
                    <article
                      className="medico-dashboard__cita"
                      key={cita.id}
                    >
                      <div className="medico-dashboard__cita-fecha">
                        <FileText size={18} />
                      </div>

                      <div className="medico-dashboard__cita-info">
                        <strong>{obtenerNombrePaciente(cita)}</strong>
                        <span>
                          {formatearFecha(obtenerFecha(cita))}
                          {obtenerHora(cita)
                            ? ` · ${obtenerHora(cita)}`
                            : ""}
                        </span>
                        <small>
                          {cita?.motivo ||
                            cita?.descripcion ||
                            "Cita médica"}
                        </small>
                      </div>

                      <div className="medico-dashboard__estado-cita">
                        <EstadoCita estado={cita.estado} />
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </article>
          </section>
        </>
      )}
    </main>
  );
}
