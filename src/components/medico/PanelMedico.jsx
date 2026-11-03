// Componente: agenda del médico (consultar citas y actualizar su estado).
// Vista por día con turnos libres y ocupados, más listas de próximas y anteriores.
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { medicosService } from '../../services/medicosService';
import { citasService, turnosDelDia } from '../../services/citasService';
import { prediccionesService } from '../../services/prediccionesService';
import { fechaActualEnIca, formatearFechaCorta, formatearFechaLarga, horaActualEnIca, sumarDias } from '../../services/fechas';
import PrediccionDisponibilidad from '../disponibilidad/PrediccionDisponibilidad';
import EstadoCita from '../citas/EstadoCita';
import DialogoConfirmacion from '../comun/DialogoConfirmacion';
import { useAvisos } from '../../context/AvisosContext';

const ACTIVAS = ['pendiente', 'confirmada'];
const momento = (c) => `${c.fecha} ${c.hora.slice(0, 5)}`;

function AccionesCita({ cita, hoy, ocupado, onCambiar, onCancelar }) {
  const activa = ACTIVAS.includes(cita.estado);
  if (!activa) return null;
  return (
    <div className="agenda-acciones">
      {cita.estado === 'pendiente' && (
        <button className="boton boton-mini" type="button" disabled={ocupado} onClick={() => onCambiar(cita, 'confirmada')}>Confirmar</button>
      )}
      {cita.fecha <= hoy && (
        <button className="boton boton-secundario boton-mini" type="button" disabled={ocupado} onClick={() => onCambiar(cita, 'atendida')}>Atendida</button>
      )}
      <button className="boton boton-peligro boton-mini" type="button" disabled={ocupado} onClick={() => onCancelar(cita)}>Cancelar</button>
    </div>
  );
}

function Paciente({ cita }) {
  return (
    <div className="agenda-paciente">
      <strong>{cita.paciente || 'Paciente'}</strong>
      {cita.paciente_telefono && <a href={`tel:${cita.paciente_telefono.replace(/\s+/g, '')}`}>Tel. {cita.paciente_telefono}</a>}
    </div>
  );
}

