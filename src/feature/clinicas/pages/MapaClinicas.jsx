// Componente: geolocalización de clínicas (RF07).
// Reutiliza: clinicasService (Supabase), API de Geolocalización del
// navegador, Leaflet + OpenStreetMap para el mapa interactivo.
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { clinicasService } from '../services/clinicasService';

// Corrige la ruta de los íconos por defecto de Leaflet en bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const CENTRO_ICA = { lat: -14.0678, lng: -75.7286 };

export default function MapaClinicas() {
  const [clinicas, setClinicas] = useState([]);
  const [miPosicion, setMiPosicion] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');

  useEffect(() => {
    clinicasService.listar().then(setClinicas).catch((e) => setError(e.message));
  }, []);

  async function ubicarme() {
    setAviso(''); setError('');
    try {
      const pos = await clinicasService.obtenerUbicacionUsuario();
      setMiPosicion(pos);
      const cercanas = await clinicasService.clinicasCercanas(pos);
      setClinicas(cercanas);
      setAviso('Clínicas ordenadas por cercanía a tu ubicación.');
    } catch (e) {
      setError(e.message);
    }
  }

  const centro = miPosicion || CENTRO_ICA;

  return (
    <div className="contenedor">
      <div className="encabezado">
        <p className="etiqueta-seccion">Geolocalización</p>
        <h1>Clínicas cercanas</h1>
        <p>Ubica los centros médicos en el mapa y calcula la distancia desde tu posición.</p>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <button className="boton" onClick={ubicarme}>Usar mi ubicación</button>
      </div>
      {error && <p className="alerta alerta-error" style={{ marginBottom: 12 }}>{error}</p>}
      {aviso && <p className="alerta alerta-exito" style={{ marginBottom: 12 }}>{aviso}</p>}

      <div className="mapa-contenedor">
        <MapContainer center={[centro.lat, centro.lng]} zoom={14} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {miPosicion && (
            <Circle center={[miPosicion.lat, miPosicion.lng]} radius={120}
              pathOptions={{ color: '#0e7c66', fillOpacity: 0.35 }}>
              <Popup>Estás aquí</Popup>
            </Circle>
          )}
          {clinicas.map((c) => (
            <Marker key={c.id_clinica} position={[c.latitud, c.longitud]}>
              <Popup>
                <strong>{c.nombre}</strong><br />
                {c.direccion}<br />
                {c.telefono && <>Tel. {c.telefono}<br /></>}
                {c.distancia != null && <>A {c.distancia.toFixed(2)} km de ti</>}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="tarjeta" style={{ marginTop: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Directorio de clínicas</h3>
        <ul className="lista-distancias">
          {clinicas.map((c) => (
            <li key={c.id_clinica}>
              <span><strong>{c.nombre}</strong> — {c.direccion}</span>
              {c.distancia != null && <span className="distancia">{c.distancia.toFixed(2)} km</span>}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
