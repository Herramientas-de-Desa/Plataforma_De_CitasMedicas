// Componente: panel del administrador (RF08).
// Gestiona usuarios, médicos, especialidades y supervisa citas.
import { useEffect, useState } from 'react';
import { usuariosService } from '../services/usuariosService';
import { medicosService } from '../services/medicosService';
import { especialidadesService } from '../services/especialidadesService';
import { clinicasService } from '../services/clinicasService';
import { citasService } from '../services/citasService';
import PanelDemandaMedicos from './PanelDemandaMedicos';
import PanelDemandaEspecialidades from './PanelDemandaEspecialidades';

const formateadorFechaAdmin = new Intl.DateTimeFormat('es-PE', {
  day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
});

function formatearFechaAdmin(fecha) {
  if (!fecha) return '—';
  return formateadorFechaAdmin.format(new Date(`${fecha}T00:00:00Z`)).replace('.', '');
}

export default function PanelAdmin() {
  const [pestania, setPestania] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState('');
  const [nuevoMedico, setNuevoMedico] = useState({ nombre: '', telefono: '', especialidad_id: '', clinica_id: '' });
  const [nuevaEsp, setNuevaEsp] = useState('');
  const [busquedaUsuario, setBusquedaUsuario] = useState('');
  const [filtroFechaCita, setFiltroFechaCita] = useState('');
  const [filtroEstadoCita, setFiltroEstadoCita] = useState('');

  async function cargarTodo() {
    setError('');
    try {
      const [u, m, e, cl, ci] = await Promise.all([
        usuariosService.listar(),
        medicosService.listarTodos(),
        especialidadesService.listar(),
        clinicasService.listar(),
        citasService.listarTodas(),
      ]);
      setUsuarios(u); setMedicos(m); setEspecialidades(e); setClinicas(cl); setCitas(ci);
    } catch (e) {
      setError(e.message);
    }
  }

  useEffect(() => { cargarTodo(); }, []);

  async function crearMedico() {
    const { nombre, especialidad_id, clinica_id } = nuevoMedico;
    if (!nombre.trim() || !especialidad_id || !clinica_id) return setError('Completa nombre, especialidad y clínica.');
    try {
      await medicosService.crear({
        ...nuevoMedico,
        especialidad_id: Number(especialidad_id),
        clinica_id: Number(clinica_id),
      });
      setNuevoMedico({ nombre: '', telefono: '', especialidad_id: '', clinica_id: '' });
      cargarTodo();
    } catch (e) { setError(e.message); }
  }

  async function crearEspecialidad() {
    if (!nuevaEsp.trim()) return;
    try {
      await especialidadesService.crear(nuevaEsp.trim());
      setNuevaEsp('');
      cargarTodo();
    } catch (e) { setError(e.message); }
  }

const pestanas = [
  ['usuarios', 'Usuarios'],
  ['medicos', 'Médicos'],
  ['especialidades', 'Especialidades'],
  ['citas', 'Citas'],
  ['demanda-medicos', 'Demanda por médico'],
  ['demanda-especialidades', 'Demanda por especialidad'],
  ['recomendacion-citas', 'Recomendación inteligente'],
];

  const busquedaNormalizada = busquedaUsuario.trim().toLocaleLowerCase('es');
  const usuariosVisibles = usuarios.filter((usuario) =>
    `${usuario.nombres || ''} ${usuario.correo || ''}`.toLocaleLowerCase('es').includes(busquedaNormalizada));
  const citasVisibles = citas.filter((cita) =>
    (!filtroFechaCita || cita.fecha === filtroFechaCita)
    && (!filtroEstadoCita || cita.estado === filtroEstadoCita));

  return (
    <div className="contenedor">
      <div className="encabezado">
        <p className="etiqueta-seccion">Administración</p>
        <h1>Panel de control</h1>
      </div>

      <div className="admin-pestanas" aria-label="Secciones de administración">
        {pestanas.map(([clave, titulo]) => (
          <button
            key={clave}
            className={`boton boton-mini ${pestania === clave ? '' : 'boton-secundario'}`}
            onClick={() => setPestania(clave)}
            aria-pressed={pestania === clave}
          >
            {titulo}
          </button>
        ))}
      </div>
      {error && <p className="alerta alerta-error" style={{ marginBottom: 14 }}>{error}</p>}

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
          <p className="admin-ayuda">Al elegir otro rol, el cambio se guarda inmediatamente.</p>
          <div className="admin-tabla-contenedor"><table className="tabla tabla-tarjetas admin-tabla">
            <thead><tr><th>Nombres</th><th>Correo</th><th>Rol</th><th>Cambiar rol</th></tr></thead>
            <tbody>
              {usuariosVisibles.map((u) => (
                <tr key={u.id_usuario}>
                  <td data-label="Nombres"><strong>{u.nombres}</strong></td>
                  <td data-label="Correo">{u.correo}</td>
                  <td data-label="Rol"><span className={`admin-rol admin-rol-${u.rol}`}>{u.rol === 'medico' ? 'médico' : u.rol}</span></td>
                  <td data-label="Cambiar rol">
                    <select
                      aria-label={`Cambiar rol de ${u.nombres}`}
                      value={u.rol}
                      onChange={async (e) => { await usuariosService.cambiarRol(u.id_usuario, e.target.value); cargarTodo(); }}
                    >
                      <option value="paciente">paciente</option>
                      <option value="medico">médico</option>
                      <option value="admin">admin</option>
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
          <section className="tarjeta admin-seccion" aria-labelledby="admin-medicos-form-titulo">
            <div className="admin-seccion-cabecera">
              <div>
                <h2 id="admin-medicos-form-titulo">Registrar médico</h2>
                <p>Completa sus datos y asigna especialidad y clínica.</p>
              </div>
            </div>
            <div className="grid grid-2 admin-medicos-form">
              <label>Nombre
                <input value={nuevoMedico.nombre}
                  onChange={(e) => setNuevoMedico({ ...nuevoMedico, nombre: e.target.value })} />
              </label>
              <label>Teléfono
                <input value={nuevoMedico.telefono}
                  onChange={(e) => setNuevoMedico({ ...nuevoMedico, telefono: e.target.value })} />
              </label>
              <label>Especialidad
                <select value={nuevoMedico.especialidad_id}
                  onChange={(e) => setNuevoMedico({ ...nuevoMedico, especialidad_id: e.target.value })}>
                  <option value="">Seleccionar</option>
                  {especialidades.map((es) => (
                    <option key={es.id_especialidad} value={es.id_especialidad}>{es.nombre}</option>
                  ))}
                </select>
              </label>
              <label>Clínica
                <select value={nuevoMedico.clinica_id}
                  onChange={(e) => setNuevoMedico({ ...nuevoMedico, clinica_id: e.target.value })}>
                  <option value="">Seleccionar</option>
                  {clinicas.map((c) => (
                    <option key={c.id_clinica} value={c.id_clinica}>{c.nombre}</option>
                  ))}
                </select>
              </label>
            </div>
            <button className="boton admin-guardar-medico" onClick={crearMedico}>Guardar médico</button>
          </section>

          <section className="tarjeta admin-seccion" aria-labelledby="admin-medicos-lista-titulo">
            <div className="admin-seccion-cabecera">
              <div>
                <h2 id="admin-medicos-lista-titulo">Médicos registrados</h2>
                <p>Revisa su clínica, especialidad y disponibilidad.</p>
              </div>
              <span className="admin-seccion-total">{medicos.length} médicos</span>
            </div>
            <div className="admin-tabla-contenedor"><table className="tabla tabla-tarjetas admin-tabla">
              <thead><tr><th>Nombre</th><th>Especialidad</th><th>Clínica</th><th>Disponible</th><th></th></tr></thead>
              <tbody>
                {medicos.map((m) => (
                  <tr key={m.id_medico}>
                    <td data-label="Nombre"><strong>{m.nombre}</strong></td>
                    <td data-label="Especialidad">{m.especialidad?.nombre || '—'}</td>
                    <td data-label="Clínica">{m.clinica?.nombre || '—'}</td>
                    <td data-label="Disponible">
                      <button
                        className={`boton boton-mini ${m.disponible ? 'boton-secundario' : 'boton-peligro'}`}
                        aria-label={`Cambiar disponibilidad de ${m.nombre}: actualmente ${m.disponible ? 'disponible' : 'no disponible'}`}
                        onClick={async () => { await medicosService.cambiarDisponibilidad(m.id_medico, !m.disponible); cargarTodo(); }}
                      >
                        {m.disponible ? 'Disponible' : 'No disponible'}
                      </button>
                    </td>
                    <td data-label="Acciones">
                      <button className="boton boton-peligro boton-mini"
                        onClick={async () => { if (confirm('¿Eliminar médico?')) { await medicosService.eliminar(m.id_medico); cargarTodo(); } }}>
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
                {medicos.length === 0 && <tr><td colSpan="5">No hay médicos registrados.</td></tr>}
              </tbody>
            </table></div>
          </section>
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
          <div className="admin-especialidad-form">
            <label htmlFor="admin-nueva-especialidad">Nueva especialidad</label>
            <input id="admin-nueva-especialidad" placeholder="Nombre de la especialidad" value={nuevaEsp} onChange={(e) => setNuevaEsp(e.target.value)} />
            <button className="boton" onClick={crearEspecialidad}>Agregar</button>
          </div>
          <div className="admin-tabla-contenedor"><table className="tabla tabla-tarjetas admin-tabla">
            <thead><tr><th>ID</th><th>Nombre</th><th></th></tr></thead>
            <tbody>
              {especialidades.map((e) => (
                <tr key={e.id_especialidad}>
                  <td data-label="ID">{e.id_especialidad}</td>
                  <td data-label="Nombre"><strong>{e.nombre}</strong></td>
                  <td data-label="Acciones">
                    <button className="boton boton-peligro boton-mini"
                      onClick={async () => { if (confirm('¿Eliminar especialidad?')) { await especialidadesService.eliminar(e.id_especialidad); cargarTodo(); } }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {especialidades.length === 0 && <tr><td colSpan="3">No hay especialidades registradas.</td></tr>}
            </tbody>
          </table></div>
        </section>
      )}

      {pestania === 'citas' && (
        <section className="tarjeta admin-seccion" aria-labelledby="admin-citas-titulo">
          <div className="admin-seccion-cabecera">
            <div>
              <h2 id="admin-citas-titulo">Citas</h2>
              <p>Consulta las reservas y su estado actual.</p>
            </div>
            <span className="admin-seccion-total">{citasVisibles.length} de {citas.length} citas</span>
          </div>
          <div className="admin-filtros">
            <label htmlFor="admin-filtro-fecha-cita">Fecha
              <input id="admin-filtro-fecha-cita" type="date" value={filtroFechaCita} onChange={(e) => setFiltroFechaCita(e.target.value)} />
            </label>
            <label htmlFor="admin-filtro-estado-cita">Estado
              <select id="admin-filtro-estado-cita" value={filtroEstadoCita} onChange={(e) => setFiltroEstadoCita(e.target.value)}>
                <option value="">Todos los estados</option>
                <option value="pendiente">Pendiente</option>
                <option value="confirmada">Confirmada</option>
                <option value="atendida">Atendida</option>
                <option value="cancelada">Cancelada</option>
              </select>
            </label>
            {(filtroFechaCita || filtroEstadoCita) && (
              <button className="boton boton-secundario boton-mini" onClick={() => { setFiltroFechaCita(''); setFiltroEstadoCita(''); }}>
                Limpiar filtros
              </button>
            )}
          </div>
          <div className="admin-tabla-contenedor"><table className="tabla tabla-tarjetas admin-tabla">
            <thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Médico</th><th>Clínica</th><th>Estado</th></tr></thead>
            <tbody>
              {citasVisibles.map((c) => (
                <tr key={c.id_cita}>
                  <td data-label="Fecha"><strong>{formatearFechaAdmin(c.fecha)}</strong></td>
                  <td data-label="Hora">{c.hora.slice(0, 5)}</td>
                  <td data-label="Paciente">{c.paciente}</td>
                  <td data-label="Médico">{c.medico}</td>
                  <td data-label="Clínica">{c.clinica}</td>
                  <td data-label="Estado"><span className={`estado estado-${c.estado}`}>{c.estado}</span></td>
                </tr>
              ))}
              {citasVisibles.length === 0 && (
                <tr><td colSpan="6">{citas.length ? 'No hay citas que coincidan con los filtros.' : 'No hay citas registradas.'}</td></tr>
              )}
            </tbody>
          </table></div>
        </section>
      )}

{pestania === 'demanda-medicos' && (
  <PanelDemandaMedicos />
)}

{pestania === 'demanda-especialidades' && (
  <PanelDemandaEspecialidades />
)}

    </div>
  );
}
