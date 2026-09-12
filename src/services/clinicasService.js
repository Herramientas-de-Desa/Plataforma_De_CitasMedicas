// ============================================================
// clinicasService.js — Clínicas y geolocalización (RF07).
// Reutiliza: API REST de Supabase, API de Geolocalización del
// navegador y la API pública Nominatim de OpenStreetMap.
// ============================================================
import { supabase } from './supabaseClient';

export const clinicasService = {
  async listar() {
    const { data, error } = await supabase
      .from('clinicas')
      .select('*')
      .order('nombre');
    if (error) throw new Error(error.message);
    return data;
  },

  async crear({ nombre, direccion, telefono, latitud, longitud }) {
    const { data, error } = await supabase
      .from('clinicas')
      .insert({ nombre, direccion, telefono, latitud, longitud })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return data;
  },

  /** API del navegador: posición actual del usuario */
  obtenerUbicacionUsuario() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error('Tu navegador no soporta geolocalización.'));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => reject(new Error('No se pudo obtener tu ubicación. Activa los permisos de ubicación.')),
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  },

  /** Fórmula de Haversine: distancia en km entre dos coordenadas */
  distanciaKm(a, b) {
    const R = 6371;
    const rad = (g) => (g * Math.PI) / 180;
    const dLat = rad(b.lat - a.lat);
    const dLng = rad(b.lng - a.lng);
    const x =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  },

  /** Clínicas ordenadas por cercanía a una posición */
  async clinicasCercanas(posicion) {
    const clinicas = await this.listar();
    return clinicas
      .map((c) => ({
        ...c,
        distancia: this.distanciaKm(posicion, { lat: c.latitud, lng: c.longitud }),
      }))
      .sort((a, b) => a.distancia - b.distancia);
  },

  /** API reutilizada: Nominatim (OpenStreetMap) para geocodificar direcciones */
  async buscarDireccion(texto) {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=pe&q=${encodeURIComponent(texto)}`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'es' } });
    if (!res.ok) throw new Error('No se pudo consultar el servicio de mapas.');
    const [lugar] = await res.json();
    if (!lugar) throw new Error('Dirección no encontrada.');
    return { lat: parseFloat(lugar.lat), lng: parseFloat(lugar.lon), nombre: lugar.display_name };
  },
};