export default function PanelMedico() {
  const { perfil } = useAuth();
  const [medico, setMedico] = useState(null);
  const [citas, setCitas] = useState([]);
  const [horarios, setHorarios] = useState([]);
  const [prediccion, setPrediccion] = useState(null);
  const [error, setError] = useState('');
  const avisar = useAvisos();
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);
  const [actualizando, setActualizando] = useState(null);
  const [vista, setVista] = useState('dia');
  const hoy = fechaActualEnIca();
  const [dia, setDia] = useState(hoy);
  const [porCancelar, setPorCancelar] = useState(null);
  const [errorCancelar, setErrorCancelar] = useState('');

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    setMedico(null);
    setCitas([]);
    setPrediccion(null);
    async function cargar() {
      const data = await medicosService.obtenerPorUsuario(perfil.id_usuario);
      if (!activo || !data) return;
      setMedico(data);
      const [agenda, turnos, estimacion] = await Promise.all([
        citasService.agendaMedico(data.id_medico),
        medicosService.obtenerHorarios(data.id_medico),
        prediccionesService.obtenerUltima(data.id_medico).catch(() => null),
      ]);
      if (activo) { setCitas(agenda); setHorarios(turnos); setPrediccion(estimacion); }
    }
    cargar().catch(() => { if (activo) setError('No pudimos cargar tu agenda. Revisa tu conexión y vuelve a intentarlo.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [perfil.id_usuario, intento]);

  const { proximas, anteriores, deHoy, siguiente } = useMemo(() => {
    const ahora = `${hoy} ${horaActualEnIca()}`;
    const proximas = citas.filter((c) => ACTIVAS.includes(c.estado) && momento(c) > ahora)
      .sort((a, b) => momento(a).localeCompare(momento(b)));
    const anteriores = citas.filter((c) => !(ACTIVAS.includes(c.estado) && momento(c) > ahora))
      .sort((a, b) => momento(b).localeCompare(momento(a)));
    const deHoy = citas.filter((c) => c.fecha === hoy && c.estado !== 'cancelada');
    return { proximas, anteriores, deHoy, siguiente: proximas[0] || null };
  }, [citas, hoy]);

  const pendientes = citas.filter((c) => c.estado === 'pendiente').length;

  // Turnos del día elegido, con la cita activa que ocupa cada uno. Las citas fuera
  // del horario actual (por un cambio de turnos) se añaden para no perderlas.
  const turnosDia = useMemo(() => {
    const activasDelDia = citas.filter((c) => c.fecha === dia && c.estado !== 'cancelada');
    const porHora = new Map(activasDelDia.map((c) => [c.hora.slice(0, 5), c]));
    const horas = new Set([...turnosDelDia(horarios, dia), ...porHora.keys()]);
    return [...horas].sort().map((hora) => ({ hora, cita: porHora.get(hora) || null }));
  }, [citas, horarios, dia]);

  async function recargarCitas() {
    setCitas(await citasService.agendaMedico(medico.id_medico));
  }

  async function marcar(cita, estado) {
    if (actualizando !== null) return;
    setActualizando(cita.id_cita);
    setError('');
   
    try {
      await citasService.cambiarEstado(cita.id_cita, estado);
      await recargarCitas();
      avisar(estado === 'confirmada' ? `Confirmaste la cita de ${cita.paciente}.` : `Marcaste como atendida la cita de ${cita.paciente}.`);
    } catch (e) {
      setError(e.message || 'No pudimos completar la actualización. Recarga la agenda para comprobar el estado de la cita.');
    } finally { setActualizando(null); }
  }

  async function confirmarCancelacion() {
    setActualizando(porCancelar.id_cita);
    setErrorCancelar('');
    try {
      await citasService.cambiarEstado(porCancelar.id_cita, 'cancelada');
      await recargarCitas();
      avisar(`Cancelaste la cita de ${porCancelar.paciente} del ${formatearFechaLarga(porCancelar.fecha)}.`);
      setPorCancelar(null);
    } catch (e) {
      setErrorCancelar(e.message);
    } finally { setActualizando(null); }
  }

  function abrirCancelacion(cita) {
   
    setErrorCancelar('');
    setPorCancelar(cita);
  }

  const ocupado = actualizando !== null;
  const acciones = (cita) => (
    <AccionesCita cita={cita} hoy={hoy} ocupado={ocupado} onCambiar={marcar} onCancelar={abrirCancelacion} />
  );

  return (
    <div className="contenedor agenda">
      <div className="encabezado">
        <p className="etiqueta-seccion">Panel del médico</p>
        <h1>Mi agenda</h1>
      </div>
      {cargando && <p role="status">Cargando tu agenda…</p>}
      {error && <div className="alerta alerta-error" role="alert"><p>{error}</p><button className="boton boton-secundario boton-mini" type="button" onClick={() => setIntento((valor) => valor + 1)}>Recargar agenda</button></div>}
      {!cargando && !error && !medico && <section className="tarjeta">
        <h2>Tu perfil profesional está pendiente de asignación</h2>
        <p>El administrador debe asignarte una clínica, especialidad y horarios iniciales. Luego podrás editarlos desde tu perfil.</p>
        <Link className="boton" to="/perfil">Ver mi perfil</Link>
      </section>}
      {!cargando && medico && (
        <>
          <div className="agenda-resumen">
            <div className="tarjeta"><span>Citas hoy</span><strong>{deHoy.length}</strong></div>
            <div className="tarjeta"><span>Por confirmar</span><strong>{pendientes}</strong></div>
            <div className="tarjeta agenda-siguiente">
              <span>Próxima cita</span>
              {siguiente
                ? <strong>{formatearFechaCorta(siguiente.fecha)} · {siguiente.hora.slice(0, 5)}<small>{siguiente.paciente}</small></strong>
                : <strong className="agenda-sin-dato">Sin citas próximas</strong>}
            </div>
          </div>

          <div className="mis-citas-pestanias" role="tablist" aria-label="Vista de la agenda">
            <button type="button" role="tab" aria-selected={vista === 'dia'} onClick={() => setVista('dia')}>Por día</button>
            <button type="button" role="tab" aria-selected={vista === 'proximas'} onClick={() => setVista('proximas')}>Próximas <span>{proximas.length}</span></button>
            <button type="button" role="tab" aria-selected={vista === 'anteriores'} onClick={() => setVista('anteriores')}>Anteriores <span>{anteriores.length}</span></button>
          </div>

          {vista === 'dia' && (
            <section className="tarjeta agenda-dia" role="tabpanel" aria-labelledby="agenda-dia-titulo">
              <div className="agenda-dia-cabecera">
                <button className="boton boton-secundario boton-mini" type="button" aria-label="Día anterior" onClick={() => setDia(sumarDias(dia, -1))}>←</button>
                <h2 id="agenda-dia-titulo">{dia === hoy ? 'Hoy, ' : ''}{formatearFechaLarga(dia)}</h2>
                <button className="boton boton-secundario boton-mini" type="button" aria-label="Día siguiente" onClick={() => setDia(sumarDias(dia, 1))}>→</button>
                <input type="date" aria-label="Elegir día" value={dia} onChange={(e) => e.target.value && setDia(e.target.value)} />
                {dia !== hoy && <button className="boton boton-mini" type="button" onClick={() => setDia(hoy)}>Hoy</button>}
              </div>
              {turnosDia.length === 0 ? (
                <p className="detalle">No atiendes este día.</p>
              ) : (
                <ol className="agenda-turnos">
                  {turnosDia.map(({ hora, cita }) => (
                    <li key={hora} className={cita ? 'agenda-turno-ocupado' : 'agenda-turno-libre'}>
                      <span className="agenda-hora">{hora}</span>
                      {cita ? <>
                        <Paciente cita={cita} />
                        <EstadoCita estado={cita.estado} />
                        {acciones(cita)}
                      </> : <span className="agenda-libre">Libre</span>}
                    </li>
                  ))}
                </ol>
              )}
            </section>
          )}

          {vista !== 'dia' && (
            <div className="mis-citas-lista" role="tabpanel">
              {(vista === 'proximas' ? proximas : anteriores).map((c) => (
                <article key={c.id_cita} className={`tarjeta cita-tarjeta${c === siguiente && vista === 'proximas' ? ' cita-siguiente' : ''}`}>
                  <div className="cita-fecha">
                    <strong>{formatearFechaCorta(c.fecha)}</strong>
                    <span>{c.hora.slice(0, 5)}</span>
                  </div>
                  <div className="cita-datos">
                    {c === siguiente && vista === 'proximas' && <p className="cita-etiqueta">Tu próxima cita</p>}
                    <Paciente cita={c} />
                  </div>
                  <div className="cita-acciones">
                    <EstadoCita estado={c.estado} />
                    {acciones(c)}
                  </div>
                </article>
              ))}
              {(vista === 'proximas' ? proximas : anteriores).length === 0 && (
                <div className="tarjeta">{vista === 'proximas' ? 'No tienes citas próximas.' : 'Aún no tienes citas anteriores.'}</div>
              )}
            </div>
          )}

          <div className="tarjeta resumen-demanda" style={{ marginTop: 16 }}>
            <h3>Carga futura</h3>
            <PrediccionDisponibilidad prediccion={prediccion} mostrarDemanda />
          </div>
        </>
      )}

      {porCancelar && (
        <DialogoConfirmacion
          titulo="¿Cancelar esta cita?"
          textoConfirmar="Sí, cancelar cita"
          textoCancelar="No, conservarla"
          peligro
          procesando={actualizando !== null}
          error={errorCancelar}
          onConfirmar={confirmarCancelacion}
          onCancelar={() => setPorCancelar(null)}
        >
          <dl className="dialogo-detalle">
            <div><dt>Paciente</dt><dd>{porCancelar.paciente}</dd></div>
            <div><dt>Fecha</dt><dd>{formatearFechaLarga(porCancelar.fecha)}, {porCancelar.hora.slice(0, 5)}</dd></div>
          </dl>
          <p>Avisa al paciente si puedes. El horario quedará libre para otras reservas.</p>
        </DialogoConfirmacion>
      )}
    </div>
  );
}
