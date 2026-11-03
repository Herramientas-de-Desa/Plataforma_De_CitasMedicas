// Componente: búsqueda de médicos por especialidad y nombre (RF03).
// Reutiliza especialidadesService y medicosService.
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { especialidadesService } from '../../services/especialidadesService';
import { clinicasService } from '../../services/clinicasService';
import { medicosService } from '../../services/medicosService';
import { prediccionesService } from '../../services/prediccionesService';
import TarjetaMedico from './TarjetaMedico';
import ReservaModal from '../citas/ReservaModal';

// Espera a que el usuario deje de escribir antes de consultar.
const ESPERA_BUSQUEDA_MS = 350;

function TarjetaEsqueleto() {
  return (
    <div className="tarjeta tarjeta-medico tarjeta-esqueleto" aria-hidden="true">
      <div className="tarjeta-medico-cabecera">
        <span className="esqueleto esqueleto-circulo" />
        <div style={{ flex: 1, display: 'grid', gap: 8 }}>
          <span className="esqueleto esqueleto-linea" style={{ width: '70%' }} />
          <span className="esqueleto esqueleto-linea" style={{ width: '40%' }} />
        </div>
      </div>
      <span className="esqueleto esqueleto-linea" style={{ width: '55%' }} />
      <span className="esqueleto esqueleto-linea" style={{ width: '80%' }} />
      <span className="esqueleto esqueleto-boton" />
    </div>
  );
}

export default function BuscadorEspecialistas() {
  const [especialidades, setEspecialidades] = useState([]);
  const [especialidadId, setEspecialidadId] = useState('');
  const [clinicas, setClinicas] = useState([]);
  const [clinicaId, setClinicaId] = useState('');
  const [texto, setTexto] = useState('');
  const [textoBuscado, setTextoBuscado] = useState('');
  const [medicos, setMedicos] = useState([]);
  const [predicciones, setPredicciones] = useState({});
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [parametros, setParametros] = useSearchParams();
  const medicoReserva = Number(parametros.get('reservar'));
  const reservaAbierta = Number.isSafeInteger(medicoReserva) && medicoReserva > 0;
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
    especialidadesService.listar().then(setEspecialidades).catch((e) => setError(e.message));
    // Si las clínicas no cargan, el filtro simplemente no aparece.
    clinicasService.listar().then(setClinicas).catch(() => setClinicas([]));
    prediccionesService.listarUltimas()
      .then((filas) => setPredicciones(Object.fromEntries(filas.map((p) => [p.medico_id, p]))))
      // La analítica es complementaria: un fallo no bloquea la búsqueda.
      .catch(() => setPredicciones({}));
  }, []);

  useEffect(() => {
    const espera = setTimeout(() => setTextoBuscado(texto.trim()), ESPERA_BUSQUEDA_MS);
    return () => clearTimeout(espera);
  }, [texto]);

  useEffect(() => {
    // Ignora respuestas de búsquedas anteriores que lleguen tarde.
    let activo = true;
    setCargando(true);
    setError('');
    medicosService
      .buscar({ especialidadId: especialidadId || null, clinicaId: clinicaId || null, texto: textoBuscado })
      .then((filas) => { if (activo) setMedicos(filas); })
      .catch((e) => { if (activo) { setMedicos([]); setError(e.message); } })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [especialidadId, clinicaId, textoBuscado]);

  const hayFiltros = Boolean(especialidadId || clinicaId || texto.trim());

  function limpiarFiltros() {
    setEspecialidadId('');
    setClinicaId('');
    setTexto('');
  }

  return (
    <div className="contenedor buscador-especialistas">
      <div className="encabezado">
        <p className="etiqueta-seccion">Directorio médico</p>
        <h1>Buscar especialistas</h1>
        <p>Filtra por especialidad o clínica, o escribe el nombre del médico.</p>
      </div>

      <div className="tarjeta especialistas-filtros">
        <div className="grid grid-3">
          <label>Especialidad
            <select value={especialidadId} onChange={(e) => setEspecialidadId(e.target.value)}>
              <option value="">Todas las especialidades</option>
              {especialidades.map((e) => (
                <option key={e.id_especialidad} value={e.id_especialidad}>{e.nombre}</option>
              ))}
            </select>
          </label>
          {clinicas.length > 0 && (
            <label>Clínica
              <select value={clinicaId} onChange={(e) => setClinicaId(e.target.value)}>
                <option value="">Todas las clínicas</option>
                {clinicas.map((c) => (
                  <option key={c.id_clinica} value={c.id_clinica}>{c.nombre}</option>
                ))}
              </select>
            </label>
          )}
          <label>Nombre del médico
            <input type="search" value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Ej. Ramos" />
          </label>
        </div>
      </div>

      {error && <p className="alerta alerta-error">{error}</p>}
      {!cargando && !error && (
        <div className="especialistas-resultados" aria-live="polite">
          <h2>Resultados de especialistas</h2>
          <span>{medicos.length} {medicos.length === 1 ? 'resultado' : 'resultados'}</span>
        </div>
      )}
      {cargando ? (
        <div className="grid grid-2 especialistas-grid" role="status" aria-label="Buscando médicos">
          <TarjetaEsqueleto /><TarjetaEsqueleto />
        </div>
      ) : error ? null : medicos.length === 0 ? (
        <div className="tarjeta especialistas-vacio">
          <p>No se encontraron médicos con esos filtros. Prueba con otro nombre, especialidad o clínica.</p>
          {hayFiltros && <button className="boton boton-secundario boton-mini" type="button" onClick={limpiarFiltros}>Quitar filtros</button>}
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
