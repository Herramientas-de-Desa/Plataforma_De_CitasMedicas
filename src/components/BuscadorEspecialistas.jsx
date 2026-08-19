// Componente: búsqueda de médicos por especialidad y nombre (RF03).
// Reutiliza especialidadesService y medicosService.
import { useEffect, useState } from 'react';
import { especialidadesService } from '../services/especialidadesService';
import { medicosService } from '../services/medicosService';
import TarjetaMedico from './TarjetaMedico';

export default function BuscadorEspecialistas() {
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadId, setEspecialidadId] = useState('');
  const [texto, setTexto] = useState('');
  const [medicos, setMedicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    especialidadesService.listar().then(setEspecialidades).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    setCargando(true);
    setError('');
    medicosService
      .buscar({ especialidadId: especialidadId || null, texto })
      .then(setMedicos)
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [especialidadId, texto]);

  return (
    <div className="contenedor">
      <div className="encabezado">
        <p className="etiqueta-seccion">Directorio médico</p>
        <h1>Buscar especialistas</h1>
        <p>Filtra por especialidad o escribe el nombre del médico.</p>
      </div>

      <div className="tarjeta" style={{ marginBottom: 20 }}>
        <div className="grid grid-2">
          <label>Especialidad
            <select value={especialidadId} onChange={(e) => setEspecialidadId(e.target.value)}>
              <option value="">Todas las especialidades</option>
              {especialidades.map((e) => (
                <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>
              ))}
            </select>
          </label>
          <label>Nombre del médico
            <input value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. Ramos" />
          </label>
        </div>
      </div>

      {error && <p className="alerta alerta-error">{error}</p>}
      {cargando ? (
        <p>Buscando médicos…</p>
      ) : medicos.length === 0 ? (
        <div className="tarjeta">No se encontraron médicos con esos filtros. Prueba con otra especialidad.</div>
      ) : (
        <div className="grid grid-2">
          {medicos.map((m) => <TarjetaMedico key={m.id_medico} medico={m} />)}
        </div>
      )}
    </div>
  );
}
