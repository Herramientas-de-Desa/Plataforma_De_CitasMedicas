// Componente: reserva de cita (RF04 + RF05).
// Reutiliza medicosService y citasService.
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../../../core/context/AuthContext';
import { medicosService } from '../../medicos/services/medicosService';
import { citasService } from '../services/citasService';

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

function fechaActualEnIca() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
  return `${partes.year}-${partes.month}-${partes.day}`;
}

export default function ReservaCita({ medicoIdProp, fechaInicial = '', enModal = false }) {
  const { idMedico: idMedicoRuta } = useParams();
  const idMedico = medicoIdProp || idMedicoRuta;
  const { perfil, cargando: cargandoPerfil } = useAuth();
  const navegar = useNavigate();
  const temporizador = useRef(null);

  const hoy = useMemo(fechaActualEnIca, []);
  const fechaDeInicio = /^\d{4}-\d{2}-\d{2}$/.test(fechaInicial) && fechaInicial >= hoy ? fechaInicial : hoy;
  const [medico, setMedico] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [fecha, setFecha] = useState(fechaDeInicio);
  const [horas, setHoras] = useState([]);
  const [horaElegida, setHoraElegida] = useState('');
  const [cargandoHoras, setCargandoHoras] = useState(true);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [reservando, setReservando] = useState(false);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  useEffect(() => {
    medicosService.obtenerPorId(idMedico).then(setMedico).catch((e) => setError(e.message));
    medicosService.obtenerHorarios(idMedico).then(setHorarios).catch(() => {});
  }, [idMedico]);

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
    citasService.horasDisponibles(idMedico, fecha)
      .then((libres) => { if (activo) setHoras(libres); })
      .catch((e) => { if (activo) setError(e.message); })
      .finally(() => { if (activo) setCargandoHoras(false); });
    return () => { activo = false; };
  }, [idMedico, fecha]);

  async function reservar() {
    setError(''); setExito('');
    if (!horaElegida) return setError('Selecciona una hora disponible.');
    if (!perfil) {
      const regreso = new URLSearchParams({ reservar: String(idMedico), fecha });
      navegar('/login', { state: { returnTo: `/especialistas?${regreso}` } });
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
      temporizador.current = setTimeout(() => navegar('/mis-citas'), 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setReservando(false);
    }
  }

  if (!medico) return <p className={enModal ? 'reserva-cargando' : 'contenedor'}>{error || 'Cargando médico…'}</p>;

  return (
    <div className={enModal ? 'reserva-contenido reserva-contenido-modal' : 'contenedor reserva-contenido'}>
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
          <label className="reserva-fecha">Fecha de la cita
            <input type="date" min={hoy} value={fecha} onChange={(e) => {
              setHoraElegida('');
              setHoras([]);
              setCargandoHoras(true);
              setFecha(e.target.value);
            }} />
          </label>
          <div className="reserva-horas">
            <h3>Horarios para este día</h3>
            {!fecha ? (
              <p className="detalle">Selecciona una fecha para ver los horarios.</p>
            ) : cargandoHoras ? (
              <p className="detalle">Consultando horarios…</p>
            ) : horas.length === 0 ? (
              <p className="detalle">No hay horarios para esa fecha. Prueba con otro día.</p>
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
          {horaElegida && <p className="reserva-eleccion">Seleccionaste el {fecha} a las <strong>{horaElegida}</strong>.</p>}
          {error && <p className="alerta alerta-error" role="alert">{error}</p>}
          {exito && <p className="alerta alerta-exito" role="status">{exito}</p>}
          <div className="reserva-acciones">
            <button className="boton" type="button" onClick={reservar}
              disabled={reservando || cargandoPerfil || !horaElegida || Boolean(exito)}>
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
