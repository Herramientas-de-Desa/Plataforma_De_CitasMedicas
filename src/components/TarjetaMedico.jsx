// Componente reutilizable: tarjeta de médico con acceso a la reserva.
import { Link } from 'react-router-dom';

export default function TarjetaMedico({ medico }) {
  return (
    <article className="tarjeta tarjeta-medico">
      <h3>{medico.nombre}</h3>
      <p className="especialidad">{medico.especialidad?.nombre}</p>
      <p className="detalle">
        {medico.clinica?.nombre} · {medico.clinica?.direccion}
        {medico.telefono && <> · Tel. {medico.telefono}</>}
      </p>
      <div style={{ marginTop: 14 }}>
        <Link className="boton boton-mini" to={`/reservar/${medico.id_medico}`}>
          Ver horarios y reservar
        </Link>
      </div>
    </article>
  );
}
