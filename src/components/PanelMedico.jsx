// Componente: agenda del médico (consultar citas y actualizar su estado).
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../services/supabaseClient';
import { citasService } from '../services/citasService';

export default function PanelMedico() {
  const { perfil } = useAuth();
  const [medico, setMedico] = useState(null);
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function cargar() {
      const { data, error: err } = await supabase
        .from('medicos')
        .select('id_medico, nombre')
        .eq('usuario_id', perfil.id_usuario)
        .maybeSingle();
      if (err || !data) {
        setError('Tu cuenta de médico aún no está vinculada a un registro de la tabla medicos. Pide al administrador que asocie tu usuario.');
        return;
      }
      setMedico(data);
      setCitas(await citasService.agendaMedico(data.id_medico));
    }
    cargar().catch((e) => setError(e.message));
  }, [perfil.id_usuario]);

  async function marcar(id, estado) {
    await citasService.cambiarEstado(id, estado);
    setCitas(await citasService.agendaMedico(medico.id_medico));
  }

  return (
    <div className="contenedor">
      <div className="encabezado">
        <p className="etiqueta-seccion">Panel del médico</p>
        <h1>Mi agenda</h1>
      </div>
      {error && <p className="alerta alerta-error">{error}</p>}
      {medico && (
        <div className="tarjeta" style={{ overflowX: 'auto' }}>
          <table className="tabla">
            <thead>
              <tr><th>Fecha</th><th>Hora</th><th>Paciente</th><th>Estado</th><th>Acciones</th></tr>
            </thead>
            <tbody>
              {citas.map((c) => (
                <tr key={c.id_cita}>
                  <td>{c.fecha}</td>
                  <td>{c.hora.slice(0, 5)}</td>
                  <td>{c.paciente}</td>
                  <td><span className={`estado estado-${c.estado}`}>{c.estado}</span></td>
                  <td style={{ display: 'flex', gap: 8 }}>
                    {c.estado === 'pendiente' && (
                      <button className="boton boton-mini" onClick={() => marcar(c.id_cita, 'confirmada')}>Confirmar</button>
                    )}
                    {c.estado !== 'atendida' && c.estado !== 'cancelada' && (
                      <button className="boton boton-secundario boton-mini" onClick={() => marcar(c.id_cita, 'atendida')}>Atendida</button>
                    )}
                  </td>
                </tr>
              ))}
              {citas.length === 0 && <tr><td colSpan="5">Sin citas programadas.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
