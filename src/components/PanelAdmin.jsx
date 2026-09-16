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
        <div className="tarjeta" style={{ overflowX: 'auto' }}>
          <table className="tabla tabla-tarjetas">
            <thead><tr><th>Nombres</th><th>Correo</th><th>Rol</th><th>Cambiar rol</th></tr></thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id_usuario}>
                  <td data-label="Nombres">{u.nombres}</td>
                  <td data-label="Correo">{u.correo}</td>
                  <td data-label="Rol"><span className="chip-rol">{u.rol}</span></td>
                  <td data-label="Cambiar rol">
                    <select
                      value={u.rol}
                      onChange={async (e) => { await usuariosService.cambiarRol(u.id_usuario, e.target.value); cargarTodo(); }}
                    >
                      <option value="paciente">paciente</option>
                      <option value="medico">medico</option>
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pestania === 'medicos' && (
        <div className="grid">
          <div className="tarjeta">
            <h3 style={{ marginBottom: 10 }}>Registrar médico</h3>
            <div className="grid grid-2">
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
            <button className="boton" style={{ marginTop: 14 }} onClick={crearMedico}>Guardar médico</button>
          </div>

          <div className="tarjeta" style={{ overflowX: 'auto' }}>
            <table className="tabla tabla-tarjetas">
              <thead><tr><th>Nombre</th><th>Especialidad</th><th>Clínica</th><th>Disponible</th><th></th></tr></thead>
              <tbody>
                {medicos.map((m) => (
                  <tr key={m.id_medico}>
                    <td data-label="Nombre">{m.nombre}</td>
                    <td data-label="Especialidad">{m.especialidad?.nombre}</td>
                    <td data-label="Clínica">{m.clinica?.nombre}</td>
                    <td data-label="Disponible">
                      <button
                        className={`boton boton-mini ${m.disponible ? 'boton-secundario' : 'boton-peligro'}`}
                        onClick={async () => { await medicosService.cambiarDisponibilidad(m.id_medico, !m.disponible); cargarTodo(); }}
                      >
                        {m.disponible ? 'Sí' : 'No'}
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
              </tbody>
            </table>
          </div>
        </div>
      )}

      {pestania === 'especialidades' && (
        <div className="tarjeta">
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, maxWidth: 480 }}>
            <input placeholder="Nueva especialidad" value={nuevaEsp} onChange={(e) => setNuevaEsp(e.target.value)} />
            <button className="boton" onClick={crearEspecialidad}>Agregar</button>
          </div>
          <table className="tabla tabla-tarjetas">
            <thead><tr><th>ID</th><th>Nombre</th><th></th></tr></thead>
            <tbody>
              {especialidades.map((e) => (
                <tr key={e.id_especialidad}>
                  <td data-label="ID">{e.id_especialidad}</td>
                  <td data-label="Nombre">{e.nombre}</td>
                  <td data-label="Acciones">
                    <button className="boton boton-peligro boton-mini"
                      onClick={async () => { if (confirm('¿Eliminar especialidad?')) { await especialidadesService.eliminar(e.id_especialidad); cargarTodo(); } }}>
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pestania === 'citas' && (
        <div className="tarjeta" style={{ overflowX: 'auto' }}>
          <table className="tabla tabla-tarjetas">
            <thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Médico</th><th>Clínica</th><th>Estado</th></tr></thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id_cita}>
                  <td data-label="Fecha">{c.fecha}</td>
                  <td data-label="Hora">{c.hora.slice(0, 5)}</td>
                  <td data-label="Paciente">{c.paciente}</td>
                  <td data-label="Médico">{c.medico}</td>
                  <td data-label="Clínica">{c.clinica}</td>
                  <td data-label="Estado"><span className={`estado estado-${c.estado}`}>{c.estado}</span></td>
                </tr>
              ))}
              {citas.length === 0 && <tr><td colSpan="6">No hay citas registradas.</td></tr>}
            </tbody>
          </table>
        </div>
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
