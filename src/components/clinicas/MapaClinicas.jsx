import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import { clinicasService } from '../../services/clinicasService';
import ReservaModal from '../citas/ReservaModal';
import FichaClinica from './FichaClinica';
import clinicaMarcador from '../../assets/clinica-marcador.png';
import './MapaClinicas.css';

const CENTRO_ICA = [-14.0678, -75.7286];
const iconoClinica = L.icon({
  iconUrl: clinicaMarcador,
  className: 'clinica-marcador',
  iconSize: [44, 44], iconAnchor: [22, 42],
});
const iconoUsuario = L.divIcon({
  className: 'clinica-mi-marcador', html: '<span></span>',
  iconSize: [24, 24], iconAnchor: [12, 12],
});

function coordenadasValidas(clinica) {
  return clinica.latitud != null && clinica.longitud != null
    && String(clinica.latitud).trim() !== '' && String(clinica.longitud).trim() !== ''
    && Number.isFinite(Number(clinica.latitud)) && Number.isFinite(Number(clinica.longitud))
    && Math.abs(Number(clinica.latitud)) <= 90 && Math.abs(Number(clinica.longitud)) <= 180;
}

function CentrarUbicacion({ posicion }) {
  const mapa = useMap();
  useEffect(() => {
    if (posicion) mapa.setView([posicion.lat, posicion.lng], 14);
  }, [mapa, posicion]);
  return null;
}

