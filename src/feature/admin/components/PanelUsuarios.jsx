import { useState } from 'react';
import { usuariosService } from '../../../feature/usuarios/services/usuariosService';

export default function PanelUsuarios({
  usuarios,
  medicos,
  onActualizar,
  onError,
}) {
  const [busqueda, setBusqueda] = useState('');

  const normalizada = busqueda.trim().toLocaleLowerCase('es');

  const visibles = usuarios.filter((u) =>
    `${u.nombres || ''} ${u.correo || ''}`
      .toLocaleLowerCase('es')
      .includes(normalizada)
  );

  async function cambiarRol(usuario, rol) {
    try {
      await usuariosService.cambiarRol(usuario.id_usuario, rol);
      await onActualizar();
    } catch (e) {
      onError(e.message || 'No se pudo cambiar el rol.');
    }
  }

  return (
    <section className="tarjeta admin-seccion" aria-labelledby="admin-usuarios-titulo">
      <div className="admin-seccion-cabecera">
        <div>
          <h2 id="admin-usuarios-titulo">Usuarios</h2>
          <p>Consulta las cuentas y administra sus roles.</p>
        </div>
        <span className="admin-seccion-total">
          {visibles.length} de {usuarios.length} usuarios
        </span>
      </div>

      <div className="admin-filtros">
        <label htmlFor="admin-buscar-usuario">
          Buscar por nombre o correo
          <input
            id="admin-buscar-usuario"
            type="search"
            placeholder="Escribe un nombre o correo"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </label>
      </div>

      <p className="admin-ayuda">
        El rol médico se asigna desde la pestaña Médicos junto con su
        clínica, especialidad y horarios.
      </p>

      <div className="admin-tabla-contenedor">
        <table className="tabla tabla-tarjetas admin-tabla">
          <thead>
            <tr>
              <th>Nombres</th>
              <th>Correo</th>
              <th>Rol</th>
              <th>Cambiar rol</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((u) => {
              const tienePerfilMedico = medicos.some(
                (m) => m.usuario_id === u.id_usuario
              );

              return (
                <tr key={u.id_usuario}>
                  <td data-label="Nombres"><strong>{u.nombres}</strong></td>
                  <td data-label="Correo">{u.correo}</td>
                  <td data-label="Rol">
                    <span className={`admin-rol admin-rol-${u.rol}`}>
                      {u.rol === 'medico' ? 'médico' : u.rol}
                    </span>
                  </td>
                  <td data-label="Cambiar rol">
                    <select
                      aria-label={`Cambiar rol de ${u.nombres}`}
                      value={u.rol}
                      disabled={tienePerfilMedico}
                      onChange={(e) => cambiarRol(u, e.target.value)}
                    >
                      <option value="paciente">paciente</option>
                      {u.rol === 'medico' && (
                        <option value="medico">médico</option>
                      )}
                      <option value="admin">admin</option>
                    </select>
                  </td>
                </tr>
              );
            })}

            {visibles.length === 0 && (
              <tr>
                <td colSpan="4">
                  {usuarios.length
                    ? 'No hay usuarios que coincidan con la búsqueda.'
                    : 'No hay usuarios registrados.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
