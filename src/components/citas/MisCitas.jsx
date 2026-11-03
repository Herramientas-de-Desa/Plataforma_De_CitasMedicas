// Componente: citas del paciente, separadas en próximas e historial, con cancelación (RF06).
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { citasService } from '../../services/citasService';
import { clinicasService } from '../../services/clinicasService';
import { fechaActualEnIca, formatearFechaCorta, formatearFechaLarga, horaActualEnIca } from '../../services/fechas';
import EstadoCita from './EstadoCita';
import DialogoConfirmacion from '../comun/DialogoConfirmacion';

const ACTIVAS = ['pendiente', 'confirmada'];

function esProxima(cita, hoy, ahora) {
  if (!ACTIVAS.includes(cita.estado)) return false;
  return cita.fecha > hoy || (cita.fecha === hoy && cita.hora.slice(0, 5) > ahora);
}

export default function MisCitas() {
  const { perfil } = useAuth();
  const [citas, setCitas] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [pestania, setPestania] = useState('proximas');
  const [porCancelar, setPorCancelar] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [errorCancelar, setErrorCancelar] = useState('');
  const [aviso, setAviso] = useState('');

  async function cargar() {
    try {
      setCitas(await citasService.historialPaciente(perfil.id_usuario));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // Solo sirve para el enlace "Cómo llegar"; si falla, el enlace no aparece.
    clinicasService.listar().then(setClinicas).catch(() => {});
  }, []);

  const { proximas, historial } = useMemo(() => {
    const hoy = fechaActualEnIca();
    const ahora = horaActualEnIca();
    const proximas = citas.filter((c) => esProxima(c, hoy, ahora))
      .sort((a, b) => `${a.fecha} ${a.hora}`.localeCompare(`${b.fecha} ${b.hora}`));
    const historial = citas.filter((c) => !esProxima(c, hoy, ahora));
    return { proximas, historial };
  }, [citas]);

  // La vista de citas trae el nombre de la clínica; el mapa necesita su id.
  const idClinica = (nombre) => clinicas.find((c) => c.nombre === nombre)?.id_clinica;

  async function confirmarCancelacion() {
    setCancelando(true);
    setErrorCancelar('');
    try {
      await citasService.cancelar(porCancelar.id_cita);
      setAviso(`Cancelaste tu cita del ${formatearFechaLarga(porCancelar.fecha)} a las ${porCancelar.hora.slice(0, 5)}.`);
      setPorCancelar(null);
      await cargar();
    } catch (e) {
      setErrorCancelar(e.message);
    } finally {
      setCancelando(false);
    }
  }

  const lista = pestania === 'proximas' ? proximas : historial;

  return (
    <div className="contenedor mis-citas">
      <div className="encabezado mis-citas-encabezado">
        <div>
          <p className="etiqueta-seccion">Historial</p>
          <h1>Mis citas</h1>
          <p>Revisa tus próximas citas y las que ya pasaron.</p>
        </div>
        <Link className="boton" to="/especialistas">Reservar una cita</Link>
      </div>
      {error && <p className="alerta alerta-error">{error}</p>}
      {aviso && <p className="alerta alerta-exito" role="status">{aviso}</p>}
      {cargando ? (
        <p role="status">Cargando citas…</p>
      ) : citas.length === 0 ? (
        <div className="tarjeta mis-citas-vacio">
          <h2>Aún no tienes citas</h2>
          <p>Busca un especialista, elige un horario y reserva tu primera cita en pocos pasos.</p>
          <Link className="boton" to="/especialistas">Buscar especialistas</Link>
        </div>
      ) : (
        <>
          <div className="mis-citas-pestanias" role="tablist" aria-label="Tipo de citas">
            <button type="button" role="tab" aria-selected={pestania === 'proximas'} onClick={() => setPestania('proximas')}>
              Próximas <span>{proximas.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={pestania === 'historial'} onClick={() => setPestania('historial')}>
              Historial <span>{historial.length}</span>
            </button>
          </div>

          {lista.length === 0 ? (
            <div className="tarjeta mis-citas-vacio" role="tabpanel">
              {pestania === 'proximas'
                ? <><p>No tienes citas próximas.</p><Link className="boton boton-secundario" to="/especialistas">Reservar una cita</Link></>
                : <p>Todavía no tienes citas pasadas o canceladas.</p>}
            </div>
          ) : (
            <div className="mis-citas-lista" role="tabpanel">
              {lista.map((c) => {
                const clinicaId = idClinica(c.clinica);
                return (
                  <article key={c.id_cita} className={`tarjeta cita-tarjeta${c === proximas[0] && pestania === 'proximas' ? ' cita-siguiente' : ''}`}>
                    <div className="cita-fecha">
                      <strong>{formatearFechaCorta(c.fecha)}</strong>
                      <span>{c.hora.slice(0, 5)}</span>
                    </div>
                    <div className="cita-datos">
                      {c === proximas[0] && pestania === 'proximas' && <p className="cita-etiqueta">Tu próxima cita</p>}
                      <h2>{c.medico}</h2>
                      <p>{c.especialidad} · {c.clinica}</p>
                    </div>
                    <div className="cita-acciones">
                      <EstadoCita estado={c.estado} />
                      {pestania === 'proximas' && clinicaId && (
                        <Link className="boton boton-secundario boton-mini" to={`/clinicas?clinica=${clinicaId}`}>Cómo llegar</Link>
                      )}
                      {ACTIVAS.includes(c.estado) && pestania === 'proximas' && (
                        <button className="boton boton-peligro boton-mini" type="button" onClick={() => { setAviso(''); setErrorCancelar(''); setPorCancelar(c); }}>
                          Cancelar
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </>
      )}

      {porCancelar && (
        <DialogoConfirmacion
          titulo="¿Cancelar esta cita?"
          textoConfirmar="Sí, cancelar cita"
          textoCancelar="No, conservarla"
          peligro
          procesando={cancelando}
          error={errorCancelar}
          onConfirmar={confirmarCancelacion}
          onCancelar={() => setPorCancelar(null)}
        >
          <dl className="dialogo-detalle">
            <div><dt>Fecha</dt><dd>{formatearFechaLarga(porCancelar.fecha)}, {porCancelar.hora.slice(0, 5)}</dd></div>
            <div><dt>Médico</dt><dd>{porCancelar.medico}</dd></div>
            <div><dt>Clínica</dt><dd>{porCancelar.clinica}</dd></div>
          </dl>
          <p>El horario quedará libre para otros pacientes. Esta acción no se puede deshacer.</p>
        </DialogoConfirmacion>
      )}
    </div>
  );
}
