// Sección del administrador: supervisión de citas con búsqueda, filtros,
// acciones sobre el estado y paginación.
import { useEffect, useState } from 'react';
import { citasService } from '../../services/citasService';
import { fechaActualEnIca, formatearFechaCorta, formatearFechaLarga } from '../../services/fechas';
import EstadoCita, { ETIQUETAS_ESTADO } from '../citas/EstadoCita';
import DialogoConfirmacion from '../comun/DialogoConfirmacion';
import { useAvisos } from '../../context/AvisosContext';

const POR_PAGINA = 20;

export default function AdminCitas({ citas, onCambio }) {
  const [busqueda, setBusqueda] = useState('');
  const [fecha, setFecha] = useState('');
  const [estado, setEstado] = useState('');
  const [pagina, setPagina] = useState(1);
  const [ocupado, setOcupado] = useState(null);
  const [error, setError] = useState('');
  const avisar = useAvisos();
  const [porCancelar, setPorCancelar] = useState(null);
  const [errorCancelar, setErrorCancelar] = useState('');
  const hoy = fechaActualEnIca();

  // Cualquier cambio de filtro vuelve a la primera página.
  useEffect(() => { setPagina(1); }, [busqueda, fecha, estado]);

  const texto = busqueda.trim().toLocaleLowerCase('es');
  const filtradas = citas.filter((c) =>
    (!fecha || c.fecha === fecha)
    && (!estado || c.estado === estado)
    && (!texto || `${c.paciente || ''} ${c.medico} ${c.clinica}`.toLocaleLowerCase('es').includes(texto)));
  const paginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const paginaActual = Math.min(pagina, paginas);
  const visibles = filtradas.slice((paginaActual - 1) * POR_PAGINA, paginaActual * POR_PAGINA);
  const hayFiltros = Boolean(busqueda || fecha || estado);

  async function cambiarEstado(cita, nuevo) {
    setOcupado(cita.id_cita);
    setError('');
   
    try {
      await citasService.cambiarEstado(cita.id_cita, nuevo);
      await onCambio();
      avisar(`La cita de ${cita.paciente} quedó ${ETIQUETAS_ESTADO[nuevo].toLowerCase()}.`);
    } catch (e) {
      setError(e.message);
    } finally {
      setOcupado(null);
    }
  }

  async function confirmarCancelacion() {
    setOcupado(porCancelar.id_cita);
    setErrorCancelar('');
    try {
      await citasService.cambiarEstado(porCancelar.id_cita, 'cancelada');
      await onCambio();
      avisar(`Cancelaste la cita de ${porCancelar.paciente} con ${porCancelar.medico}.`);
      setPorCancelar(null);
    } catch (e) {
      setErrorCancelar(e.message);
    } finally {
      setOcupado(null);
    }
  }

  return (
    <section className="tarjeta admin-seccion" aria-labelledby="admin-citas-titulo">
      <div className="admin-seccion-cabecera">
        <div>
          <h2 id="admin-citas-titulo">Citas</h2>
          <p>Consulta las reservas, su estado y gestiónalas cuando haga falta.</p>
        </div>
        <span className="admin-seccion-total">{filtradas.length} de {citas.length} citas</span>
      </div>
      <div className="admin-filtros">
        <label htmlFor="admin-buscar-cita">Paciente, médico o clínica
          <input id="admin-buscar-cita" type="search" placeholder="Escribe un nombre" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </label>
        <label htmlFor="admin-filtro-fecha-cita">Fecha
          <input id="admin-filtro-fecha-cita" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </label>
        <label htmlFor="admin-filtro-estado-cita">Estado
          <select id="admin-filtro-estado-cita" value={estado} onChange={(e) => setEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {Object.entries(ETIQUETAS_ESTADO).map(([valor, etiqueta]) => <option key={valor} value={valor}>{etiqueta}</option>)}
          </select>
        </label>
        <button className="boton boton-secundario boton-mini" type="button" onClick={() => setFecha(hoy)}>Hoy</button>
        {hayFiltros && (
          <button className="boton boton-secundario boton-mini" type="button" onClick={() => { setBusqueda(''); setFecha(''); setEstado(''); }}>
            Limpiar filtros
          </button>
        )}
      </div>
      {error && <p className="alerta alerta-error" role="alert">{error}</p>}
      <div className="admin-tabla-contenedor"><table className="tabla tabla-tarjetas admin-tabla">
        <thead><tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Médico</th><th>Clínica</th><th>Estado</th><th></th></tr></thead>
        <tbody>
          {visibles.map((c) => {
            const activa = c.estado === 'pendiente' || c.estado === 'confirmada';
            return (
              <tr key={c.id_cita}>
                <td data-label="Fecha"><strong>{formatearFechaCorta(c.fecha)}</strong></td>
                <td data-label="Hora">{c.hora.slice(0, 5)}</td>
                <td data-label="Paciente">{c.paciente}{c.paciente_telefono && <p className="admin-ayuda">Tel. {c.paciente_telefono}</p>}</td>
                <td data-label="Médico">{c.medico}</td>
                <td data-label="Clínica">{c.clinica}</td>
                <td data-label="Estado"><EstadoCita estado={c.estado} /></td>
                <td data-label="Acciones" className="acciones-tabla">
                  {c.estado === 'pendiente' && (
                    <button className="boton boton-mini" type="button" disabled={ocupado !== null} onClick={() => cambiarEstado(c, 'confirmada')}>Confirmar</button>
                  )}
                  {activa && (
                    <button className="boton boton-peligro boton-mini" type="button" disabled={ocupado !== null}
                      onClick={() => { setErrorCancelar(''); setPorCancelar(c); }}>Cancelar</button>
                  )}
                </td>
              </tr>
            );
          })}
          {visibles.length === 0 && (
            <tr><td colSpan="7">{citas.length ? 'No hay citas que coincidan con los filtros.' : 'No hay citas registradas.'}</td></tr>
          )}
        </tbody>
      </table></div>
      {paginas > 1 && (
        <nav className="admin-paginacion" aria-label="Páginas de citas">
          <button className="boton boton-secundario boton-mini" type="button" disabled={paginaActual === 1} onClick={() => setPagina(paginaActual - 1)}>← Anterior</button>
          <span>Página {paginaActual} de {paginas}</span>
          <button className="boton boton-secundario boton-mini" type="button" disabled={paginaActual === paginas} onClick={() => setPagina(paginaActual + 1)}>Siguiente →</button>
        </nav>
      )}

      {porCancelar && (
        <DialogoConfirmacion
          titulo="¿Cancelar esta cita?"
          textoConfirmar="Sí, cancelar cita"
          textoCancelar="No, conservarla"
          peligro
          procesando={ocupado !== null}
          error={errorCancelar}
          onConfirmar={confirmarCancelacion}
          onCancelar={() => setPorCancelar(null)}
        >
          <dl className="dialogo-detalle">
            <div><dt>Paciente</dt><dd>{porCancelar.paciente}</dd></div>
            <div><dt>Médico</dt><dd>{porCancelar.medico}</dd></div>
            <div><dt>Fecha</dt><dd>{formatearFechaLarga(porCancelar.fecha)}, {porCancelar.hora.slice(0, 5)}</dd></div>
          </dl>
          <p>El horario quedará libre. Avisa al paciente del cambio.</p>
        </DialogoConfirmacion>
      )}
    </section>
  );
}
