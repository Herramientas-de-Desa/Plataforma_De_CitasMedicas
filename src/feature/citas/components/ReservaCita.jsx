// Componente: reserva de cita (RF04 + RF05).
// Reutiliza medicosService y citasService.
// Incluye imagen del médico y fallback si no existe o no carga.

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';
import { medicosService } from '../../medicos/services/medicosService';
import { citasService } from '../services/citasService';

const DIAS = [
  '',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo',
];

function fechaActualEnIca() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
      .formatToParts(new Date())
      .map(({ type, value }) => [type, value]),
  );

  return `${partes.year}-${partes.month}-${partes.day}`;
}

export default function ReservaCita({
  medicoIdProp,
  fechaInicial = '',
  enModal = false,
}) {
  const { idMedico: idMedicoRuta } = useParams();
  const idMedico = medicoIdProp || idMedicoRuta;

  const { perfil, cargando: cargandoPerfil } = useAuth();
  const navegar = useNavigate();
  const temporizador = useRef(null);

  const hoy = useMemo(fechaActualEnIca, []);

  const fechaDeInicio =
    /^\d{4}-\d{2}-\d{2}$/.test(fechaInicial) && fechaInicial >= hoy
      ? fechaInicial
      : hoy;

  const [medico, setMedico] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [fecha, setFecha] = useState(fechaDeInicio);
  const [horas, setHoras] = useState([]);
  const [horaElegida, setHoraElegida] = useState('');
  const [cargandoHoras, setCargandoHoras] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [reservando, setReservando] = useState(false);
  const [imagenError, setImagenError] = useState(false);

  // Admite varios nombres habituales para el campo de fotografía.
  const imagenMedico =
    medico?.foto_url ||
    medico?.imagen_url ||
    medico?.avatar_url ||
    medico?.url_foto ||
    medico?.foto ||
    medico?.imagen ||
    medico?.image_url ||
    '';

  // Limpiar temporizador al desmontar el componente.
  useEffect(
    () => () => clearTimeout(temporizador.current),
    [],
  );

  // Cargar información y horarios del médico.
  useEffect(() => {
    let activo = true;

    setMedico(null);
    setHorarios([]);
    setError('');
    setImagenError(false);

    medicosService
      .obtenerPorId(idMedico)
      .then((datos) => {
        if (activo) setMedico(datos);
      })
      .catch((e) => {
        if (activo) {
          setError(e.message || 'No se pudo cargar la información del médico.');
        }
      });

    medicosService
      .obtenerHorarios(idMedico)
      .then((datos) => {
        if (activo) setHorarios(datos);
      })
      .catch(() => {
        if (activo) setHorarios([]);
      });

    return () => {
      activo = false;
    };
  }, [idMedico]);

  // Consultar los horarios disponibles para la fecha seleccionada.
  useEffect(() => {
    let activo = true;

    setHoraElegida('');
    setHoras([]);
    setCargandoHoras(true);
    setError('');

    if (!fecha) {
      setCargandoHoras(false);
      return undefined;
    }

    citasService
      .horasDisponibles(idMedico, fecha)
      .then((libres) => {
        if (activo) setHoras(libres);
      })
      .catch((e) => {
        if (activo) {
          setError(e.message || 'No se pudieron consultar los horarios.');
        }
      })
      .finally(() => {
        if (activo) setCargandoHoras(false);
      });

    return () => {
      activo = false;
    };
  }, [idMedico, fecha]);

  // Reservar la cita seleccionada.
  async function reservar() {
    setError('');
    setExito('');

    if (!horaElegida) {
      setError('Selecciona una hora disponible.');
      return;
    }

    if (!perfil) {
      const regreso = new URLSearchParams({
        reservar: String(idMedico),
        fecha,
      });

      navegar('/login', {
        state: {
          returnTo: `/especialistas?${regreso}`,
        },
      });

      return;
    }

    setReservando(true);

    try {
      await citasService.reservar({
        pacienteId: perfil.id_usuario,
        medicoId: Number(idMedico),
        fecha,
        hora: horaElegida,
      });

      setExito(`Cita reservada para el ${fecha} a las ${horaElegida}.`);

      temporizador.current = setTimeout(() => {
        navegar('/mis-citas');
      }, 1200);
    } catch (e) {
      setError(e.message || 'No se pudo reservar la cita.');
    } finally {
      setReservando(false);
    }
  }

  if (!medico) {
    return (
      <p className={enModal ? 'reserva-cargando' : 'contenedor'}>
        {error || 'Cargando médico…'}
      </p>
    );
  }

  return (
    <div
      className={
        enModal
          ? 'reserva-contenido reserva-contenido-modal'
          : 'contenedor reserva-contenido'
      }
    >
      {/* Encabezado con fotografía e información del médico */}
      <div className="encabezado reserva-encabezado">
        <p className="etiqueta-seccion">Reservar cita</p>

        <div className="reserva-medico-presentacion">
          <div className="reserva-medico-imagen">
            {imagenMedico && !imagenError ? (
              <img
                src={imagenMedico}
                alt={`Fotografía de ${medico.nombre}`}
                loading="lazy"
                onError={() => setImagenError(true)}
              />
            ) : (
              <span aria-hidden="true" className="reserva-medico-placeholder">
                👨‍⚕️
              </span>
            )}
          </div>

          <div className="reserva-medico-datos">
            <h1>{medico.nombre}</h1>

            <p className="reserva-medico-especialidad">
              {medico.especialidad?.nombre || 'Especialista médico'}
            </p>

            <p className="reserva-medico-clinica">
              <span aria-hidden="true">📍 </span>
              {medico.clinica?.nombre || 'Clínica no especificada'}
            </p>

            {medico.clinica?.direccion && (
              <p className="reserva-medico-direccion">
                {medico.clinica.direccion}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="reserva-flujo">
        {/* Selección de fecha y hora */}
        <section
          className="tarjeta reserva-seleccion"
          aria-labelledby="reserva-seleccion-titulo"
        >
          <div className="reserva-paso-cabecera">
            <span aria-hidden="true">1</span>

            <div>
              <h2 id="reserva-seleccion-titulo">
                Elige fecha y hora
              </h2>
              <p>
                Elige un horario; su disponibilidad se confirma al guardar
                la cita.
              </p>
            </div>
          </div>

          <label className="reserva-fecha">
            Fecha de la cita
            <input
              type="date"
              min={hoy}
              value={fecha}
              onChange={(e) => {
                setHoraElegida('');
                setHoras([]);
                setCargandoHoras(true);
                setFecha(e.target.value);
              }}
            />
          </label>

          <div className="reserva-horas">
            <h3>Horarios para este día</h3>

            {!fecha ? (
              <p className="detalle">
                Selecciona una fecha para ver los horarios.
              </p>
            ) : cargandoHoras ? (
              <p className="detalle">Consultando horarios…</p>
            ) : horas.length === 0 ? (
              <p className="detalle">
                No hay horarios para esa fecha. Prueba con otro día.
              </p>
            ) : (
              <div className="horas">
                {horas.map((h) => (
                  <button
                    key={h}
                    className={`hora-btn ${
                      horaElegida === h ? 'seleccionada' : ''
                    }`}
                    type="button"
                    aria-pressed={horaElegida === h}
                    onClick={() => setHoraElegida(h)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>

          {horaElegida && (
            <p className="reserva-eleccion">
              Seleccionaste el {fecha} a las{' '}
              <strong>{horaElegida}</strong>.
            </p>
          )}

          {error && (
            <p className="alerta alerta-error" role="alert">
              {error}
            </p>
          )}

          {exito && (
            <p className="alerta alerta-exito" role="status">
              {exito}
            </p>
          )}

          <div className="reserva-acciones">
            <button
              className="boton"
              type="button"
              onClick={reservar}
              disabled={
                reservando ||
                cargandoPerfil ||
                !horaElegida ||
                Boolean(exito)
              }
            >
              {reservando
                ? 'Reservando…'
                : cargandoPerfil
                  ? 'Comprobando sesión…'
                  : perfil
                    ? 'Confirmar reserva'
                    : 'Iniciar sesión para reservar'}
            </button>

            <small>
              La cita solo se guarda si la hora sigue libre al confirmar.
            </small>
          </div>
        </section>

        {/* Horario semanal del médico */}
        <details
          className="tarjeta reserva-horario-semanal"
          open={!enModal}
        >
          <summary>Ver horario semanal de atención</summary>

          {horarios.length === 0 ? (
            <p className="detalle">
              Este médico aún no registró horarios.
            </p>
          ) : (
            <div className="reserva-horario-tabla">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>Día</th>
                    <th>Desde</th>
                    <th>Hasta</th>
                  </tr>
                </thead>

                <tbody>
                  {horarios.map((h) => (
                    <tr key={h.id_horario}>
                      <td>{DIAS[h.dia_semana]}</td>
                      <td>{h.hora_inicio.slice(0, 5)}</td>
                      <td>{h.hora_fin.slice(0, 5)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </details>
      </div>
    </div>
  );
}
