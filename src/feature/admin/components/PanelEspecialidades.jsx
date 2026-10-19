import { useState } from 'react';
import { especialidadesService } from '../../medicos/services/especialidadesService';

export default function PanelEspecialidades({
  especialidades,
  onActualizar,
  onError,
}) {
  const [nuevaEsp, setNuevaEsp] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function crearEspecialidad(evento) {
    evento.preventDefault();

    const nombre = nuevaEsp.trim();
    if (!nombre || guardando) return;

    setGuardando(true);

    try {
      await especialidadesService.crear(nombre);
      setNuevaEsp('');
      await onActualizar();
    } catch (e) {
      onError(e.message || 'No se pudo crear la especialidad.');
    } finally {
      setGuardando(false);
    }
  }

  async function eliminarEspecialidad(especialidad) {
    if (
      !window.confirm(
        `¿Eliminar la especialidad "${especialidad.nombre}"?`
      )
    ) {
      return;
    }

    try {
      await especialidadesService.eliminar(especialidad.id_especialidad);
      await onActualizar();
    } catch (e) {
      onError(e.message || 'No se pudo eliminar la especialidad.');
    }
  }

  return (
    <section
      className="tarjeta admin-seccion"
      aria-labelledby="admin-especialidades-titulo"
    >
      <div className="admin-seccion-cabecera">
        <div>
          <h2 id="admin-especialidades-titulo">Especialidades</h2>
          <p>Organiza las especialidades disponibles para los médicos.</p>
        </div>
        <span className="admin-seccion-total">
          {especialidades.length} especialidades
        </span>
      </div>

      <form className="admin-especialidad-form" onSubmit={crearEspecialidad}>
        <label htmlFor="admin-nueva-especialidad">
          Nueva especialidad
        </label>
        <input
          id="admin-nueva-especialidad"
          placeholder="Nombre de la especialidad"
          value={nuevaEsp}
          maxLength={100}
          onChange={(e) => setNuevaEsp(e.target.value)}
          required
        />
        <button className="boton" type="submit" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Agregar'}
        </button>
      </form>

      <div className="admin-tabla-contenedor">
        <table className="tabla tabla-tarjetas admin-tabla">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {especialidades.map((e) => (
              <tr key={e.id_especialidad}>
                <td data-label="ID">{e.id_especialidad}</td>
                <td data-label="Nombre"><strong>{e.nombre}</strong></td>
                <td data-label="Acciones">
                  <button
                    type="button"
                    className="boton boton-peligro boton-mini"
                    onClick={() => eliminarEspecialidad(e)}
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}

            {especialidades.length === 0 && (
              <tr>
                <td colSpan="3">No hay especialidades registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
