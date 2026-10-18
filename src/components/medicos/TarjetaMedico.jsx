// Componente reutilizable: tarjeta de médico con acceso a la reserva.
import PrediccionDisponibilidad from '../disponibilidad/PrediccionDisponibilidad';

export default function TarjetaMedico({ medico, prediccion, onReservar }) {
  return (
    <article className="tarjeta tarjeta-medico">
      <div className="tarjeta-medico-identidad">
        <h3>{medico.nombre}</h3>
        <p className="especialidad">{medico.especialidad?.nombre || 'Especialidad no indicada'}</p>
      </div>
      <div className="tarjeta-medico-ubicacion">
        <strong>{medico.clinica?.nombre || 'Clínica no indicada'}</strong>
        {medico.clinica?.direccion && <p>{medico.clinica.direccion}</p>}
        {medico.telefono && <p>Tel. {medico.telefono}</p>}
      </div>
      <PrediccionDisponibilidad prediccion={prediccion} compacto />
      <div className="tarjeta-medico-accion">
        <button className="boton" type="button" onClick={() => onReservar(medico.id_medico)}>
          Ver horarios y reservar
        </button>
      </div>
    </article>
  );
}
