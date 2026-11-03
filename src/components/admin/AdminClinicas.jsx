// Sección del administrador: alta y edición de clínicas, con coordenadas
// obtenidas desde la dirección (Nominatim) o escritas a mano.
import { useState } from 'react';
import { clinicasService } from '../../services/clinicasService';
import { useAvisos } from '../../context/AvisosContext';

const VACIA = { nombre: '', direccion: '', telefono: '', latitud: '', longitud: '' };

function aFormulario(clinica) {
  return {
    nombre: clinica.nombre || '', direccion: clinica.direccion || '', telefono: clinica.telefono || '',
    latitud: clinica.latitud ?? '', longitud: clinica.longitud ?? '',
  };
}

export default function AdminClinicas({ clinicas, medicos, onCambio }) {
  const [editando, setEditando] = useState(null); // null = cerrado, 'nueva' o id de clínica
  const [datos, setDatos] = useState(VACIA);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [buscando, setBuscando] = useState(false);
  const avisar = useAvisos();

  function abrir(clinica) {
    setEditando(clinica ? clinica.id_clinica : 'nueva');
    setDatos(clinica ? aFormulario(clinica) : VACIA);
    setError('');
    setAviso('');
  }

  function cambiar(campo, valor) {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setError('');
  }

  async function buscarCoordenadas() {
    if (!datos.direccion.trim()) { setError('Escribe la dirección para buscar sus coordenadas.'); return; }
    setBuscando(true);
    setError('');
    try {
      const lugar = await clinicasService.buscarDireccion(`${datos.direccion}, Ica`);
      setDatos((d) => ({ ...d, latitud: lugar.lat.toFixed(6), longitud: lugar.lng.toFixed(6) }));
      setAviso(`Ubicación encontrada: ${lugar.nombre}. Revisa que sea correcta antes de guardar.`);
    } catch (e) {
      setError(`${e.message} Puedes escribir la latitud y longitud a mano.`);
    } finally {
      setBuscando(false);
    }
  }

  async function guardar(evento) {
    evento.preventDefault();
    const latitud = Number(datos.latitud);
    const longitud = Number(datos.longitud);
    if (!datos.nombre.trim() || !datos.direccion.trim()) { setError('Completa el nombre y la dirección.'); return; }
    if (datos.latitud === '' || datos.longitud === '' || !Number.isFinite(latitud) || !Number.isFinite(longitud)
      || Math.abs(latitud) > 90 || Math.abs(longitud) > 180) {
      setError('Indica coordenadas válidas para mostrar la clínica en el mapa.');
      return;
    }
    const registro = {
      nombre: datos.nombre.trim(), direccion: datos.direccion.trim(),
      telefono: datos.telefono.trim() || null, latitud, longitud,
    };
    setGuardando(true);
    try {
      if (editando === 'nueva') await clinicasService.crear(registro);
      else await clinicasService.actualizar(editando, registro);
      setAviso('');
      avisar(editando === 'nueva' ? `Agregaste la clínica ${registro.nombre}.` : `Guardaste los cambios de ${registro.nombre}.`);
      setEditando(null);
      await onCambio();
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <section className="tarjeta admin-seccion" aria-labelledby="admin-clinicas-titulo">
      <div className="admin-seccion-cabecera">
        <div>
          <h2 id="admin-clinicas-titulo">Clínicas</h2>
          <p>Registra las clínicas y su ubicación para que aparezcan en el mapa.</p>
        </div>
        {editando === null && <button className="boton" type="button" onClick={() => abrir(null)}>Nueva clínica</button>}
      </div>

      {editando !== null && (
        <form className="admin-clinica-form" onSubmit={guardar}>
          <h3>{editando === 'nueva' ? 'Nueva clínica' : 'Editar clínica'}</h3>
          <div className="grid grid-2">
            <label>Nombre<input required maxLength={150} value={datos.nombre} onChange={(e) => cambiar('nombre', e.target.value)} /></label>
            <label>Teléfono <span className="mp-opcional">Opcional</span><input type="tel" maxLength={30} value={datos.telefono} onChange={(e) => cambiar('telefono', e.target.value)} /></label>
          </div>
          <label>Dirección
            <div className="admin-direccion">
              <input required maxLength={250} value={datos.direccion} placeholder="Ej. Av. San Martín 350" onChange={(e) => cambiar('direccion', e.target.value)} />
              <button className="boton boton-secundario" type="button" disabled={buscando} onClick={buscarCoordenadas}>
                {buscando ? 'Buscando…' : 'Buscar en el mapa'}
              </button>
            </div>
          </label>
          <div className="grid grid-2">
            <label>Latitud<input inputMode="decimal" value={datos.latitud} placeholder="-14.0678" onChange={(e) => cambiar('latitud', e.target.value)} /></label>
            <label>Longitud<input inputMode="decimal" value={datos.longitud} placeholder="-75.7286" onChange={(e) => cambiar('longitud', e.target.value)} /></label>
          </div>
          {aviso && <p className="admin-ayuda" role="status">{aviso}</p>}
          {error && <p className="alerta alerta-error" role="alert">{error}</p>}
          <div className="admin-form-acciones">
            <button className="boton" type="submit" disabled={guardando}>{guardando ? 'Guardando…' : 'Guardar clínica'}</button>
            <button className="boton boton-secundario" type="button" disabled={guardando} onClick={() => { setEditando(null); setError(''); setAviso(''); }}>Cancelar</button>
          </div>
        </form>
      )}

      <div className="admin-tabla-contenedor"><table className="tabla tabla-tarjetas admin-tabla">
        <thead><tr><th>Nombre</th><th>Dirección</th><th>Médicos</th><th>Mapa</th><th></th></tr></thead>
        <tbody>
          {clinicas.map((c) => (
            <tr key={c.id_clinica}>
              <td data-label="Nombre"><strong>{c.nombre}</strong>{c.telefono && <p className="admin-ayuda">Tel. {c.telefono}</p>}</td>
              <td data-label="Dirección">{c.direccion}</td>
              <td data-label="Médicos">{medicos.filter((m) => m.clinica?.id_clinica === c.id_clinica).length}</td>
              <td data-label="Mapa">{c.latitud != null && c.longitud != null ? 'Ubicada' : <span className="admin-alerta-texto">Sin ubicación</span>}</td>
              <td data-label="Acciones">
                <button className="boton boton-secundario boton-mini" type="button" disabled={editando !== null} onClick={() => abrir(c)}>Editar</button>
              </td>
            </tr>
          ))}
          {clinicas.length === 0 && <tr><td colSpan="5">No hay clínicas registradas.</td></tr>}
        </tbody>
      </table></div>
    </section>
  );
}
