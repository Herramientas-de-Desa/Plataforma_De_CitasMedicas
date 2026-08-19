// Componente: reserva de cita (RF04 + RF05).
// Reutiliza medicosService y citasService.
import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { medicosService } from '../services/medicosService';
import { citasService } from '../services/citasService';

const DIAS = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function ReservaCita() {
  const { idMedico } = useParams();
  const { perfil } = useAuth();
  const navegar = useNavigate();

  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [medico, setMedico] = useState(null);
  const [horarios, setHorarios] = useState([]);
  const [fecha, setFecha] = useState(hoy);
  const [horas, setHoras] = useState([]);
  const [horaElegida, setHoraElegida] = useState('');
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [reservando, setReservando] = useState(false);

  useEffect(() => {
    medicosService.obtenerPorId(idMedico).then(setMedico).catch((e) => setError(e.message));
    medicosService.obtenerHorarios(idMedico).then(setHorarios).catch(() => {});
  }, [idMedico]);

  useEffect(() => {
    setHoraElegida('');
    setError('');
    citasService.horasDisponibles(idMedico, fecha).then(setHoras).catch((e) => setError(e.message));
  }, [idMedico, fecha]);

  async function reservar() {
    setError(''); setExito('');
    if (!horaElegida) return setError('Selecciona una hora disponible.');
    setReservando(true);
    try {
      await citasService.reservar({
        pacienteId: perfil.id_usuario,
        medicoId: Number(idMedico),
        fecha,
        hora: horaElegida,
      });
      setExito(`Cita reservada para el ${fecha} a las ${horaElegida}.`);
      setTimeout(() => navegar('/mis-citas'), 1200);
    } catch (e) {
      setError(e.message);
    } finally {
      setReservando(false);
    }
  }

  if (!medico) return <p className="contenedor">{error || 'Cargando médico…'}</p>;

  return (
    <div className="contenedor">
      <div className="encabezado">
        <p className="etiqueta-seccion">Reservar cita</p>
        <h1>{medico.nombre}</h1>
        <p>{medico.especialidad?.nombre} · {medico.clinica?.nombre} — {medico.clinica?.direccion}</p>
      </div>

      <div className="grid" style={{ gridTemplateColumns: '1fr', maxWidth: 720 }}>
        <div className="tarjeta">
          <h3 style={{ marginBottom: 10 }}>Horario semanal de atención</h3>
          {horarios.length === 0 ? (
            <p className="detalle">Este médico aún no registró horarios.</p>
          ) : (
            <table className="tabla">
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
            </table>
          )}
        </div>

        <div className="tarjeta">
          <h3 style={{ marginBottom: 10 }}>Elige fecha y hora</h3>
          <label style={{ maxWidth: 240 }}>Fecha de la cita
            <input type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <div style={{ marginTop: 16 }}>
            {horas.length === 0 ? (
              <p className="detalle">No hay horas libres para esa fecha. Prueba con otro día.</p>
            ) : (
              <div className="horas">
                {horas.map((h) => (
                  <button
                    key={h}
                    className={`hora-btn ${horaElegida === h ? 'seleccionada' : ''}`}
                    onClick={() => setHoraElegida(h)}
                  >
                    {h}
                  </button>
                ))}
              </div>
            )}
          </div>
          {error && <p className="alerta alerta-error" style={{ marginTop: 14 }}>{error}</p>}
          {exito && <p className="alerta alerta-exito" style={{ marginTop: 14 }}>{exito}</p>}
          <button className="boton" style={{ marginTop: 16 }} onClick={reservar} disabled={reservando || !horaElegida}>
            {reservando ? 'Reservando…' : 'Confirmar reserva'}
          </button>
        </div>
      </div>
    </div>
  );
}
