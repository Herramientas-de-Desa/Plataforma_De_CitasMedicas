// Componente: página de inicio.
import { Link } from 'react-router-dom';
import MapaInicio from './MapaInicio';

function IconoInicio({ nombre }) {
  const trazos = {
    buscar: <><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></>,
    calendario: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 3v4m10-4v4M3 10h18" /></>,
    ubicacion: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  };

  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {trazos[nombre]}
    </svg>
  );
}

export default function Portada() {
  return (
    <div className="contenedor portada">
      <section className="portada-hero" aria-labelledby="portada-titulo">
        <div className="portada-contenido">
          <p className="portada-etiqueta">✦ Citas médicas sin complicaciones</p>
          <h1 id="portada-titulo">Tu próxima consulta, <em>más cerca de ti.</em></h1>
          <p className="portada-intro">
            Encuentra especialistas, revisa horarios disponibles y reserva tu cita en pocos pasos.
          </p>
          <div className="portada-acciones">
            <Link to="/especialistas" className="boton portada-cta-principal">
              <IconoInicio nombre="buscar" /> Buscar especialistas
            </Link>
            <Link to="/clinicas" className="boton portada-cta-secundaria">
              <IconoInicio nombre="ubicacion" /> Ver clínicas cercanas
            </Link>
          </div>
        </div>
        <MapaInicio />
      </section>

      <div className="grid grid-3 pasos">
        <div className="tarjeta paso">
          <span className="paso-icono"><IconoInicio nombre="buscar" /></span>
          <div><h3>1. Busca</h3><p className="detalle">Encuentra especialistas por nombre y especialidad.</p></div>
        </div>
        <div className="tarjeta paso">
          <span className="paso-icono paso-icono-azul"><IconoInicio nombre="calendario" /></span>
          <div><h3>2. Reserva</h3><p className="detalle">Elige una fecha y una hora disponible.</p></div>
        </div>
        <div className="tarjeta paso">
          <span className="paso-icono"><IconoInicio nombre="ubicacion" /></span>
          <div><h3>3. Acude</h3><p className="detalle">Ubica la clínica en el mapa y llega a tu consulta.</p></div>
        </div>
      </div>
    </div>
  );
}
