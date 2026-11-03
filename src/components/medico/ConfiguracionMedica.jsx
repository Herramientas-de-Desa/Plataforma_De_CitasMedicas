import { useEffect, useState } from 'react';
import { especialidadesService } from '../../services/especialidadesService';
import { clinicasService } from '../../services/clinicasService';
import { medicosService } from '../../services/medicosService';
import { DIAS_ATENCION, validarHorarios } from '../../services/horariosValidacion';

// Destinos para copiar los turnos de un día (1 = lunes … 7 = domingo).
const DESTINOS_COPIA = {
  laborables: { texto: 'De lunes a viernes', dias: [1, 2, 3, 4, 5] },
  sabado: { texto: 'Lunes a sábado', dias: [1, 2, 3, 4, 5, 6] },
  semana: { texto: 'Toda la semana', dias: [1, 2, 3, 4, 5, 6, 7] },
};

export default function ConfiguracionMedica({ medico, horarios, nombreCuenta, onGuardado, usuarioId = null, modoAdmin = false }) {
  const inicial = { nombre: medico?.nombre || nombreCuenta || '', telefono: medico?.telefono || '', especialidad_id: String(medico?.especialidad?.id_especialidad || ''), clinica_id: String(medico?.clinica?.id_clinica || '') };
  const turnosIniciales = () => horarios.map(h => ({ dia_semana: h.dia_semana, hora_inicio: h.hora_inicio.slice(0,5), hora_fin: h.hora_fin.slice(0,5) }));
  const [datos, setDatos] = useState(inicial);
  const [turnos, setTurnos] = useState(turnosIniciales);
  const [especialidades, setEspecialidades] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCatalogo, setErrorCatalogo] = useState(false);
  const [intento, setIntento] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [editando, setEditando] = useState(!medico);
  const [origenCopia, setOrigenCopia] = useState('1');
  const [destinoCopia, setDestinoCopia] = useState('laborables');
  const [avisoCopia, setAvisoCopia] = useState('');

  const diasConTurnos = DIAS_ATENCION.map((dia, i) => ({ dia, numero: i + 1 }))
    .filter(({ numero }) => turnos.some((h) => Number(h.dia_semana) === numero));
  // Si el día elegido se quedó sin turnos, se usa el primer día que sí tiene.
  const origenEfectivo = diasConTurnos.some(({ numero }) => String(numero) === origenCopia)
    ? origenCopia : String(diasConTurnos[0]?.numero || '');

  // Reemplaza los turnos de los días destino por una copia de los del día origen.
  function copiarTurnos() {
    const origen = Number(origenEfectivo);
    const modelo = turnos.filter((h) => Number(h.dia_semana) === origen);
    if (!modelo.length) return;
    const destinos = DESTINOS_COPIA[destinoCopia].dias.filter((d) => d !== origen);
    setTurnos((lista) => [
      ...lista.filter((h) => !destinos.includes(Number(h.dia_semana))),
      ...destinos.flatMap((d) => modelo.map((h) => ({ ...h, dia_semana: d }))),
    ]);
    setError('');
    setAvisoCopia(`Copiaste los turnos del ${DIAS_ATENCION[origen - 1].toLowerCase()} a ${DESTINOS_COPIA[destinoCopia].texto.toLowerCase()}. Revisa y guarda los cambios.`);
  }
  useEffect(() => {
    let activo = true;
    setCargando(true); setErrorCatalogo(false);
    Promise.all([especialidadesService.listar(), clinicasService.listar()])
      .then(([e,c]) => { if (activo) { setEspecialidades(e); setClinicas(c); } })
      .catch(() => { if (activo) setErrorCatalogo(true); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [intento]);
  function cambiar(campo, valor) { setDatos(d => ({ ...d, [campo]: valor })); setError(''); }
  function actualizarTurno(indice, campo, valor) { setTurnos(lista => lista.map((h,i) => i === indice ? { ...h, [campo]: valor } : h)); setError(''); }
  async function guardar(evento) {
    evento.preventDefault();
    if (guardando) return;
    if (!datos.nombre.trim() || !datos.especialidad_id || !datos.clinica_id) { setError('Completa tu nombre profesional, especialidad y clínica.'); return; }
    const problema = validarHorarios(turnos);
    if (problema) { setError(problema); return; }
    setError(''); setGuardando(true);
    try { await medicosService.guardarMiConfiguracion({ ...datos, horarios: turnos, usuarioId }); onGuardado(); }
    catch (e) { setError(e.message); }
    finally { setGuardando(false); }
  }
  return <section className="tarjeta mp-panel mp-configuracion" aria-labelledby="mp-configuracion-titulo">
    <div className="mp-configuracion-cabecera"><div><p className="etiqueta-seccion">Tu atención médica</p><h2 id="mp-configuracion-titulo">{modoAdmin ? 'Asignar clínica, especialidad y horarios' : 'Configura dónde y cuándo atiendes'}</h2><p>Elige tu clínica, especialidad y turnos semanales. Las citas duran 30 minutos.</p></div>
      {medico && !editando && <button type="button" className="boton" onClick={() => setEditando(true)}>Editar atención y horarios</button>}
    </div>
    {editando && <form onSubmit={guardar}>
      {cargando ? <p role="status">Cargando clínicas y especialidades…</p> : errorCatalogo ? <div role="alert"><p>No pudimos cargar las opciones.</p><button type="button" className="boton boton-secundario" onClick={() => setIntento(i => i+1)}>Reintentar</button></div> : <>
        <fieldset className="mp-campos-profesionales" disabled={guardando}><legend>1. Datos profesionales</legend>
          <div className="grid grid-2">
            <label>Nombre profesional<input required maxLength={150} value={datos.nombre} onChange={e => cambiar('nombre',e.target.value)} /></label>
            <label>Teléfono de atención <span className="mp-opcional">Opcional</span><input type="tel" maxLength={30} value={datos.telefono} onChange={e => cambiar('telefono',e.target.value)} /></label>
            <label>Especialidad<select required value={datos.especialidad_id} onChange={e => cambiar('especialidad_id',e.target.value)}><option value="">Elige tu especialidad</option>{especialidades.map(e => <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>)}</select></label>
            <label>Clínica donde atiendes<select required value={datos.clinica_id} onChange={e => cambiar('clinica_id',e.target.value)}><option value="">Elige tu clínica</option>{clinicas.map(c => <option key={c.id_clinica} value={c.id_clinica}>{c.nombre} · {c.direccion}</option>)}</select></label>
          </div>
          {(!especialidades.length || !clinicas.length) && <p className="mp-aviso">Faltan clínicas o especialidades en el catálogo. Solicita al administrador que las registre para continuar.</p>}
        </fieldset>
        <fieldset className="mp-editor-horarios" disabled={guardando}><legend>2. Días y turnos de atención</legend><p>Activa tus días de trabajo y añade los turnos que necesites. Horarios de Perú.</p>
          {diasConTurnos.length > 0 && <div className="mp-copiar-turnos">
            <label>Copiar los turnos del
              <select value={origenEfectivo}
                onChange={e => { setOrigenCopia(e.target.value); setAvisoCopia(''); }}>
                {diasConTurnos.map(({ dia, numero }) => <option key={numero} value={numero}>{dia}</option>)}
              </select>
            </label>
            <label>a
              <select value={destinoCopia} onChange={e => { setDestinoCopia(e.target.value); setAvisoCopia(''); }}>
                {Object.entries(DESTINOS_COPIA).map(([id, { texto }]) => <option key={id} value={id}>{texto}</option>)}
              </select>
            </label>
            <button type="button" className="boton boton-secundario boton-mini" onClick={copiarTurnos}>Copiar turnos</button>
            {avisoCopia && <p className="mp-ayuda" role="status">{avisoCopia}</p>}
          </div>}
          {DIAS_ATENCION.map((dia,indice) => {
            const bloques = turnos.map((h,i) => ({ ...h, indice:i })).filter(h => Number(h.dia_semana) === indice+1);
            return <div className="mp-dia-editor" key={dia}>
              <label className="mp-dia-check"><input type="checkbox" checked={bloques.length > 0} onChange={e => { setError(''); setTurnos(lista => e.target.checked ? [...lista,{ dia_semana:indice+1,hora_inicio:'09:00',hora_fin:'13:00' }] : lista.filter(h => Number(h.dia_semana) !== indice+1)); }} />{dia}</label>
              <div className="mp-turnos">{bloques.length ? bloques.map((h,i) => <div className="mp-turno" key={h.indice}>
                <label>Desde<input type="time" step="60" required aria-label={dia+', turno '+(i+1)+', desde'} value={h.hora_inicio} onChange={e => actualizarTurno(h.indice,'hora_inicio',e.target.value)} /></label>
                <label>Hasta<input type="time" step="60" required aria-label={dia+', turno '+(i+1)+', hasta'} value={h.hora_fin} onChange={e => actualizarTurno(h.indice,'hora_fin',e.target.value)} /></label>
                <button type="button" className="boton boton-secundario boton-mini" aria-label={'Quitar turno '+(i+1)+' del '+dia} onClick={() => setTurnos(lista => lista.filter((_,j) => j !== h.indice))}>Quitar</button>
              </div>) : <span className="mp-sin-turno">No atiendo este día</span>}
              {bloques.length > 0 && <button type="button" className="boton boton-secundario boton-mini" onClick={() => setTurnos(lista => [...lista,{ dia_semana:indice+1,hora_inicio:'',hora_fin:'' }])}>Agregar turno</button>}</div>
            </div>;
          })}
        </fieldset>
        <p className="mp-ayuda">Si tienes citas futuras, conserva los turnos que las incluyen. Los cambios se aplican a tu disponibilidad semanal.</p>
        {error && <p className="alerta alerta-error" role="alert">{error}</p>}
        <div className="mp-acciones"><button className="boton" type="submit" disabled={guardando || !especialidades.length || !clinicas.length}>{guardando ? 'Guardando…' : modoAdmin ? 'Asignar perfil médico' : 'Guardar atención y horarios'}</button>
          {medico && <button className="boton boton-secundario" type="button" disabled={guardando} onClick={() => { setEditando(false); setError(''); setDatos(inicial); setTurnos(turnosIniciales()); }}>Cancelar</button>}
        </div>
      </>}
    </form>}
  </section>;
}
