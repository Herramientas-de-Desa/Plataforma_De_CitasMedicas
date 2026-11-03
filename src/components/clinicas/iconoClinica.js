// Marcador de clínica compartido por el mapa de la portada y el mapa de clínicas.
import L from 'leaflet';
import clinicaMarcador from '../../assets/clinica-marcador.png';

export const iconoClinica = L.icon({
  iconUrl: clinicaMarcador,
  className: 'clinica-marcador',
  iconSize: [44, 44], iconAnchor: [22, 42],
});
