import { useState } from 'react';
import { medicosService } from '../../medicos/services/medicosService';
import ConfiguracionMedica from './ConfiguracionMedica';

export default function PanelMedicos({
  usuarios,
  medicos,
  onActualizar,
  onError,
}) {
  const [usuarioMedico, setUsuarioMedico] = useState('');
  const [busqueda, setBusqueda] = useState('');

  const cuentasSinMedico = usuarios.filter(
    (u) =>
      u.rol !== 'admin' &&
      !medicos.some((m) => m.usuario_id === u.id_usuario)
  );

  const cuentaSeleccionada = cuentasSinMedico.find(
    (u) => String(u.id_usuario) === String(usuarioMedico)
  );

  const normalizada = busqueda.trim().toLocaleLowerCase('es');

  const visibles = medicos.filter((m) => {
    const correo =
      usuarios.find((u) => u.id_usuario === m.usuario_id)?.correo || '';

    return `${m.id_medico} ${m.nombre} ${correo}`
      .toLocaleLowerCase('es')
      .includes(normalizada);
  });

  async function cambiarDisponibilidad(medico) {
    try {
      await medicosService.cambiarDisponibilidad(
        medico.id_medico,
        !medico.disponible
      );
      await onActualizar();
    } catch (e) {
      onError(e.message || 'No se pudo cambiar la disponibilidad.');
    }
  }

  async function eliminarMedico(medico) {
    if (!window.confirm(`¿Eliminar el perfil médico de ${medico.nombre}?`)) {
      return;
    }

    try {
      await medicosService.eliminar(medico.id_medico);
      await onActualizar();
    } catch (e) {
      onError(e.message || 'No se pudo eliminar el médico.');
    }
  }

  return (
    <div className="grid admin-medicos-layout">
      <section className="tarjeta admin-seccion">
        <h2>Asignar perfil médico</h2>
        <p>
          Selecciona una cuenta registrada. La asignación inicial del rol,
          la clínica, la especialidad y los horarios se guarda junta.
        </p>

        <label className="admin-seleccionar-medico">
          Cuenta del profesional
          <select
            value={usuarioMedico}
            onChange={(e) => setUsuarioMedico(e.target.value)}
          >
            <option value="">Seleccionar cuenta</option>
            {cuentasSinMedico.map((u) => (
              <option key={u.id_usuario} value={u.id_usuario}>
                {u.nombres} · {u.correo}
              </option>
            ))}
          </select>
        </label>

        {cuentaSeleccionada && (
          <ConfiguracionMedica
            key={usuarioMedico}
            modoAdmin
            usuarioId={usuarioMedico}
            medico={null}
            horarios={[]}
            nombreCuenta={cuentaSeleccionada.nombres}
            onGuardado={async () => {
              setUsuarioMedico('');
              await onActualizar();
            }}
          />
        )}

        {!cuentasSinMedico.length && (
          <p className="admin-ayuda">
            No hay cuentas pendientes de asignación.
          </p>
        )}
      </section>

      <section className="tarjeta admin-seccion">
        <div className="admin-seccion-cabecera">
          <div>
            <h2>Médicos registrados</h2>
            <p>Consulta el ID asignado, la clínica y la especialidad.</p>
          </div>
          <span className="admin-seccion-total">
            {visibles.length} de {medicos.length} médicos
          </span>
        </div>

        <div className="admin-filtros">
          <label htmlFor="admin-buscar-medico">
            Buscar por ID, nombre o correo
            <input
              id="admin-buscar-medico"
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Ej. 12, María o correo"
            />
          </label>
        </div>

        <div className="admin-tabla-contenedor">
          <table className="tabla tabla-tarjetas admin-tabla">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nombre</th>
                <th>Especialidad</th>
                <th>Clínica</th>
                <th>Disponible</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((m) => {
                const correo = usuarios.find(
                  (u) => u.id_usuario === m.usuario_id
                )?.correo;

                return (
                  <tr key={m.id_medico}>
                    <td data-label="ID"><strong>#{m.id_medico}</strong></td>

                    <td data-label="Nombre">
                      <strong>{m.nombre}</strong>
                      <p className="admin-ayuda">
                        {m.usuario_id
                          ? `Cuenta: ${correo || 'vinculada'}`
                          : 'Sin cuenta vinculada'}
                      </p>
                    </td>

                    <td data-label="Especialidad">
                      {m.especialidad?.nombre || '—'}
                    </td>

                    <td data-label="Clínica">
                      {m.clinica?.nombre || '—'}
                    </td>

                    <td data-label="Disponible">
                      <button
                        type="button"
                        className={`boton boton-mini ${
                          m.disponible
                            ? 'boton-secundario'
                            : 'boton-peligro'
                        }`}
                        aria-label={`Cambiar disponibilidad de ${m.nombre}`}
                        onClick={() => cambiarDisponibilidad(m)}
                      >
                        {m.disponible ? 'Disponible' : 'No disponible'}
                      </button>
                    </td>

                    <td data-label="Acciones">
                      <button
                        type="button"
                        className="boton boton-peligro boton-mini"
                        onClick={() => eliminarMedico(m)}
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}

              {visibles.length === 0 && (
                <tr>
                  <td colSpan="6">
                    {medicos.length
                      ? 'No hay médicos que coincidan con la búsqueda.'
                      : 'No hay médicos registrados.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
