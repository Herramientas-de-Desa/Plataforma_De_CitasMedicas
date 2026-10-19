import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  UserRound,
  Mail,
  Phone,
  MapPin,
  Stethoscope,
  IdCard,
  Save,
  Pencil,
  RefreshCw,
  Camera,
  ShieldCheck,
  Building2,
  BadgeCheck,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import "./Medico.css";

const perfilInicial = {
  nombre_completo: "",
  email: "",
  telefono: "",
  documento: "",
  especialidad: "",
  numero_colegiatura: "",
  clinica: "",
  direccion_consultorio: "",
  biografia: "",
  avatar_url: "",
};

function normalizarPerfil(medico = {}) {
  return {
    nombre_completo:
      medico.nombre_completo || medico.nombre || "",
    email: medico.email || medico.correo || "",
    telefono: medico.telefono || medico.celular || "",
    documento:
      medico.numero_documento || medico.documento || medico.dni || "",
    especialidad:
      medico.especialidad_nombre ||
      medico.especialidad?.nombre ||
      medico.especialidad ||
      "",
    numero_colegiatura:
      medico.numero_colegiatura || medico.colegiatura || "",
    clinica:
      medico.clinica_nombre ||
      medico.clinica?.nombre ||
      medico.clinica ||
      "",
    direccion_consultorio:
      medico.direccion_consultorio || medico.direccion || "",
    biografia: medico.biografia || medico.descripcion || "",
    avatar_url: medico.avatar_url || medico.foto_url || "",
  };
}