export default function MapaClinicas() {
  const [clinicas, setClinicas] = useState([]);
  const [miPosicion, setMiPosicion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [ubicando, setUbicando] = useState(true);
  const [error, setError] = useState('');
  const [avisoUbicacion, setAvisoUbicacion] = useState('');
  const [intento, setIntento] = useState(0);
  const [parametros, setParametros] = useSearchParams();
  const solicitudUbicacion = useRef(null);
  const montado = useRef(false);
  const ficha = useRef(null);
  const directorio = useRef(null);
  const clinicaId = parametros.get('clinica');
  const medicoReserva = Number(parametros.get('reservar'));
  const reservaAbierta = Number.isSafeInteger(medicoReserva) && medicoReserva > 0;

  useEffect(() => {
    let activo = true;
    setCargando(true);
    setError('');
    clinicasService.listar()
      .then(filas => { if (activo) setClinicas(filas); })
      .catch(() => { if (activo) setError('No pudimos cargar las clínicas. Revisa tu conexión y vuelve a intentarlo.'); })
      .finally(() => { if (activo) setCargando(false); });
    return () => { activo = false; };
  }, [intento]);

  async function ubicarme() {
    setUbicando(true);
    setAvisoUbicacion('');
    // Compartir la petición evita solicitar dos veces en React StrictMode.
    if (!solicitudUbicacion.current) solicitudUbicacion.current = clinicasService.obtenerUbicacionUsuario();
    try {
      const posicion = await solicitudUbicacion.current;
      if (montado.current) setMiPosicion(posicion);
    } catch (e) {
      if (montado.current) setAvisoUbicacion(e.message);
    } finally {
      solicitudUbicacion.current = null;
      if (montado.current) setUbicando(false);
    }
  }

  useEffect(() => {
    montado.current = true;
    ubicarme();
    return () => { montado.current = false; };
  }, []);

  const ordenadas = useMemo(() => clinicas.map(clinica => ({
    ...clinica,
    distancia: miPosicion && coordenadasValidas(clinica)
      ? clinicasService.distanciaKm(miPosicion, { lat: Number(clinica.latitud), lng: Number(clinica.longitud) })
      : null,
  })).sort((a, b) => miPosicion ? (a.distancia ?? Infinity) - (b.distancia ?? Infinity) : 0), [clinicas, miPosicion]);
  const seleccionada = ordenadas.find(c => String(c.id_clinica) === clinicaId);

  useEffect(() => {
    if (seleccionada) {
      ficha.current?.scrollIntoView({ block: 'start' });
      ficha.current?.focus({ preventScroll: true });
    }
  }, [seleccionada?.id_clinica]);

  function seleccionar(id) {
    const siguientes = new URLSearchParams(parametros);
    siguientes.set('clinica', String(id));
    siguientes.delete('reservar');
    siguientes.delete('fecha');
    setParametros(siguientes);
  }

  function volver() {
    setParametros({});
    directorio.current?.scrollIntoView({ block: 'start' });
    directorio.current?.focus({ preventScroll: true });
  }

  function abrirReserva(id) {
    const siguientes = new URLSearchParams(parametros);
    siguientes.set('reservar', String(id));
    setParametros(siguientes);
  }

  function cerrarReserva() {
    const siguientes = new URLSearchParams(parametros);
    siguientes.delete('reservar');
    siguientes.delete('fecha');
    setParametros(siguientes, { replace: true });
  }

  return <main className="contenedor clinicas-pagina">
    <div className="encabezado">
      <p className="etiqueta-seccion">Elige dónde atenderte</p>
      <h1>Mapa de clínicas</h1>
      <p>Explora las clínicas, conoce a sus especialistas y elige dónde reservar tu cita.</p>
    </div>
    <div className="clinicas-ubicacion">
      <div>
        <strong>{miPosicion ? 'Clínicas ordenadas por cercanía' : 'Encuentra una clínica para ti'}</strong>
        <p>{miPosicion ? 'Distancias aproximadas en línea recta; no indican tiempo de viaje.' : 'Comparte tu ubicación o explora y elige una clínica manualmente.'}</p>
      </div>
      <button className="boton" type="button" onClick={ubicarme} disabled={ubicando}>{ubicando ? 'Buscando ubicación…' : 'Usar mi ubicación'}</button>
    </div>
    {avisoUbicacion && <p className="clinicas-aviso" role="status">{avisoUbicacion}</p>}
    {error && <div className="alerta alerta-error" role="alert"><p>{error}</p><button className="boton boton-secundario" type="button" onClick={() => setIntento(i => i + 1)}>Reintentar</button></div>}
    <div className="mapa-contenedor">
      <MapContainer center={CENTRO_ICA} zoom={14} style={{ height: '100%', width: '100%' }} scrollWheelZoom={false}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <CentrarUbicacion posicion={miPosicion} />
        {miPosicion && <>
          {Number.isFinite(miPosicion.precision) && miPosicion.precision > 0 &&
            <Circle center={[miPosicion.lat, miPosicion.lng]} radius={miPosicion.precision} interactive={false} pathOptions={{ color: '#2663d6', weight: 1, fillOpacity: 0.1 }} />}
          <Marker position={[miPosicion.lat, miPosicion.lng]} icon={iconoUsuario} title="Tu ubicación aproximada"
            alt="Tu ubicación aproximada" interactive={false} keyboard={false} zIndexOffset={-1000} />
        </>}
        {ordenadas.filter(coordenadasValidas).map(c => <Marker key={c.id_clinica} position={[Number(c.latitud), Number(c.longitud)]}
          icon={iconoClinica} title={`Ver ${c.nombre}`} alt={`Ver ${c.nombre}`} eventHandlers={{ click: () => seleccionar(c.id_clinica) }} />)}
      </MapContainer>
    </div>
    <div className="clinicas-leyenda">
      <span><img className="clinicas-leyenda-icono" src={clinicaMarcador} alt="" /> Clínica registrada</span>
      {miPosicion && <span><i className="clinicas-punto clinicas-punto-usuario" /> Tu ubicación{Number.isFinite(miPosicion.precision) ? ` · precisión aproximada de ${Math.round(miPosicion.precision)} m` : ''}</span>}
    </div>
    <section ref={directorio} className="clinicas-directorio" tabIndex={-1} aria-labelledby="clinicas-directorio-titulo">
      <div className="clinicas-lista-cabecera"><h2 id="clinicas-directorio-titulo">Elige una clínica</h2>{!cargando && !error && <span>{clinicas.length} clínicas</span>}</div>
      {cargando ? <p role="status">Cargando clínicas…</p> : !error && clinicas.length === 0 ? <p>No hay clínicas registradas por el momento.</p> :
        <div className="clinicas-lista">{ordenadas.map(c => <button key={c.id_clinica} type="button"
          className={`clinica-opcion${String(c.id_clinica) === clinicaId ? ' clinica-seleccionada' : ''}`}
          aria-pressed={String(c.id_clinica) === clinicaId} onClick={() => seleccionar(c.id_clinica)}>
          <strong>{c.nombre}</strong><span>{c.direccion}</span>
          {c.distancia != null && <span className="distancia">Aprox. {c.distancia.toFixed(2)} km</span>}
          {!coordenadasValidas(c) && <small>Ubicación en mapa no registrada</small>}
          <small className="clinica-ver">Ver médicos y horarios <span aria-hidden="true">→</span></small>
        </button>)}</div>}
    </section>
    {!cargando && !error && clinicaId && !seleccionada && <p role="status">La clínica seleccionada no está en el directorio. Puedes elegir otra.</p>}
    {seleccionada && <div ref={ficha} tabIndex={-1} className="clinica-ficha-destino" aria-label={`Ficha de ${seleccionada.nombre}`}>
      <FichaClinica key={seleccionada.id_clinica} clinica={seleccionada} onReservar={abrirReserva} onCerrar={volver} />
    </div>}
    {reservaAbierta && <ReservaModal key={medicoReserva} medicoId={medicoReserva} fechaInicial={parametros.get('fecha') || ''} onClose={cerrarReserva} />}
  </main>;
}
