// Componente: panel del administrador (RF08).
// Gestiona usuarios, médicos, especialidades, clínicas y supervisa citas.
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import AdminNavegacion from '../layout/AdminNavegacion';
import { NOMBRES_ROL, seccionAdmin } from '../layout/navegacion';
import { usuariosService } from '../../services/usuariosService';
import { medicosService } from '../../services/medicosService';
import { especialidadesService } from '../../services/especialidadesService';
import { clinicasService } from '../../services/clinicasService';
import { citasService } from '../../services/citasService';
import { fechaActualEnIca, horaActualEnIca } from '../../services/fechas';
import PanelDemandaMedicos from './demanda/PanelDemandaMedicos';
import ConfiguracionMedica from '../medico/ConfiguracionMedica';
import PanelDemandaEspecialidades from './demanda/PanelDemandaEspecialidades';
import AdminClinicas from './AdminClinicas';
import AdminCitas from './AdminCitas';
import DialogoConfirmacion from '../comun/DialogoConfirmacion';
import { useAvisos } from '../../context/AvisosContext';

const ACTIVAS = ['pendiente', 'confirmada'];

export default function PanelAdmin() {
  const ubicacion = useLocation();
  const pestania = seccionAdmin(ubicacion.search);
  const [cargando, setCargando] = useState(true);
  const [usuarios, setUsuarios] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [conHorarios, setConHorarios] = useState(new Set());
  const [error, setError] = useState('');
  const avisar = useAvisos();
  const [usuarioMedico, setUsuarioMedico] = useState('');
  const [nuevaEsp, setNuevaEsp] = useState('');
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [busquedaMedico, setBusquedaMedico] = useState('');
  const [medicoEditado, setMedicoEditado] = useState(null); // { medico, horarios }
  const [confirmacion, setConfirmacion] = useState(null); // diálogo abierto y su acción
  const [procesando, setProcesando] = useState(false);
  const [errorDialogo, setErrorDialogo] = useState('');

  // Cada acción recarga solo los datos que cambió.
  const recargar = {
    usuarios: async () => setUsuarios(await usuariosService.listar()),
    medicos: async () => {
      const [m, h] = await Promise.all([medicosService.listarTodos(), medicosService.idsConHorarios()]);
      setMedicos(m); setConHorarios(h);
    },
    especialidades: async () => setEspecialidades(await especialidadesService.listar()),
    clinicas: async () => setClinicas(await clinicasService.listar()),
    citas: async () => setCitas(await citasService.listarTodas()),
  };

  async function cargarTodo() {
    setError('');
    setCargando(true);
    try {
      await Promise.all(Object.values(recargar).map((cargar) => cargar()));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargarTodo(); }, []);
  useEffect(() => { setMedicoEditado(null); }, [pestania]);

  async function ejecutar(accion, mensaje) {
    setError('');
   
    try {
      await accion();
      if (mensaje) avisar(mensaje);
    } catch (e) {
      setError(e.message);
    }
  }

  function abrirConfirmacion(datos) {
    setErrorDialogo('');
    setConfirmacion(datos);
  }

  async function confirmar() {
    setProcesando(true);
    setErrorDialogo('');
    try {
      await confirmacion.accion();
      avisar(confirmacion.exito);
      setConfirmacion(null);
    } catch (e) {
      setErrorDialogo(e.message);
    } finally {
      setProcesando(false);
    }
  }

  async function crearEspecialidad() {
    if (!nuevaEsp.trim()) return;
    await ejecutar(async () => {
      await especialidadesService.crear(nuevaEsp.trim());
      setNuevaEsp('');
      await recargar.especialidades();
    }, `Agregaste la especialidad ${nuevaEsp.trim()}.`);
  }

  function pedirCambioRol(usuario, rol) {
    abrirConfirmacion({
      titulo: rol === 'admin' ? '¿Dar permisos de administrador?' : '¿Cambiar el rol?',
      cuerpo: <>
        <p><strong>{usuario.nombres}</strong> ({usuario.correo}) pasará de <strong>{NOMBRES_ROL[usuario.rol]}</strong> a <strong>{NOMBRES_ROL[rol]}</strong>.</p>
        {rol === 'admin' && <p>Podrá ver todos los datos, cambiar roles y eliminar registros.</p>}
      </>,
      textoConfirmar: 'Sí, cambiar rol',
      peligro: rol === 'admin',
      exito: `${usuario.nombres} ahora es ${NOMBRES_ROL[rol].toLowerCase()}.`,
      accion: async () => { await usuariosService.cambiarRol(usuario.id_usuario, rol); await recargar.usuarios(); },
    });
  }

  function pedirEliminarMedico(m) {
    const suyas = citas.filter((c) => c.id_medico === m.id_medico);
    const ahora = `${fechaActualEnIca()} ${horaActualEnIca()}`;
    const futuras = suyas.filter((c) => ACTIVAS.includes(c.estado) && `${c.fecha} ${c.hora.slice(0, 5)}` > ahora);
    if (futuras.length) {
      abrirConfirmacion({
        titulo: 'No se puede eliminar todavía',
        cuerpo: <>
          <p><strong>{m.nombre}</strong> tiene <strong>{futuras.length}</strong> {futuras.length === 1 ? 'cita futura' : 'citas futuras'} pendientes o confirmadas.</p>
          <p>Cancélalas desde la sección Citas antes de eliminarlo. Si solo quieres que deje de recibir reservas, márcalo como no disponible.</p>
        </>,
        textoConfirmar: m.disponible ? 'Marcar como no disponible' : 'Entendido',
        exito: m.disponible ? `${m.nombre} ya no recibe nuevas reservas.` : '',
        accion: async () => {
          if (!m.disponible) return;
          await medicosService.cambiarDisponibilidad(m.id_medico, false);
          await recargar.medicos();
        },
      });
      return;
    }
    abrirConfirmacion({
      titulo: `¿Eliminar a ${m.nombre}?`,
      cuerpo: <>
        {suyas.length > 0
          ? <p>También se borrarán <strong>{suyas.length}</strong> {suyas.length === 1 ? 'cita' : 'citas'} de su historial, sus horarios y sus predicciones. <strong>No se puede deshacer.</strong></p>
          : <p>Se borrarán sus horarios. Esta acción no se puede deshacer.</p>}
        <p>Si solo quieres que deje de recibir reservas, usa "No disponible".</p>
      </>,
      textoConfirmar: 'Sí, eliminar médico',
      peligro: true,
      exito: `Eliminaste a ${m.nombre}.`,
      accion: async () => {
        await medicosService.eliminar(m.id_medico);
        await Promise.all([recargar.medicos(), recargar.citas()]);
      },
    });
  }

  function pedirEliminarEspecialidad(e) {
    const enUso = medicos.filter((m) => m.especialidad?.id_especialidad === e.id_especialidad).length;
    abrirConfirmacion({
      titulo: enUso ? 'Especialidad en uso' : `¿Eliminar ${e.nombre}?`,
      cuerpo: enUso
        ? <p><strong>{enUso}</strong> {enUso === 1 ? 'médico tiene' : 'médicos tienen'} esta especialidad. Asígnales otra antes de eliminarla.</p>
        : <p>Dejará de aparecer en los filtros y formularios.</p>,
      textoConfirmar: enUso ? 'Entendido' : 'Sí, eliminar',
      peligro: !enUso,
      exito: enUso ? '' : `Eliminaste la especialidad ${e.nombre}.`,
      accion: async () => {
        if (enUso) return;
        await especialidadesService.eliminar(e.id_especialidad);
        await recargar.especialidades();
      },
    });
  }

  async function editarMedico(m) {
    await ejecutar(async () => {
      setMedicoEditado({ medico: m, horarios: await medicosService.obtenerHorarios(m.id_medico) });
    });
  }

  // --- Datos derivados ---
  const hoy = fechaActualEnIca();
  const citasHoy = citas.filter((c) => c.fecha === hoy && c.estado !== 'cancelada');
  const porConfirmar = citas.filter((c) => c.estado === 'pendiente' && c.fecha >= hoy);
  const medicosSinHorario = medicos.filter((m) => !conHorarios.has(m.id_medico));
  const clinicasSinUbicacion = clinicas.filter((c) => c.latitud == null || c.longitud == null);

  const cuentasSinMedico = usuarios.filter(u => u.rol !== 'admin' && !medicos.some(m => m.usuario_id === u.id_usuario));
  const cuentaSeleccionada = cuentasSinMedico.find(u => u.id_usuario === usuarioMedico);
  const busquedaNormalizada = busquedaUsuario.trim().toLocaleLowerCase('es');
  const usuariosVisibles = usuarios.filter((usuario) =>
    `${usuario.nombres || ''} ${usuario.correo || ''}`.toLocaleLowerCase('es').includes(busquedaNormalizada));
  const busquedaMedicoNormalizada = busquedaMedico.trim().toLocaleLowerCase('es');
  const medicosVisibles = medicos.filter(m => {
    const correo = usuarios.find(u => u.id_usuario === m.usuario_id)?.correo || '';
    return `${m.id_medico} ${m.nombre} ${correo}`.toLocaleLowerCase('es').includes(busquedaMedicoNormalizada);
  });

  return (
    <div className="contenedor mc-admin-layout">
      <AdminNavegacion />
      <div className="mc-admin-contenido">
      <div className="encabezado">
        <p className="etiqueta-seccion">Administración</p>
        <h1>Panel de control</h1>
      </div>

      {error && <p className="alerta alerta-error" role="alert" style={{ marginBottom: 14 }}>{error}</p>}

      {pestania === 'resumen' && <section aria-label="Resumen de administración">
        <p style={{ marginBottom: 20 }}>Gestiona las cuentas, los profesionales y las citas desde un solo lugar.</p>
        {cargando ? <p role="status">Consultando el resumen…</p> : error ? <button type="button" className="boton" onClick={cargarTodo}>Reintentar</button> : <>
          <div className="mc-admin-resumen">
            {[['citas', 'Citas de hoy', citasHoy.length, 'Ver citas'],
              ['citas', 'Por confirmar', porConfirmar.length, 'Revisar pendientes'],
              ['medicos', 'Médicos', medicos.length, 'Ver médicos'],
              ['usuarios', 'Usuarios', usuarios.length, 'Ver usuarios']]
              .map(([id, titulo, total, enlace]) => <Link className="tarjeta" to={`/admin?seccion=${id}`} key={titulo}>
                <span>{titulo}</span><strong>{total}</strong><small>{enlace} <span aria-hidden="true">→</span></small>
              </Link>)}
          </div>
          {(medicosSinHorario.length > 0 || clinicasSinUbicacion.length > 0 || porConfirmar.length > 0) && (
            <div className="tarjeta admin-pendientes">
              <h2>Requiere atención</h2>
              <ul>
                {porConfirmar.length > 0 && <li><strong>{porConfirmar.length}</strong> {porConfirmar.length === 1 ? 'cita espera' : 'citas esperan'} confirmación del médico. <Link to="/admin?seccion=citas">Ver citas</Link></li>}
                {medicosSinHorario.length > 0 && <li><strong>{medicosSinHorario.length}</strong> {medicosSinHorario.length === 1 ? 'médico no tiene' : 'médicos no tienen'} horarios, así que no reciben reservas: {medicosSinHorario.slice(0, 3).map((m) => m.nombre).join(', ')}{medicosSinHorario.length > 3 ? '…' : ''}. <Link to="/admin?seccion=medicos">Revisar</Link></li>}
                {clinicasSinUbicacion.length > 0 && <li><strong>{clinicasSinUbicacion.length}</strong> {clinicasSinUbicacion.length === 1 ? 'clínica no aparece' : 'clínicas no aparecen'} en el mapa por falta de ubicación. <Link to="/admin?seccion=clinicas">Revisar</Link></li>}
              </ul>
            </div>
          )}
        </>}
      </section>}

      {pestania === 'usuarios' && (
        <section className="tarjeta admin-seccion" aria-labelledby="admin-usuarios-titulo">
          <div className="admin-seccion-cabecera">
            <div>
              <h2 id="admin-usuarios-titulo">Usuarios</h2>
              <p>Consulta las cuentas y administra sus roles.</p>
            </div>
            <span className="admin-seccion-total">{usuariosVisibles.length} de {usuarios.length} usuarios</span>
          </div>
          <div className="admin-filtros">
            <label htmlFor="admin-buscar-usuario">Buscar por nombre o correo
              <input
                id="admin-buscar-usuario"
                type="search"
                placeholder="Escribe un nombre o correo"
                value={busquedaUsuario}
                onChange={(e) => setBusquedaUsuario(e.target.value)}
              />
            </label>
          </div>
          <p className="admin-ayuda">El rol médico se asigna desde la pestaña Médicos junto con la clínica, especialidad y horarios.</p>
          <div className="admin-tabla-contenedor"><table className="tabla tabla-tarjetas admin-tabla">
            <thead><tr><th>Nombres</th><th>Correo</th><th>Rol</th><th>Cambiar rol</th></tr></thead>
            <tbody>
              {usuariosVisibles.map((u) => (
                <tr key={u.id_usuario}>
                  <td data-label="Nombres"><strong>{u.nombres}</strong></td>
                  <td data-label="Correo">{u.correo}</td>
                  <td data-label="Rol"><span className={`admin-rol admin-rol-${u.rol}`}>{NOMBRES_ROL[u.rol] || u.rol}</span></td>
                  <td data-label="Cambiar rol">
                    <select
                      aria-label={`Cambiar rol de ${u.nombres}`}
                      value={u.rol}
                      disabled={medicos.some(m => m.usuario_id === u.id_usuario)}
                      title={medicos.some(m => m.usuario_id === u.id_usuario) ? 'Tiene un perfil médico: elimínalo antes de cambiar el rol.' : undefined}
                      onChange={(e) => pedirCambioRol(u, e.target.value)}
                    >
                      <option value="paciente">Paciente</option>
                      {u.rol === 'medico' && <option value="medico">Médico</option>}
                      <option value="admin">Administrador</option>
                    </select>
                  </td>
                </tr>
              ))}
              {usuariosVisibles.length === 0 && (
                <tr><td colSpan="4">{usuarios.length ? 'No hay usuarios que coincidan con la búsqueda.' : 'No hay usuarios registrados.'}</td></tr>
              )}
            </tbody>
          </table></div>
        </section>
      )}

      {pestania === 'medicos' && (
        <div className="grid admin-medicos-layout">
          {medicoEditado ? (
            <section className="tarjeta admin-seccion" aria-labelledby="admin-medico-editar-titulo">
              <div className="admin-seccion-cabecera">
                <div>
                  <h2 id="admin-medico-editar-titulo">Editar a {medicoEditado.medico.nombre}</h2>
                  <p>Cambia su clínica, especialidad, datos de contacto u horarios.</p>
                </div>
                <button className="boton boton-secundario" type="button" onClick={() => setMedicoEditado(null)}>Volver a la lista</button>
              </div>
              <ConfiguracionMedica key={medicoEditado.medico.id_medico} modoAdmin usuarioId={medicoEditado.medico.usuario_id}
                medico={medicoEditado.medico} horarios={medicoEditado.horarios} nombreCuenta={medicoEditado.medico.nombre}
                onGuardado={async () => {
                  const nombre = medicoEditado.medico.nombre;
                  setMedicoEditado(null);
                  await ejecutar(recargar.medicos, `Guardaste los cambios de ${nombre}.`);
                }} />
            </section>
          ) : <>
          <section className="tarjeta admin-seccion" aria-labelledby="admin-medicos-form-titulo">
            <h2 id="admin-medicos-form-titulo">Asignar perfil médico</h2>
            <p>Selecciona una cuenta registrada. La asignación inicial del rol, la clínica, la especialidad y los horarios se guarda junta.</p>
            <label className="admin-seleccionar-medico">Cuenta del profesional
              <select value={usuarioMedico} onChange={e => setUsuarioMedico(e.target.value)}>
                <option value="">Seleccionar cuenta</option>
                {cuentasSinMedico.map(u => <option key={u.id_usuario} value={u.id_usuario}>{u.nombres} · {u.correo}</option>)}
              </select>
            </label>
            {cuentaSeleccionada && <ConfiguracionMedica key={usuarioMedico} modoAdmin usuarioId={usuarioMedico} medico={null} horarios={[]} nombreCuenta={cuentaSeleccionada.nombres}
              onGuardado={() => {
                const nombre = cuentaSeleccionada.nombres;
                setUsuarioMedico('');
                ejecutar(() => Promise.all([recargar.medicos(), recargar.usuarios()]), `${nombre} ya es médico.`);
              }} />}
            {!cuentasSinMedico.length && <p className="admin-ayuda">No hay cuentas pendientes de asignación.</p>}
          </section>

          <section className="tarjeta admin-seccion" aria-labelledby="admin-medicos-lista-titulo">
            <div className="admin-seccion-cabecera">
              <div>
                <h2 id="admin-medicos-lista-titulo">Médicos registrados</h2>
                <p>Consulta su clínica y especialidad, edítalos o pausa sus reservas.</p>
              </div>
              <span className="admin-seccion-total">{medicosVisibles.length} de {medicos.length} médicos</span>
            </div>
            <div className="admin-filtros"><label htmlFor="admin-buscar-medico">Buscar por ID, nombre o correo
              <input id="admin-buscar-medico" type="search" value={busquedaMedico} onChange={e => setBusquedaMedico(e.target.value)} placeholder="Ej. 12, María o correo" />
            </label></div>
            <div className="admin-tabla-contenedor"><table className="tabla tabla-tarjetas admin-tabla">
              <thead><tr><th>ID</th><th>Nombre</th><th>Especialidad</th><th>Clínica</th><th>Reservas</th><th></th></tr></thead>
              <tbody>
                {medicosVisibles.map((m) => (
                  <tr key={m.id_medico}>
                    <td data-label="ID"><strong>#{m.id_medico}</strong></td>
                    <td data-label="Nombre">
                      <strong>{m.nombre}</strong>
                      <p className="admin-ayuda">{m.usuario_id ? `Cuenta: ${usuarios.find((u) => u.id_usuario === m.usuario_id)?.correo || 'vinculada'}` : 'Sin cuenta vinculada'}</p>
                      {!conHorarios.has(m.id_medico) && <p className="admin-alerta-texto">Sin horarios</p>}
                    </td>
                    <td data-label="Especialidad">{m.especialidad?.nombre || '—'}</td>
                    <td data-label="Clínica">{m.clinica?.nombre || '—'}</td>
                    <td data-label="Reservas">
                      <button
                        className={`boton boton-mini ${m.disponible ? 'boton-secundario' : 'boton-peligro'}`}
                        aria-label={`Cambiar disponibilidad de ${m.nombre}: actualmente ${m.disponible ? 'disponible' : 'no disponible'}`}
                        onClick={() => ejecutar(async () => {
                          await medicosService.cambiarDisponibilidad(m.id_medico, !m.disponible);
                          await recargar.medicos();
                        }, m.disponible ? `${m.nombre} ya no recibe nuevas reservas.` : `${m.nombre} vuelve a recibir reservas.`)}
                      >
                        {m.disponible ? 'Disponible' : 'No disponible'}
                      </button>
                    </td>
                    <td data-label="Acciones" className="acciones-tabla">
                      <button className="boton boton-secundario boton-mini" type="button" disabled={!m.usuario_id}
                        title={m.usuario_id ? undefined : 'Vincula una cuenta para poder editarlo.'} onClick={() => editarMedico(m)}>Editar</button>
                      <button className="boton boton-peligro boton-mini" type="button" onClick={() => pedirEliminarMedico(m)}>Eliminar</button>
                    </td>
                  </tr>
                ))}
                {medicosVisibles.length === 0 && <tr><td colSpan="6">{medicos.length ? 'No hay médicos que coincidan con la búsqueda.' : 'No hay médicos registrados.'}</td></tr>}
              </tbody>
            </table></div>
          </section>
          </>}
        </div>
      )}

      {pestania === 'especialidades' && (
        <section className="tarjeta admin-seccion" aria-labelledby="admin-especialidades-titulo">
          <div className="admin-seccion-cabecera">
            <div>
              <h2 id="admin-especialidades-titulo">Especialidades</h2>
              <p>Organiza las especialidades disponibles para los médicos.</p>
            </div>
            <span className="admin-seccion-total">{especialidades.length} especialidades</span>
          </div>
          <form className="admin-especialidad-form" onSubmit={(e) => { e.preventDefault(); crearEspecialidad(); }}>
            <label htmlFor="admin-nueva-especialidad">Nueva especialidad</label>
            <input id="admin-nueva-especialidad" placeholder="Nombre de la especialidad" value={nuevaEsp} onChange={(e) => setNuevaEsp(e.target.value)} />
            <button className="boton" type="submit" disabled={!nuevaEsp.trim()}>Agregar</button>
          </form>
          <div className="admin-tabla-contenedor"><table className="tabla tabla-tarjetas admin-tabla">
            <thead><tr><th>ID</th><th>Nombre</th><th>Médicos</th><th></th></tr></thead>
            <tbody>
              {especialidades.map((e) => (
                <tr key={e.id_especialidad}>
                  <td data-label="ID">{e.id_especialidad}</td>
                  <td data-label="Nombre"><strong>{e.nombre}</strong></td>
                  <td data-label="Médicos">{medicos.filter((m) => m.especialidad?.id_especialidad === e.id_especialidad).length}</td>
                  <td data-label="Acciones">
                    <button className="boton boton-peligro boton-mini" type="button" onClick={() => pedirEliminarEspecialidad(e)}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {especialidades.length === 0 && <tr><td colSpan="4">No hay especialidades registradas.</td></tr>}
            </tbody>
          </table></div>
        </section>
      )}

      {pestania === 'clinicas' && (
        <AdminClinicas clinicas={clinicas} medicos={medicos} onCambio={recargar.clinicas} />
      )}

      {pestania === 'citas' && (
        <AdminCitas citas={citas} onCambio={recargar.citas} />
      )}

      {pestania === 'demanda-medicos' && (
        <PanelDemandaMedicos />
      )}

      {pestania === 'demanda-especialidades' && (
        <PanelDemandaEspecialidades />
      )}

      </div>

      {confirmacion && (
        <DialogoConfirmacion
          titulo={confirmacion.titulo}
          textoConfirmar={confirmacion.textoConfirmar}
          textoCancelar="Volver"
          peligro={confirmacion.peligro}
          procesando={procesando}
          error={errorDialogo}
          onConfirmar={confirmar}
          onCancelar={() => setConfirmacion(null)}
        >
          {confirmacion.cuerpo}
        </DialogoConfirmacion>
      )}
    </div>
  );
}
