// Componente reutilizable: tarjeta de médico con acceso a la reserva.
import { useState } from 'react';
import PrediccionDisponibilidad from '../disponibilidad/PrediccionDisponibilidad';
import { getDoctorThumbnail } from '../../services/cloudinaryService';

function iniciales(nombre = '') {
  // Omite títulos como "Dr." o "Dra." para que las iniciales sean del nombre.
  const partes = nombre.trim().split(/\s+/).filter((parte) => !/^dra?\.?$/i.test(parte));
  return partes.slice(0, 2).map((parte) => parte[0]).join('').toUpperCase() || '?';
}

export default function TarjetaMedico({ medico, prediccion, onReservar, mostrarPrediccion = true }) {
  const [fotoFallida, setFotoFallida] = useState(false);
  const foto = (medico.foto_public_id && getDoctorThumbnail(medico.foto_public_id)) || medico.foto_url;

  return (
    <article className="tarjeta tarjeta-medico">
      <div className="tarjeta-medico-cabecera">
        <div className="tarjeta-medico-foto">
          {foto && !fotoFallida
            ? <img src={foto} alt="" loading="lazy" onError={() => setFotoFallida(true)} />
            : <span aria-hidden="true">{iniciales(medico.nombre)}</span>}
        </div>
        <div className="tarjeta-medico-identidad">
          <h3>{medico.nombre}</h3>
          <p className="especialidad">{medico.especialidad?.nombre || 'Especialidad no indicada'}</p>
        </div>
      </div>
      <div className="tarjeta-medico-ubicacion">
        <strong>{medico.clinica?.nombre || 'Clínica no indicada'}</strong>
        {medico.clinica?.direccion && <p>{medico.clinica.direccion}</p>}
        {medico.telefono && <p>Tel. {medico.telefono}</p>}
      </div>
      {mostrarPrediccion && <PrediccionDisponibilidad prediccion={prediccion} compacto />}
      <div className="tarjeta-medico-accion">
        <button className="boton" type="button" onClick={() => onReservar(medico.id_medico)}>
          Ver horarios y reservar
        </button>
      </div>
    </article>
  );
}
