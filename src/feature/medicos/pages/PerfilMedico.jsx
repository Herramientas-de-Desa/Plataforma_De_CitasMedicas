import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';
import { authService } from '../../../core/services/authService';
import { medicosService } from '../services/medicosService';

import { getDoctorProfileImage } from '../../../core/services/cloudinaryService';

import './PerfilMedico.css';
import ConfiguracionMedica from '../../admin/components/ConfiguracionMedica';

const DIAS = [
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

const MAX_SIZE_FOTO = 5 * 1024 * 1024;

const FORMATOS_FOTO = [
  'image/jpeg',
  'image/png',
  'image/webp',
];

function Icono({ tipo, ...props }) {
  const trazos = {
    persona: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-2a8 8 0 0 1 16 0v2" />
      </>
    ),
    clinica: (
      <>
        <path d="M4 21V7h16v14M2 21h20M10 21v-5h4v5M12 3v8M8 7h8" />
        <path d="M7 12h1m8 0h1" />
      </>
    ),
    calendario: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 11h18M8 15h2m4 0h2M8 18h2" />
      </>
    ),
    flecha: <path d="M4 12h16m-6-6 6 6-6 6" />,
    reloj: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
    escudo: (
      <>
        <path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z" />
        <path d="m8 12 3 3 5-6" />
      </>
    ),
    camara: (
      <>
        <path d="M14 4h-4L8 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-4l-2-3Z" />
        <circle cx="12" cy="13" r="3" />
      </>
    ),
  };

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {trazos[tipo]}
    </svg>
  );
}