export default function MedicoPerfil() {
  const navigate = useNavigate();
  const location = useLocation();

  // Permite recibir el perfil desde la navegación, si está disponible.
  // Conecta este estado con tu servicio real de médicos para cargar
  // y guardar los datos en Supabase.
  const medicoInicial =
    location.state?.medico ||
    location.state?.usuario ||
    null;

  const [perfil, setPerfil] = useState(() =>
    normalizarPerfil(medicoInicial || perfilInicial)
  );
  const [formulario, setFormulario] = useState(perfil);
  const [editando, setEditando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    if (medicoInicial) {
      const datos = normalizarPerfil(medicoInicial);
      setPerfil(datos);
      setFormulario(datos);
    }
  }, [location.state]);

  const cambiarCampo = (event) => {
    const { name, value } = event.target;
    setFormulario((actual) => ({ ...actual, [name]: value }));
  };

  const cancelarEdicion = () => {
    setFormulario(perfil);
    setEditando(false);
    setMensaje(null);
  };

  const guardarPerfil = async (event) => {
    event.preventDefault();
    setMensaje(null);

    // Importante: la actualización es solo local hasta conectar
    // esta función con el método de actualización de medicosService.js.
    setGuardando(true);

    try {
      setPerfil({ ...formulario });
      setEditando(false);
      setMensaje({
        tipo: "aviso",
        texto:
          "Los cambios se muestran en esta pantalla, pero aún no se han guardado en Supabase. Conecta aquí tu servicio de actualización de médicos.",
      });
    } catch (error) {
      console.error("Error al actualizar el perfil:", error);
      setMensaje({
        tipo: "error",
        texto: "No se pudieron procesar los cambios.",
      });
    } finally {
      setGuardando(false);
    }
  };

  const iniciales = perfil.nombre_completo
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase() || "ME";

  return (
    <main className="medico-perfil">
      <div className="medico-perfil__barra">
        <button
          type="button"
          className="medico-perfil__volver"
          onClick={() => navigate("/medico")}
        >
          <ArrowLeft size={17} />
          Volver al panel
        </button>

        {!editando ? (
          <button
            type="button"
            className="medico-perfil__boton-principal"
            onClick={() => {
              setFormulario(perfil);
              setEditando(true);
              setMensaje(null);
            }}
          >
            <Pencil size={16} />
            Editar perfil
          </button>
        ) : (
          <button
            type="button"
            className="medico-perfil__boton-secundario"
            onClick={cancelarEdicion}
          >
            Cancelar
          </button>
        )}
      </div>

      <header className="medico-perfil__encabezado">
        <div className="medico-perfil__icono-titulo">
          <UserRound size={26} />
        </div>
        <div>
          <span className="medico-perfil__eyebrow">CUENTA PROFESIONAL</span>
          <h1>Mi perfil médico</h1>
          <p>
            Consulta y administra tu información personal y profesional.
          </p>
        </div>
      </header>

      {mensaje && (
        <div
          className={`medico-perfil__mensaje medico-perfil__mensaje--${mensaje.tipo}`}
          role="status"
        >
          {mensaje.tipo === "error" ? (
            <AlertCircle size={19} />
          ) : (
            <CheckCircle2 size={19} />
          )}
          <p>{mensaje.texto}</p>
        </div>
      )}

      <section className="medico-perfil__resumen">
        <div className="medico-perfil__avatar">
          {perfil.avatar_url ? (
            <img src={perfil.avatar_url} alt={`Foto de ${perfil.nombre_completo}`} />
          ) : (
            <span>{iniciales}</span>
          )}
          <div className="medico-perfil__avatar-icono">
            <Stethoscope size={19} />
          </div>
        </div>

        <div className="medico-perfil__identidad">
          <h2>{perfil.nombre_completo || "Nombre del médico"}</h2>
          <p>
            {perfil.especialidad || "Especialidad no especificada"}
          </p>
          <span className="medico-perfil__estado">
            <ShieldCheck size={15} />
            Área médica
          </span>
        </div>

        <div className="medico-perfil__resumen-acciones">
          {editando && (
            <span className="medico-perfil__editando">
              <Pencil size={14} />
              Editando información
            </span>
          )}
        </div>
      </section>

      <form onSubmit={guardarPerfil} className="medico-perfil__formulario">
        <section className="medico-perfil__seccion">
          <div className="medico-perfil__seccion-titulo">
            <div className="medico-perfil__seccion-icono">
              <UserRound size={19} />
            </div>
            <div>
              <h2>Información personal</h2>
              <p>Datos básicos de identificación y contacto.</p>
            </div>
          </div>

          <div className="medico-perfil__campos">
            <label className="medico-perfil__campo">
              <span>Nombre completo</span>
              <div className="medico-perfil__input-con-icono">
                <UserRound size={17} />
                <input
                  name="nombre_completo"
                  value={formulario.nombre_completo}
                  onChange={cambiarCampo}
                  placeholder="Nombre y apellidos"
                  disabled={!editando}
                  required
                />
              </div>
            </label>

            <label className="medico-perfil__campo">
              <span>Correo electrónico</span>
              <div className="medico-perfil__input-con-icono">
                <Mail size={17} />
                <input
                  type="email"
                  name="email"
                  value={formulario.email}
                  onChange={cambiarCampo}
                  placeholder="doctor@correo.com"
                  disabled={!editando}
                />
              </div>
            </label>

            <label className="medico-perfil__campo">
              <span>Teléfono de contacto</span>
              <div className="medico-perfil__input-con-icono">
                <Phone size={17} />
                <input
                  type="tel"
                  name="telefono"
                  value={formulario.telefono}
                  onChange={cambiarCampo}
                  placeholder="Número de contacto"
                  disabled={!editando}
                />
              </div>
            </label>

            <label className="medico-perfil__campo">
              <span>Documento de identidad</span>
              <div className="medico-perfil__input-con-icono">
                <IdCard size={17} />
                <input
                  name="documento"
                  value={formulario.documento}
                  onChange={cambiarCampo}
                  placeholder="Número de documento"
                  disabled={!editando}
                />
              </div>
            </label>
          </div>
        </section>

        <section className="medico-perfil__seccion">
          <div className="medico-perfil__seccion-titulo">
            <div className="medico-perfil__seccion-icono">
              <Stethoscope size={19} />
            </div>
            <div>
              <h2>Información profesional</h2>
              <p>Datos de tu especialidad y acreditación profesional.</p>
            </div>
          </div>

          <div className="medico-perfil__campos">
            <label className="medico-perfil__campo">
              <span>Especialidad</span>
              <div className="medico-perfil__input-con-icono">
                <Stethoscope size={17} />
                <input
                  name="especialidad"
                  value={formulario.especialidad}
                  onChange={cambiarCampo}
                  placeholder="Ej. Medicina general"
                  disabled={!editando}
                />
              </div>
            </label>

            <label className="medico-perfil__campo">
              <span>Número de colegiatura</span>
              <div className="medico-perfil__input-con-icono">
                <BadgeCheck size={17} />
                <input
                  name="numero_colegiatura"
                  value={formulario.numero_colegiatura}
                  onChange={cambiarCampo}
                  placeholder="Número de colegiatura"
                  disabled={!editando}
                />
              </div>
            </label>
          </div>
        </section>

        <section className="medico-perfil__seccion">
          <div className="medico-perfil__seccion-titulo">
            <div className="medico-perfil__seccion-icono">
              <Building2 size={19} />
            </div>
            <div>
              <h2>Consultorio y clínica</h2>
              <p>Información del lugar donde brindas atención.</p>
            </div>
          </div>

          <div className="medico-perfil__campos">
            <label className="medico-perfil__campo">
              <span>Clínica o centro médico</span>
              <div className="medico-perfil__input-con-icono">
                <Building2 size={17} />
                <input
                  name="clinica"
                  value={formulario.clinica}
                  onChange={cambiarCampo}
                  placeholder="Nombre de la clínica"
                  disabled={!editando}
                />
              </div>
            </label>

            <label className="medico-perfil__campo">
              <span>Dirección del consultorio</span>
              <div className="medico-perfil__input-con-icono">
                <MapPin size={17} />
                <input
                  name="direccion_consultorio"
                  value={formulario.direccion_consultorio}
                  onChange={cambiarCampo}
                  placeholder="Dirección"
                  disabled={!editando}
                />
              </div>
            </label>

            <label className="medico-perfil__campo medico-perfil__campo--completo">
              <span>Presentación profesional</span>
              <textarea
                name="biografia"
                value={formulario.biografia}
                onChange={cambiarCampo}
                placeholder="Describe tu experiencia, formación y enfoque de atención."
                rows={4}
                disabled={!editando}
              />
            </label>
          </div>
        </section>

        {editando && (
          <div className="medico-perfil__pie-formulario">
            <p>
              <AlertCircle size={15} />
              Revisa tus datos antes de confirmar los cambios.
            </p>

            <button
              type="submit"
              className="medico-perfil__boton-principal"
              disabled={guardando}
            >
              {guardando ? (
                <RefreshCw size={16} className="medico-perfil__girando" />
              ) : (
                <Save size={16} />
              )}
              {guardando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        )}
      </form>

      <footer className="medico-perfil__nota">
        <ShieldCheck size={18} />
        <p>
          Mantén actualizada tu información profesional. Los cambios
          definitivos deben guardarse mediante el servicio autorizado de la
          aplicación.
        </p>
      </footer>
    </main>
  );
}
