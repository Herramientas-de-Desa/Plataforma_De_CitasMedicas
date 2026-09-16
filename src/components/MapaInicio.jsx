// Vista previa del mapa de Ica en la portada; no solicita geolocalización.
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CircleMarker, MapContainer, Popup, TileLayer } from 'react-leaflet';
import { clinicasService } from '../services/clinicasService';

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
            <CircleMarker key={clinica.id_clinica}
              center={[Number(clinica.latitud), Number(clinica.longitud)]}
              radius={9}
              pathOptions={{ color: '#fff', weight: 3, fillColor: '#0e7c66', fillOpacity: 1 }}>
              <Popup><strong>{clinica.nombre}</strong></Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        <span className="portada-mapa-lugar">● Ica, Perú</span>
        <Link to="/clinicas" className="portada-mapa-enlace">Explorar mapa ↗</Link>
      </div>
    </div>
  );
}
