// Componente: página de inicio.
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Portada() {
  const { perfil } = useAuth();
  return (
    <div className="contenedor portada">
      <p className="etiqueta-seccion">Plataforma inteligente de citas médicas</p>
      <h1>Tu próxima consulta, <em>reservada en minutos</em>.</h1>
      <p>
        Busca especialistas, revisa sus horarios reales, reserva tu cita y
        encuentra la clínica más cercana a ti con el mapa interactivo.
      </p>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/especialistas" className="boton">Buscar especialistas</Link>
        <Link to="/clinicas" className="boton boton-secundario">Ver clínicas cercanas</Link>
        {!perfil && <Link to="/registro" className="boton boton-secundario">Crear mi cuenta</Link>}
      </div>

      <div className="grid grid-3 pasos">
        <div className="tarjeta paso">
          <h3>Busca</h3>
          <p className="detalle">Filtra médicos por especialidad y nombre. La lista se carga en tiempo real desde la base de datos.</p>
        </div>
        <div className="tarjeta paso">
          <h3>Reserva</h3>
          <p className="detalle">Elige fecha y una hora libre. El sistema solo muestra horarios realmente disponibles.</p>
        </div>
        <div className="tarjeta paso">
          <h3>Acude</h3>
          <p className="detalle">Ubica la clínica en el mapa, calcula la distancia desde tu posición y gestiona tu historial.</p>
        </div>
      </div>
    </div>
  );
}
