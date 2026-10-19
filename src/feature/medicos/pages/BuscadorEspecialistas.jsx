 // Componente: búsqueda de médicos por especialidad y nombre (RF03).
// Reutiliza especialidadesService y medicosService.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { especialidadesService } from '../services/especialidadesService';
import { medicosService } from '../services/medicosService';
import { prediccionesService } from '../../admin/services/prediccionesService';
import TarjetaMedico from '../components/TarjetaMedico';
import ReservaModal from '../../citas/components/ReservaModal';

export default function BuscadorEspecialistas() {
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadId, setEspecialidadId] = useState('');
  const [texto, setTexto] = useState('');
  const [medicos, setMedicos] = useState([]);
  const [predicciones, setPredicciones] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [parametros, setParametros] = useSearchParams();

  const medicoReserva = Number(parametros.get('reservar'));
  const reservaAbierta =
    Number.isSafeInteger(medicoReserva) && medicoReserva > 0;
  const fechaInicial = parametros.get('fecha') || '';

  function abrirReserva(idMedico) {
    const siguientes = new URLSearchParams(parametros);
    siguientes.set('reservar', String(idMedico));
    siguientes.delete('fecha');
    setParametros(siguientes);
  }

  function cerrarReserva() {
    const siguientes = new URLSearchParams(parametros);
    siguientes.delete('reservar');
    siguientes.delete('fecha');
    setParametros(siguientes, { replace: true });
  }

  useEffect(() => {
    especialidadesService
      .listar()
      .then(setEspecialidades)
      .catch((e) => setError(e.message));

    prediccionesService
      .listarUltimas()
      .then((filas) =>
        setPredicciones(
          Object.fromEntries(filas.map((p) => [p.medico_id, p]))
        )
      )
      // La analítica es complementaria: un fallo no bloquea la búsqueda.
      .catch(() => setPredicciones({}));
  }, []);

  useEffect(() => {
    setCargando(true);
    setError('');

    medicosService
      .buscar({
        especialidadId: especialidadId || null,
        texto,
      })
      .then(setMedicos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [especialidadId, texto]);

  return (
    <div className="contenedor buscador-especialistas">
      <div className="encabezado">
        <p className="etiqueta-seccion">Directorio médico</p>
        <h1>Buscar especialistas</h1>
        <p>Filtra por especialidad o escribe el nombre del médico.</p>
      </div>

      <div className="tarjeta especialistas-filtros">
        <div className="grid grid-2">
          <label>
            Especialidad
            <select
              value={especialidadId}
              onChange={(e) => setEspecialidadId(e.target.value)}
            >
              <option value="">Todas las especialidades</option>
              {especialidades.map((e) => (
                <option
                  key={e.id_especialidad}
                  value={e.id_especialidad}
                >
                  {e.nombre}
                </option>
              ))}
            </select>
          </label>

          <label>
            Nombre del médico
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Ej. Ramos"
            />
          </label>
        </div>
      </div>

      {error && <p className="alerta alerta-error">{error}</p>}

      {!cargando && !error && (
        <div className="especialistas-resultados" aria-live="polite">
          <h2>Resultados de especialistas</h2>
          <span>
            {medicos.length}{' '}
            {medicos.length === 1 ? 'resultado' : 'resultados'}
          </span>
        </div>
      )}

      {cargando ? (
        <p>Buscando médicos…</p>
      ) : medicos.length === 0 ? (
        <div className="tarjeta">
          No se encontraron médicos con esos filtros. Prueba con otro
          nombre o especialidad.
        </div>
      ) : (
        <div className="grid grid-2 especialistas-grid">
          {medicos.map((m) => (
            <TarjetaMedico
              key={m.id_medico}
              medico={m}
              prediccion={predicciones[m.id_medico]}
              onReservar={abrirReserva}
            />
          ))}
        </div>
      )}

      {reservaAbierta && (
        <ReservaModal
          key={medicoReserva}
          medicoId={medicoReserva}
          fechaInicial={fechaInicial}
          onClose={cerrarReserva}
        />
      )}
    </div>
  );
}