export default function PerfilMedico() {
  const { perfil, setPerfil } = useAuth();

  const [medico, setMedico] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorProfesional, setErrorProfesional] = useState(false);
  const [intento, setIntento] = useState(0);

  const [horarios, setHorarios] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [errorHorarios, setErrorHorarios] = useState(false);

  const [fotoFallida, setFotoFallida] = useState(false);
  const [archivoFoto, setArchivoFoto] = useState(null);
  const [vistaPreviaFoto, setVistaPreviaFoto] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [errorFoto, setErrorFoto] = useState('');
  const [mensajeFoto, setMensajeFoto] = useState('');

  const [nombres, setNombres] = useState(perfil.nombres || '');
  const [telefono, setTelefono] = useState(perfil.telefono || '');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [avisoConfiguracion, setAvisoConfiguracion] = useState('');
  const [errorGuardado, setErrorGuardado] = useState('');

  // ==========================================================
  // Cargar perfil profesional y horarios
  // ==========================================================

  useEffect(() => {
    let activo = true;

    setCargando(true);
    setErrorProfesional(false);
    setErrorHorarios(false);
    setCargandoHorarios(false);
    setFotoFallida(false);
    setMedico(null);
    setHorarios([]);

    async function cargar() {
      let registro;

      try {
        registro = await medicosService.obtenerPorUsuario(
          perfil.id_usuario
        );

        if (!activo) return;

        setMedico(registro);
      } catch {
        if (activo) setErrorProfesional(true);
      } finally {
        if (activo) setCargando(false);
      }

      if (!activo || !registro) return;

      setCargandoHorarios(true);

      try {
        const filas = await medicosService.obtenerHorarios(
          registro.id_medico
        );

        if (activo) setHorarios(filas || []);
      } catch {
        if (activo) setErrorHorarios(true);
      } finally {
        if (activo) setCargandoHorarios(false);
      }
    }

    cargar();

    return () => {
      activo = false;
    };
  }, [perfil.id_usuario, intento]);

  // ==========================================================
  // Vista previa de la imagen seleccionada
  // ==========================================================

  useEffect(() => {
    if (!archivoFoto) {
      setVistaPreviaFoto('');
      return undefined;
    }

    const url = URL.createObjectURL(archivoFoto);
    setVistaPreviaFoto(url);

    return () => URL.revokeObjectURL(url);
  }, [archivoFoto]);

  // ==========================================================
  // Datos derivados
  // ==========================================================

  const nombreProfesional =
    medico?.nombre || perfil.nombres || 'Mi perfil';

  const iniciales = nombreProfesional
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  const hayCambios =
    nombres !== (perfil.nombres || '') ||
    telefono !== (perfil.telefono || '');

  const fotoGuardada = medico?.foto_public_id
    ? getDoctorProfileImage(medico.foto_public_id)
    : medico?.foto_url;

  const fotoMostrar =
    vistaPreviaFoto || (!fotoFallida ? fotoGuardada : '');

  // ==========================================================
  // Datos de la cuenta
  // ==========================================================

  function limpiarAvisos() {
    setMensaje('');
    setErrorGuardado('');
  }

  function descartar() {
    setNombres(perfil.nombres || '');
    setTelefono(perfil.telefono || '');
    limpiarAvisos();
  }

  async function guardar(evento) {
    evento.preventDefault();

    if (guardando || !hayCambios) return;

    limpiarAvisos();

    if (!nombres.trim()) {
      setErrorGuardado('Escribe tu nombre para guardar los cambios.');
      return;
    }

    setGuardando(true);

    try {
      const actualizado = await authService.actualizarPerfil(
        perfil.id_usuario,
        {
          nombres: nombres.trim(),
          telefono: telefono.trim(),
        }
      );

      setPerfil(actualizado);
      setNombres(actualizado.nombres || '');
      setTelefono(actualizado.telefono || '');
      setMensaje('Tus datos de cuenta se guardaron correctamente.');
    } catch (error) {
      setErrorGuardado(
        error?.message ||
          'No pudimos guardar tus datos. Inténtalo nuevamente.'
      );
    } finally {
      setGuardando(false);
    }
  }

  // ==========================================================
  // Selección y validación de la foto
  // ==========================================================

  function seleccionarFoto(evento) {
    const archivo = evento.target.files?.[0];

    // Permite seleccionar de nuevo el mismo archivo.
    evento.target.value = '';

    if (!archivo) return;

    setErrorFoto('');
    setMensajeFoto('');

    if (!FORMATOS_FOTO.includes(archivo.type)) {
      setArchivoFoto(null);
      setErrorFoto('Formato no permitido. Usa JPG, PNG o WEBP.');
      return;
    }

    if (archivo.size > MAX_SIZE_FOTO) {
      setArchivoFoto(null);
      setErrorFoto('La imagen no puede superar los 5 MB.');
      return;
    }

    setArchivoFoto(archivo);
    setFotoFallida(false);
  }

  function cancelarCambioFoto() {
    if (subiendoFoto) return;

    setArchivoFoto(null);
    setErrorFoto('');
    setMensajeFoto('');
  }

  // ==========================================================
  // Subir foto a Cloudinary y guardar referencias en Supabase
  // ==========================================================

  async function subirFoto() {
    if (!archivoFoto || !medico?.id_medico || subiendoFoto) {
      return;
    }

    setSubiendoFoto(true);
    setErrorFoto('');
    setMensajeFoto('');

    try {
      // Este método realiza las dos operaciones:
      // 1. Sube el archivo a Cloudinary.
      // 2. Actualiza foto_url, foto_public_id y foto_version en Supabase.
      const medicoActualizado = await medicosService.subirFoto(
        medico.id_medico,
        archivoFoto
      );

      // Actualiza la interfaz con los datos persistidos.
      setMedico((actual) => ({
        ...actual,
        ...medicoActualizado,
      }));

      setArchivoFoto(null);
      setFotoFallida(false);

      setMensajeFoto('Tu foto de perfil se guardó correctamente.');
    } catch (error) {
      setErrorFoto(
        error?.message ||
          'No se pudo guardar la foto. Inténtalo nuevamente.'
      );
    } finally {
      setSubiendoFoto(false);
    }
  }

  const reintentar = () => setIntento((valor) => valor + 1);

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <main className="contenedor medico-perfil">
      <header className="mp-encabezado">
        <div>
          <p className="etiqueta-seccion">Mi cuenta · Médico</p>
          <h1>Mi perfil profesional</h1>
          <p>Tu información y tus horarios, en un solo lugar.</p>
        </div>

        {medico && (
          <Link className="boton mp-boton-agenda" to="/panel-medico">
            <Icono tipo="calendario" />
            Ver mi agenda
            <Icono tipo="flecha" />
          </Link>
        )}
      </header>

      <section
        className="mp-identidad"
        aria-label="Identidad profesional"
        aria-busy={cargando}
      >
        <div className="mp-avatar-bloque">
          <div className="mp-avatar">
            {fotoMostrar ? (
              <img
                key={fotoMostrar}
                src={fotoMostrar}
                alt={`Foto de ${nombreProfesional}`}
                onError={() => setFotoFallida(true)}
              />
            ) : (
              <span aria-hidden="true">{iniciales}</span>
            )}
          </div>

          {medico && (
            <div className="mp-foto-controles">
              <label
                className="boton boton-secundario boton-mini mp-foto-label"
                htmlFor="mp-foto-input"
              >
                <Icono tipo="camara" width="16" height="16" />
                {archivoFoto ? 'Elegir otra foto' : 'Cambiar foto'}
              </label>

              <input
                id="mp-foto-input"
                className="mp-foto-input"
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={seleccionarFoto}
                disabled={subiendoFoto}
                aria-describedby="mp-foto-ayuda"
              />

              <p id="mp-foto-ayuda" className="mp-ayuda">
                JPG, PNG o WEBP. Máximo 5 MB.
              </p>

              {archivoFoto && (
                <div className="mp-foto-acciones">
                  <button
                    type="button"
                    className="boton boton-mini"
                    onClick={subirFoto}
                    disabled={subiendoFoto}
                  >
                    {subiendoFoto ? 'Guardando foto…' : 'Guardar foto'}
                  </button>

                  <button
                    type="button"
                    className="boton boton-secundario boton-mini"
                    onClick={cancelarCambioFoto}
                    disabled={subiendoFoto}
                  >
                    Cancelar
                  </button>
                </div>
              )}

              {errorFoto && (
                <p className="alerta alerta-error" role="alert">
                  {errorFoto}
                </p>
              )}

              {mensajeFoto && (
                <p className="alerta alerta-exito" role="status">
                  {mensajeFoto}
                </p>
              )}
            </div>
          )}
        </div>

        <div className="mp-identidad-texto">
          <span className="mp-insignia">
            <Icono tipo="persona" width="15" height="15" />
            Cuenta de médico
          </span>

          <h2>{nombreProfesional}</h2>

          <p>
            {cargando
              ? 'Cargando información profesional…'
              : errorProfesional
                ? 'Información profesional no disponible'
                : medico?.especialidad?.nombre ||
                  'Especialidad pendiente de asignación'}
          </p>

          {medico?.clinica?.nombre && (
            <p className="mp-clinica-nombre">
              <Icono tipo="clinica" width="17" height="17" />
              {medico.clinica.nombre}
            </p>
          )}
        </div>

        {medico && (
          <div
            className={`mp-disponibilidad ${
              medico.disponible ? 'mp-disponible' : ''
            }`}
          >
            <span aria-hidden="true" />
            {medico.disponible
              ? 'Disponible para citas'
              : 'No disponible para citas'}
          </div>
        )}
      </section>

      {!cargando && errorProfesional && (
        <div className="mp-aviso" role="alert">
          <p>No pudimos consultar tu información profesional.</p>
          <button
            type="button"
            className="boton boton-secundario"
            onClick={reintentar}
          >
            Reintentar
          </button>
        </div>
      )}

      {!cargando && !errorProfesional && !medico && (
        <p className="mp-aviso" role="status">
          El administrador debe asignarte una clínica, especialidad y horarios
          antes de que puedas gestionar tu atención.
        </p>
      )}

      {avisoConfiguracion && (
        <p className="alerta alerta-exito" role="status">
          {avisoConfiguracion}
        </p>
      )}

      {!cargando &&
        !cargandoHorarios &&
        !errorProfesional &&
        !errorHorarios &&
        medico && (
          <ConfiguracionMedica
            key={intento}
            medico={medico}
            horarios={horarios}
            nombreCuenta={perfil.nombres}
            onGuardado={() => {
              setAvisoConfiguracion(
                'Tu atención y horarios se guardaron. Ya puedes consultar tu agenda.'
              );
              reintentar();
            }}
          />
        )}

      <div className="mp-grid">
        <div className="mp-columna">
          <section
            className="tarjeta mp-panel"
            aria-labelledby="mp-profesional-titulo"
          >
            <div className="mp-titulo">
              <span className="mp-icono">
                <Icono tipo="clinica" />
              </span>
              <div>
                <h2 id="mp-profesional-titulo">
                  Información profesional
                </h2>
                <p>Así se identifica tu atención médica.</p>
              </div>
            </div>

            {cargando ? (
              <p className="mp-carga" role="status">
                Consultando tu registro…
              </p>
            ) : medico ? (
              <>
                <dl className="mp-detalles">
                  <div>
                    <dt>Nombre profesional</dt>
                    <dd>{medico.nombre}</dd>
                  </div>
                  <div>
                    <dt>Especialidad</dt>
                    <dd>{medico.especialidad?.nombre || 'Sin asignar'}</dd>
                  </div>
                  <div>
                    <dt>Clínica</dt>
                    <dd>{medico.clinica?.nombre || 'Sin asignar'}</dd>
                  </div>
                  <div>
                    <dt>Dirección de atención</dt>
                    <dd>{medico.clinica?.direccion || 'No registrada'}</dd>
                  </div>
                  <div>
                    <dt>Teléfono de atención</dt>
                    <dd>{medico.telefono || 'No registrado'}</dd>
                  </div>
                </dl>

                <p className="mp-nota">
                  <Icono tipo="escudo" width="18" height="18" />
                  <span>
                    Puedes actualizar tus datos profesionales y turnos desde
                    la configuración de atención.
                  </span>
                </p>
              </>
            ) : (
              <p className="mp-vacio">
                {errorProfesional
                  ? 'La información no está disponible en este momento.'
                  : 'El administrador aún no ha configurado tu perfil profesional.'}
              </p>
            )}
          </section>

          <section
            className="tarjeta mp-panel"
            aria-labelledby="mp-horarios-titulo"
          >
            <div className="mp-titulo">
              <span className="mp-icono">
                <Icono tipo="reloj" />
              </span>
              <div>
                <h2 id="mp-horarios-titulo">Horarios de atención</h2>
                <p>Tu disponibilidad semanal registrada.</p>
              </div>
            </div>

            {cargando || cargandoHorarios ? (
              <p className="mp-carga" role="status">
                Consultando horarios…
              </p>
            ) : errorHorarios ? (
              <div className="mp-vacio" role="alert">
                <p>No pudimos consultar tus horarios.</p>
                <button
                  className="boton boton-secundario boton-mini"
                  type="button"
                  onClick={reintentar}
                >
                  Reintentar
                </button>
              </div>
            ) : !medico || horarios.length === 0 ? (
              <div className="mp-vacio">
                <p>
                  {!medico
                    ? 'Tus horarios estarán disponibles cuando el administrador los asigne.'
                    : 'Aún no tienes horarios asignados.'}
                </p>
                {medico && (
                  <p>Agrega tus turnos desde la configuración de atención.</p>
                )}
              </div>
            ) : (
              <>
                <dl className="mp-horarios">
                  {DIAS.map((dia, indice) => {
                    const bloques = horarios.filter(
                      (horario) =>
                        Number(horario.dia_semana) === indice + 1
                    );

                    return (
                      <div
                        key={dia}
                        className={bloques.length ? '' : 'mp-dia-libre'}
                      >
                        <dt>{dia}</dt>
                        <dd>
                          {bloques.length
                            ? bloques.map((horario, i) => (
                                <span
                                  key={
                                    horario.id_horario ??
                                    `${horario.dia_semana}-${horario.hora_inicio}-${i}`
                                  }
                                >
                                  {horario.hora_inicio.slice(0, 5)} –{' '}
                                  {horario.hora_fin.slice(0, 5)}
                                </span>
                              ))
                            : 'Sin atención'}
                        </dd>
                      </div>
                    );
                  })}
                </dl>

                <p className="mp-pie-horarios">
                  Estos son horarios de atención; consulta tu agenda para ver
                  las citas reservadas.
                </p>
              </>
            )}
          </section>
        </div>

        <div className="mp-columna">
          <section
            className="tarjeta mp-panel"
            aria-labelledby="mp-cuenta-titulo"
          >
            <div className="mp-titulo">
              <span className="mp-icono">
                <Icono tipo="persona" />
              </span>
              <div>
                <h2 id="mp-cuenta-titulo">Datos de mi cuenta</h2>
                <p>Mantén tu información de contacto al día.</p>
              </div>
            </div>

            <form
              className="mp-formulario"
              onSubmit={guardar}
              aria-busy={guardando}
            >
              <label htmlFor="mp-nombres">
                Nombres de la cuenta
                <input
                  id="mp-nombres"
                  autoComplete="name"
                  required
                  maxLength={150}
                  value={nombres}
                  disabled={guardando}
                  onChange={(e) => {
                    setNombres(e.target.value);
                    limpiarAvisos();
                  }}
                />
              </label>

              <label htmlFor="mp-telefono">
                Teléfono personal{' '}
                <span className="mp-opcional">Opcional</span>
                <input
                  id="mp-telefono"
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel"
                  maxLength={30}
                  placeholder="Ej. 956 000 111"
                  value={telefono}
                  disabled={guardando}
                  aria-describedby="mp-telefono-ayuda"
                  onChange={(e) => {
                    setTelefono(e.target.value);
                    limpiarAvisos();
                  }}
                />
              </label>

              <p id="mp-telefono-ayuda" className="mp-ayuda">
                Este número pertenece a tu cuenta. El teléfono de atención se
                muestra en la información profesional.
              </p>

              <div className="mp-correo">
                <span>Correo de acceso</span>
                <strong>{perfil.correo}</strong>
                <small>
                  Tu correo y tu rol no se modifican desde esta pantalla.
                </small>
              </div>

              <div aria-live="polite">
                {mensaje && <p className="alerta alerta-exito">{mensaje}</p>}
                {!mensaje && hayCambios && !errorGuardado && (
                  <p className="mp-pendiente">Tienes cambios sin guardar.</p>
                )}
              </div>

              {errorGuardado && (
                <p className="alerta alerta-error" role="alert">
                  {errorGuardado}
                </p>
              )}

              <div className="mp-acciones">
                <button
                  type="submit"
                  className="boton"
                  disabled={!hayCambios || guardando}
                >
                  {guardando ? 'Guardando…' : 'Guardar cambios'}
                </button>

                <button
                  type="button"
                  className="boton boton-secundario"
                  disabled={!hayCambios || guardando}
                  onClick={descartar}
                >
                  Descartar
                </button>
              </div>
            </form>
          </section>

          <aside className="mp-ayuda-agenda">
            <Icono tipo="calendario" width="30" height="30" />
            <h2>Tu día de atención</h2>
            <p>Consulta tus citas y actualiza su estado desde tu agenda.</p>

            {medico ? (
              <Link to="/panel-medico">
                Ir a mi agenda <Icono tipo="flecha" width="18" height="18" />
              </Link>
            ) : (
              <p>Estará disponible cuando guardes tu perfil profesional.</p>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
