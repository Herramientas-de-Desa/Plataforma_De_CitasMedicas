// Componente: agenda del médico (consultar citas y actualizar su estado).
import { useEffect, useState } from 'react';
import { useAuth } from '../../../core/context/AuthContext';
import { Link } from 'react-router-dom';
import { medicosService } from '../../medicos/services/medicosService';
import { citasService } from '../../citas/services//citasService';
import { prediccionesService } from '../../admin/services/prediccionesService';
import PrediccionDisponibilidad from '../components/PrediccionDisponibilidad';

export default function MedicoAgenda() {
  const { perfil } = useAuth();
  const [medico, setMedico] = useState(null);
  const [citas, setCitas] = useState([]);
  const [prediccion, setPrediccion] = useState(null);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);
  const [intento, setIntento] = useState(0);
  const [actualizando, setActualizando] = useState(null);

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    setMedico(null);
    setCitas([]);
    setPrediccion(null);
    async function cargar() {
      const data = await medicosService.obtenerPorUsuario(perfil.id_usuario);
      if (!activo || !data) return;
      setMedico(data);
      const [agenda, estimacion] = await Promise.all([
        citasService.agendaMedico(data.id_medico),
        prediccionesService.obtenerUltima(data.id_medico).catch(() => null),
      ]);
      if (activo) { setCitas(agenda); setPrediccion(estimacion); }
    }
    cargar().catch(() => { if (activo) setError('No pudimos cargar tu agenda. Revisa tu conexión y vuelve a intentarlo.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [perfil.id_usuario, intento]);

  async function marcar(id, estado) {
    if (actualizando !== null) return;
    setActualizando(id);
    setError('');
    try {
      await citasService.cambiarEstado(id, estado);
      setCitas(await citasService.agendaMedico(medico.id_medico));
    } catch { setError('No pudimos completar la actualización. Recarga la agenda para comprobar el estado de la cita.'); }
    finally { setActualizando(null); }
  }

  return (
    <div className="contenedor">
      <div className="encabezado">
        <p className="etiqueta-seccion">Panel del médico</p>
        <h1>Mi agenda</h1>
      </div>
      {cargando && <p role="status">Cargando tu agenda…</p>}
      {error && <div className="alerta alerta-error" role="alert"><p>{error}</p><button className="boton boton-secundario boton-mini" type="button" onClick={() => setIntento((valor) => valor + 1)}>Recargar agenda</button></div>}
      {!cargando && !error && !medico && <section className="tarjeta">
        <h2>Tu perfil profesional está pendiente de asignación</h2>
        <p>El administrador debe asignarte una clínica, especialidad y horarios iniciales. Luego podrás editarlos desde tu perfil.</p>
        <Link className="boton" to="/perfil">Ver mi perfil</Link>
      </section>}
      {!cargando && medico && !error && (
        <>
          <div className="tarjeta resumen-demanda">
            <h3>Carga futura</h3>
            <PrediccionDisponibilidad prediccion={prediccion} mostrarDemanda />
          </div>
          <div className="tarjeta" style={{ overflowX: 'auto', marginTop: 16 }}>
            <table className="tabla tabla-tarjetas">
            <thead>
              <tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id_cita}>
                  <td data-label="Fecha">{c.fecha}</td>
                  <td data-label="Hora">{c.hora.slice(0, 5)}</td>
                  <td data-label="Paciente">{c.paciente}</td>
                  <td data-label="Estado"><span className={`estado estado-${c.estado}`}>{c.estado}</span></td>
                  <td data-label="Acciones" className="acciones-tabla">
                    {c.estado === 'pendiente' && (
                      <button className="boton boton-mini" disabled={actualizando !== null} onClick={() => marcar(c.id_cita, 'confirmada')}>Confirmar</button>
                    )}
                    {c.estado !== 'atendida' && c.estado !== 'cancelada' && (
                      <button className="boton boton-secundario boton-mini" disabled={actualizando !== null} onClick={() => marcar(c.id_cita, 'atendida')}>Atendida</button>
                    )}
                  </td>
                </tr>
              ))}
              {citas.length === 0 && <tr><td colSpan="5">Sin citas programadas.</td></tr>}
            </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
