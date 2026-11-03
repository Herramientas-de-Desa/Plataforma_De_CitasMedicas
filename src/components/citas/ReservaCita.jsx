// Componente: reserva de cita (RF04 + RF05).
// Reutiliza medicosService y citasService.
import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { medicosService } from '../../services/medicosService';
import { citasService } from '../../services/citasService';
import { fechaActualEnIca, formatearFechaLarga } from '../../services/fechas';

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function ReservaCita({ medicoIdProp, fechaInicial = '', enModal = false }) {
  const { idMedico: idMedicoRuta } = useParams();
  const idMedico = medicoIdProp || idMedicoRuta;
  const { perfil, cargando: cargandoPerfil } = useAuth();
  const navegar = useNavigate();

  const hoy = useMemo(fechaActualEnIca, []);
  const fechaDeInicio = /^\d{4}-\d{2}-\d{2}$/.test(fechaInicial) && fechaInicial >= hoy ? fechaInicial : hoy;
  const [medico, setMedico] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [fecha, setFecha] = useState(fechaDeInicio);
  const [horas, setHoras] = useState([]);
  const [horaElegida, setHoraElegida] = useState('');
  const [cargandoHoras, setCargandoHoras] = useState(true);
  const [proximaFecha, setProximaFecha] = useState(undefined); // undefined = buscando, null = no hay
  const [recarga, setRecarga] = useState(0);
  const [error, setError] = useState('');
  const [reservada, setReservada] = useState(null);
  const [reservando, setReservando] = useState(false);

  useEffect(() => {
    medicosService.obtenerPorId(idMedico).then(setMedico).catch((e) => setError(e.message));
    medicosService.obtenerHorarios(idMedico).then(setHorarios).catch(() => {});
  }, [idMedico]);

  useEffect(() => {
    let activo = true;
    setHoraElegida('');
    setHoras([]);
    setProximaFecha(undefined);
    setCargandoHoras(true);
    if (!fecha) {
      setCargandoHoras(false);
      return undefined;
    }
    citasService.horasDisponibles(idMedico, fecha)
      .then((libres) => {
        if (!activo) return;
        setHoras(libres);
        // Sin horas ese día: sugerir directamente el siguiente día con turnos libres.
        if (!libres.length) {
          citasService.proximaFechaDisponible(idMedico, fecha)
            .then((siguiente) => { if (activo) setProximaFecha(siguiente); })
            .catch(() => { if (activo) setProximaFecha(null); });
        }
      })
      .catch((e) => { if (activo) setError(e.message); })
      .finally(() => { if (activo) setCargandoHoras(false); });
    return () => { activo = false; };
  }, [idMedico, fecha, recarga]);

  // Al volver de iniciar sesión o registrarse, reabre esta reserva con la fecha elegida.
  const regresoReserva = `/especialistas?${new URLSearchParams({ reservar: String(idMedico), fecha })}`;

  function cambiarFecha(nueva) {
    setError('');
    setFecha(nueva);
  }

  async function reservar() {
    setError('');
    if (!horaElegida) return setError('Selecciona una hora disponible.');
    if (!perfil) {
      navegar('/login', { state: { returnTo: regresoReserva } });
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
      setReservada({ fecha, hora: horaElegida });
    } catch (e) {
      setError(e.message);
      // La hora pudo ocuparse mientras tanto: vuelve a consultar los turnos libres.
      setRecarga((n) => n + 1);
    } finally {
      setReservando(false);
    }
  }

  if (!medico) return <p className={enModal ? 'reserva-cargando' : 'contenedor'}>{error || 'Cargando médico…'}</p>;

  const contenedor = enModal ? 'reserva-contenido reserva-contenido-modal' : 'contenedor reserva-contenido';

  if (reservada) {
    return (
      <div className={contenedor}>
        <section className="tarjeta reserva-confirmada" aria-labelledby="reserva-confirmada-titulo" role="status">
          <span className="reserva-confirmada-icono" aria-hidden="true">✓</span>
          <h1 id="reserva-confirmada-titulo">¡Cita reservada!</h1>
          <p className="reserva-confirmada-fecha">
            <strong>{formatearFechaLarga(reservada.fecha)}</strong> a las <strong>{reservada.hora}</strong>
          </p>
          <dl className="reserva-confirmada-detalle">
            <div><dt>Médico</dt><dd>{medico.nombre}</dd></div>
            <div><dt>Especialidad</dt><dd>{medico.especialidad?.nombre || '—'}</dd></div>
            <div><dt>Clínica</dt><dd>{medico.clinica?.nombre || '—'}</dd></div>
            {medico.clinica?.direccion && <div><dt>Dirección</dt><dd>{medico.clinica.direccion}</dd></div>}
          </dl>
          <p className="reserva-confirmada-nota">Tu cita queda <strong>pendiente</strong> hasta que el médico la confirme. Puedes revisarla o cancelarla en "Mis citas".</p>
          <div className="reserva-confirmada-acciones">
            <Link className="boton" to="/mis-citas">Ver mis citas</Link>
            {medico.clinica?.id_clinica && (
              <Link className="boton boton-secundario" to={`/clinicas?clinica=${medico.clinica.id_clinica}`}>Cómo llegar</Link>
            )}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={contenedor}>
      <div className="encabezado reserva-encabezado">
        <p className="etiqueta-seccion">Reservar cita</p>
        <h1>{medico.nombre}</h1>
        <p>{medico.especialidad?.nombre} · {medico.clinica?.nombre} — {medico.clinica?.direccion}</p>
      </div>

      <div className="reserva-flujo">
        <section className="tarjeta reserva-seleccion" aria-labelledby="reserva-seleccion-titulo">
          <div className="reserva-paso-cabecera">
            <span aria-hidden="true">1</span>
            <div>
              <h2 id="reserva-seleccion-titulo">Elige fecha y hora</h2>
              <p>Elige un horario; su disponibilidad se confirma al guardar la cita.</p>
            </div>
          </div>
          {!cargandoPerfil && !perfil && (
            <div className="reserva-aviso-sesion" role="note">
              <p>Puedes ver los horarios sin una cuenta. Para <strong>confirmar la cita</strong> necesitas iniciar sesión.</p>
              <div>
                <Link className="boton boton-mini" to="/login" state={{ returnTo: regresoReserva }}>Iniciar sesión</Link>
                <Link className="boton boton-secundario boton-mini" to="/registro" state={{ returnTo: regresoReserva }}>Crear cuenta</Link>
              </div>
            </div>
          )}
          <label className="reserva-fecha">Fecha de la cita
            <input type="date" min={hoy} value={fecha} onChange={(e) => cambiarFecha(e.target.value)} />
          </label>
          <div className="reserva-horas">
            <h3>{fecha ? `Horarios del ${formatearFechaLarga(fecha)}` : 'Horarios para este día'}</h3>
            {!fecha ? (
              <p className="detalle">Selecciona una fecha para ver los horarios.</p>
            ) : cargandoHoras ? (
              <p className="detalle">Consultando horarios…</p>
            ) : horas.length === 0 ? (
              <div className="reserva-sin-horas">
                <p className="detalle">{fecha === hoy ? 'Ya no quedan horarios libres hoy.' : 'No hay horarios libres ese día.'}</p>
                {proximaFecha === undefined ? (
                  <p className="detalle">Buscando el próximo día disponible…</p>
                ) : proximaFecha ? (
                  <button className="boton boton-secundario" type="button" onClick={() => cambiarFecha(proximaFecha)}>
                    Ver el próximo día libre: {formatearFechaLarga(proximaFecha)}
                  </button>
                ) : (
                  <p className="detalle">Este médico no tiene horarios libres en los próximos 30 días.</p>
                )}
              </div>
            ) : (
              <div className="horas">
                {horas.map((h) => (
                  <button
                    key={h}
                    className={`hora-btn ${horaElegida === h ? 'seleccionada' : ''}`}
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
          {horaElegida && <p className="reserva-eleccion">Seleccionaste el {formatearFechaLarga(fecha)} a las <strong>{horaElegida}</strong>.</p>}
          {error && <p className="alerta alerta-error" role="alert">{error}</p>}
          <div className="reserva-acciones">
            <button className="boton" type="button" onClick={reservar}
              disabled={reservando || cargandoPerfil || !horaElegida}>
              {reservando ? 'Reservando…' : cargandoPerfil ? 'Comprobando sesión…' : perfil ? 'Confirmar reserva' : 'Iniciar sesión para reservar'}
            </button>
            <small>La cita solo se guarda si la hora sigue libre al confirmar.</small>
          </div>
        </section>

        <details className="tarjeta reserva-horario-semanal" open={!enModal}>
          <summary>Ver horario semanal de atención</summary>
          {horarios.length === 0 ? (
            <p className="detalle">Este médico aún no registró horarios.</p>
          ) : (
            <div className="reserva-horario-tabla"><table className="tabla">
              <thead><tr><th>Día</th><th>Desde</th><th>Hasta</th></tr></thead>
              <tbody>
                {horarios.map((h) => (
                  <tr key={h.id_horario}>
                    <td>{DIAS[h.dia_semana]}</td>
                    <td>{h.hora_inicio.slice(0, 5)}</td>
                    <td>{h.hora_fin.slice(0, 5)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          )}
        </details>
      </div>
    </div>
  );
}
