import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import EstadoCita from "../../components/medico/EstadoCita";
import EstadoCarga from "../../components/medico/EstadoCarga";

import { obtenerCitasMedico } from "../../services/citasService";

import "./Medico.css";

function formatearFecha(fecha) {
  if (!fecha) return "No especificada";

  const valor = String(fecha).slice(0, 10);
  const partes = valor.split("-");

  if (partes.length !== 3) return fecha;

  const [anio, mes, dia] = partes;
  const fechaLocal = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia)
  );

  if (Number.isNaN(fechaLocal.getTime())) return fecha;

  return new Intl.DateTimeFormat("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(fechaLocal);
}

function obtenerNombrePaciente(cita) {
  return (
    cita?.paciente?.nombre_completo ||
    cita?.paciente?.nombre ||
    cita?.nombre_paciente ||
    "Paciente"
  );
}

function obtenerInicial(nombre) {
  return nombre.trim().charAt(0).toUpperCase() || "P";
}

function CampoDetalle({ etiqueta, children }) {
  return (
    <div className="detalle-campo">
      <span className="detalle-etiqueta">{etiqueta}</span>
      <div className="detalle-valor">{children || "No especificado"}</div>
    </div>
  );
}

export default function MedicoCitasDetalles() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [cita, setCita] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    async function cargarDetalle() {
      setCargando(true);
      setError("");
      setCita(null);

      try {
        // Adaptar si tu servicio permite consultar una cita por ID.
        const resultado = await obtenerCitasMedico();

        const lista = Array.isArray(resultado) ? resultado : [];
        const encontrada = lista.find(
          (elemento) => String(elemento.id) === String(id)
        );

        if (!encontrada) {
          throw new Error(
            "No se encontró la cita o no tienes permiso para consultarla."
          );
        }

        if (activo) setCita(encontrada);
      } catch (err) {
        if (activo) {
          setError(
            err?.message || "No fue posible cargar el detalle de la cita."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    }

    if (id) cargarDetalle();

    return () => {
      activo = false;
    };
  }, [id]);

  if (cargando) {
    return (
      <EstadoCarga
        mensaje="Cargando detalle de la cita..."
        pantallaCompleta
      />
    );
  }

  if (error || !cita) {
    return (
      <section className="medico-detalle">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate("/medico/citas")}
        >
          ← Volver a mis citas
        </button>

        <div className="detalle-mensaje-error" role="alert">
          <h2>No se pudo abrir la cita</h2>
          <p>{error || "La cita solicitada no está disponible."}</p>

          <button
            type="button"
            className="btn-primary"
            onClick={() => navigate("/medico/citas")}
          >
            Volver a la agenda
          </button>
        </div>
      </section>
    );
  }

  const nombre = obtenerNombrePaciente(cita);
  const inicial = obtenerInicial(nombre);
  const estado = String(cita.estado || "").toLowerCase();

  const citaFinalizada = [
    "completada",
    "atendida",
    "cancelada",
    "no asistió",
    "no asistio",
  ].includes(estado);

  return (
    <section className="medico-detalle">
      <div className="detalle-navegacion">
        <button
          type="button"
          className="detalle-volver"
          onClick={() => navigate("/medico/citas")}
        >
          ← Volver a mis citas
        </button>

        <span className="detalle-breadcrumb">
          Panel médico / Citas / Detalle
        </span>
      </div>

      <header className="detalle-header">
        <div>
          <span className="medico-citas-eyebrow">
            INFORMACIÓN DE LA ATENCIÓN
          </span>

          <h1>Detalle de la cita</h1>

          <p>Revisa la información antes de atender al paciente.</p>
        </div>

        <EstadoCita estado={cita.estado} />
      </header>

      <div className="detalle-grid">
        <article className="detalle-panel detalle-paciente">
          <div className="detalle-panel-heading">
            <h2>Información del paciente</h2>
          </div>

          <div className="detalle-paciente-perfil">
            {cita.paciente?.avatar_url ? (
              <img
                src={cita.paciente.avatar_url}
                alt={`Foto de ${nombre}`}
                className="detalle-avatar"
              />
            ) : (
              <div className="detalle-avatar detalle-avatar-fallback">
                {inicial}
              </div>
            )}

            <div>
              <h3>{nombre}</h3>
              <p>Paciente</p>
            </div>
          </div>

          <div className="detalle-datos">
            <CampoDetalle etiqueta="Correo electrónico">
              {cita.paciente?.correo ||
                cita.paciente?.email ||
                cita.correo_paciente}
            </CampoDetalle>

            <CampoDetalle etiqueta="Teléfono">
              {cita.paciente?.telefono || cita.telefono_paciente}
            </CampoDetalle>

            <CampoDetalle etiqueta="Identificador de la cita">
              {cita.id}
            </CampoDetalle>
          </div>
        </article>

        <article className="detalle-panel">
          <div className="detalle-panel-heading">
            <h2>Información de la cita</h2>
          </div>

          <div className="detalle-datos">
            <CampoDetalle etiqueta="Fecha">
              {formatearFecha(cita.fecha)}
            </CampoDetalle>

            <CampoDetalle etiqueta="Hora">
              {cita.hora || cita.hora_inicio || cita.hora_cita}
            </CampoDetalle>

            <CampoDetalle etiqueta="Estado">
              <EstadoCita estado={cita.estado} />
            </CampoDetalle>

            <CampoDetalle etiqueta="Especialidad">
              {cita.especialidad?.nombre ||
                cita.especialidad_nombre ||
                cita.especialidad}
            </CampoDetalle>

            <CampoDetalle etiqueta="Clínica">
              {cita.clinica?.nombre ||
                cita.clinica_nombre ||
                cita.clinica}
            </CampoDetalle>

            <CampoDetalle etiqueta="Motivo de consulta">
              {cita.motivo || cita.descripcion}
            </CampoDetalle>
          </div>
        </article>

        <article className="detalle-panel detalle-observaciones">
          <div className="detalle-panel-heading">
            <h2>Observaciones de la cita</h2>
          </div>

          <p className="detalle-observaciones-texto">
            {cita.observaciones ||
              "No hay observaciones registradas para esta cita."}
          </p>
        </article>
      </div>

      <div className="detalle-acciones">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => navigate("/medico/citas")}
        >
          Volver a mis citas
        </button>

        {!citaFinalizada && (
          <button
            type="button"
            className="btn-primary"
            onClick={() =>
              navigate(`/medico/citas/${cita.id}/consulta`)
            }
          >
            Registrar consulta →
          </button>
        )}
      </div>
    </section>
  );
}
