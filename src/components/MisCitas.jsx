// Componente: historial del paciente con cancelación (RF06).
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { citasService } from '../services/citasService';

export default function MisCitas() {
  const { perfil } = useAuth();
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    try {
      setCitas(await citasService.historialPaciente(perfil.id_usuario));
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => { cargar(); }, []);

  async function cancelar(id) {
    if (!confirm('¿Cancelar esta cita?')) return;
    try {
      await citasService.cancelar(id);
      cargar();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="contenedor">
      <div className="encabezado">
        <p className="etiqueta-seccion">Historial</p>
        <h1>Mis citas</h1>
        <p>Aquí aparecen todas tus citas: pendientes, atendidas y canceladas.</p>
      </div>
      {error && <p className="alerta alerta-error">{error}</p>}
      {cargando ? (
        <p>Cargando citas…</p>
      ) : citas.length === 0 ? (
        <div className="tarjeta">Aún no tienes citas registradas. Busca un especialista para reservar la primera.</div>
      ) : (
        <div className="tarjeta" style={{ overflowX: 'auto' }}>
          <table className="tabla">
            <thead>
              <tr><th>Fecha</th><th>Hora</th><th>Médico</th><th>Especialidad</th><th>Clínica</th><th>Estado</th><th></th></tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id_cita}>
                  <td>{c.fecha}</td>
                  <td>{c.hora.slice(0, 5)}</td>
                  <td>{c.medico}</td>
                  <td>{c.especialidad}</td>
                  <td>{c.clinica}</td>
                  <td><span className={`estado estado-${c.estado}`}>{c.estado}</span></td>
                  <td>
                    {(c.estado === 'pendiente' || c.estado === 'confirmada') && (
                      <button className="boton boton-peligro boton-mini" onClick={() => cancelar(c.id_cita)}>
                        Cancelar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
