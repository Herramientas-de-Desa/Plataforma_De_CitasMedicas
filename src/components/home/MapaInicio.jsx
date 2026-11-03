// Vista previa del mapa de Ica en la portada; no solicita geolocalización.
// Es fija: tocar cualquier parte lleva al mapa completo de clínicas.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import { clinicasService } from '../../services/clinicasService';
import { iconoClinica } from '../clinicas/iconoClinica';

const CENTRO_ICA = [-14.0678, -75.7286];

export default function MapaInicio() {
  const [clinicas, setClinicas] = useState([]);

  useEffect(() => {
    let activo = true;
    clinicasService.listar()
      .then((datos) => {
        if (activo) {
          setClinicas(datos.filter((clinica) =>
            clinica.latitud != null && clinica.longitud != null &&
            Number.isFinite(Number(clinica.latitud)) && Number.isFinite(Number(clinica.longitud))
          ));
        }
      })
      .catch(() => {
        // El mapa sigue disponible aunque falle la carga de clínicas.
      });
    return () => { activo = false; };
  }, []);

  return (
    <div className="portada-mapa-escena">
      <div className="portada-mapa" aria-label="Vista previa del mapa de clínicas en Ica">
        <MapContainer center={CENTRO_ICA} zoom={13} zoomControl={false}
          dragging={false} scrollWheelZoom={false} doubleClickZoom={false}
          touchZoom={false} keyboard={false} style={{ width: '100%', height: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {clinicas.map((clinica) => (
            <Marker key={clinica.id_clinica}
              position={[Number(clinica.latitud), Number(clinica.longitud)]}
              icon={iconoClinica} interactive={false} keyboard={false} />
          ))}
        </MapContainer>
        {/* El enlace accesible es "Explorar mapa"; esta capa solo amplía la zona táctil. */}
        <Link to="/clinicas" className="portada-mapa-cubierta" tabIndex={-1} aria-hidden="true" />
        <span className="portada-mapa-lugar">● Ica, Perú</span>
        <Link to="/clinicas" className="portada-mapa-enlace">
          {clinicas.length ? `Ver las ${clinicas.length} clínicas` : 'Explorar mapa'} ↗
        </Link>
      </div>
    </div>
  );
}
