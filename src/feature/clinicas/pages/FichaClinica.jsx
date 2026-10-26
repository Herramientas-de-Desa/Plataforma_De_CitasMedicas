import { useEffect, useState } from 'react';
import { medicosService } from '../../medicos/services/medicosService';
import TarjetaMedico from '../../medicos/components/TarjetaMedico';

export default function FichaClinica({ clinica, onReservar, onCerrar }) {
  const [medicos, setMedicos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [intento, setIntento] = useState(0);
  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    medicosService.buscar({ clinicaId: clinica.id_clinica })
      .then(filas => { if (activo) setMedicos(filas); })
      .catch(() => { if (activo) setError('No pudimos cargar los médicos de esta clínica.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [clinica.id_clinica, intento]);

  return <section className="clinica-ficha tarjeta" aria-labelledby="clinica-ficha-titulo">
    <div className="clinica-ficha-cabecera">
      <div>
        <p className="etiqueta-seccion">Clínica seleccionada</p>
        <h2 id="clinica-ficha-titulo">{clinica.nombre}</h2>
        <p>{clinica.direccion}</p>
        {clinica.telefono && <p>Teléfono: {clinica.telefono}</p>}
      </div>
      <button type="button" className="boton boton-secundario" onClick={onCerrar}>Volver al mapa</button>
    </div>
    <h3>Médicos y especialidades</h3>
    <p className="clinica-ficha-ayuda">Elige un médico para consultar fechas y horarios antes de reservar.</p>
    {cargando ? <p role="status">Consultando médicos…</p> : error ? <div role="alert">
      <p>{error}</p><button type="button" className="boton boton-secundario" onClick={() => setIntento(i => i + 1)}>Reintentar</button>
    </div> : medicos.length === 0 ? <p>No hay médicos disponibles para reservar en esta clínica por el momento. Puedes elegir otra del mapa.</p> :
      <div className="grid grid-2">{medicos.map(medico => <TarjetaMedico key={medico.id_medico} medico={medico} onReservar={onReservar} mostrarPrediccion={false} />)}</div>}
  </section>;
}
