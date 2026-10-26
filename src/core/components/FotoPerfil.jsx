import { useEffect, useId, useRef, useState } from 'react';
import './FotoPerfil.css';

const MAX_SIZE_FOTO = 5 * 1024 * 1024;
const FORMATOS_PERMITIDOS = ['image/jpeg', 'image/png', 'image/webp'];

function IconoCamara() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M4 7.5h3l1.4-2h7.2l1.4 2h3A1.5 1.5 0 0 1 21.5 9v9a1.5 1.5 0 0 1-1.5 1.5H4A1.5 1.5 0 0 1 2.5 18V9A1.5 1.5 0 0 1 4 7.5Z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

function IconoGuardar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m5 12 4.5 4.5L19 7" />
    </svg>
  );
}

function IconoCancelar() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m6 6 12 12M18 6 6 18" />
    </svg>
  );
}

function obtenerIniciales(nombre = '') {
  return (
    nombre
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((parte) => parte[0])
      .join('')
      .toUpperCase() || '?'
  );
}

export default function FotoPerfil({
  nombre = '',
  fotoUrl = '',
  editable = true,
  onGuardar,
}) {
  const inputId = useId();
  const inputRef = useRef(null);

  const [archivo, setArchivo] = useState(null);
  const [vistaPrevia, setVistaPrevia] = useState('');
  const [imagenFallida, setImagenFallida] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!archivo) {
      setVistaPrevia('');
      return undefined;
    }

    const url = URL.createObjectURL(archivo);
    setVistaPrevia(url);

    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  useEffect(() => {
    setImagenFallida(false);
  }, [fotoUrl]);

  const urlFoto = typeof fotoUrl === 'string' ? fotoUrl.trim() : '';
  const imagenMostrar = vistaPrevia || (!imagenFallida ? urlFoto : '');
  const iniciales = obtenerIniciales(nombre);

  function seleccionarArchivo(evento) {
    const seleccionado = evento.target.files?.[0];
    evento.target.value = '';

    if (!seleccionado) return;

    if (!FORMATOS_PERMITIDOS.includes(seleccionado.type)) {
      setError('Elige una imagen JPG, PNG o WEBP.');
      return;
    }

    if (seleccionado.size > MAX_SIZE_FOTO) {
      setError('La imagen no debe superar los 5 MB.');
      return;
    }

    setError('');
    setImagenFallida(false);
    setArchivo(seleccionado);
  }

  function cancelarCambio() {
    setArchivo(null);
    setError('');
    setImagenFallida(false);
  }

  async function guardarFoto() {
    if (!archivo || !onGuardar || guardando) return;

    setGuardando(true);
    setError('');

    try {
      const resultado = await onGuardar(archivo);

      // Si el padre no actualiza fotoUrl, mostrar la URL devuelta por onGuardar
      // no es posible sin conservar ese valor localmente.
      if (resultado?.foto_url || resultado?.usuario?.foto_url) {
        const urlGuardada =
          resultado.foto_url || resultado.usuario.foto_url;

        if (typeof urlGuardada === 'string' && urlGuardada.trim()) {
          setImagenFallida(false);
        }
      }

      setArchivo(null);
    } catch (err) {
      setError(
        err?.message || 'No se pudo guardar la foto. Inténtalo nuevamente.',
      );
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="foto-perfil">
      <div className="foto-perfil__marco">
        {imagenMostrar ? (
          <img
            key={imagenMostrar}
            className="foto-perfil__imagen"
            src={imagenMostrar}
            alt={`Foto de perfil de ${nombre || 'usuario'}`}
            onError={() => {
              if (!vistaPrevia) setImagenFallida(true);
            }}
          />
        ) : (
          <span className="foto-perfil__iniciales" aria-hidden="true">
            {iniciales}
          </span>
        )}

        {editable && !archivo && (
          <>
            <input
              ref={inputRef}
              id={inputId}
              className="foto-perfil__input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={seleccionarArchivo}
              aria-label="Seleccionar foto de perfil"
              disabled={guardando}
            />

            <button
              className="foto-perfil__camara"
              type="button"
              onClick={() => inputRef.current?.click()}
              aria-label="Cambiar foto de perfil"
              title="Cambiar foto"
              disabled={guardando}
            >
              <IconoCamara />
            </button>
          </>
        )}
      </div>

      {editable && archivo && (
        <div
          className="foto-perfil__acciones"
          aria-label="Confirmar cambio de foto"
        >
          <button
            className="foto-perfil__accion foto-perfil__accion--guardar"
            type="button"
            onClick={guardarFoto}
            disabled={guardando || !onGuardar}
            aria-label={guardando ? 'Guardando foto' : 'Guardar nueva foto'}
            title={guardando ? 'Guardando…' : 'Guardar foto'}
          >
            {guardando ? (
              <span className="foto-perfil__spinner" />
            ) : (
              <IconoGuardar />
            )}
          </button>

          <button
            className="foto-perfil__accion foto-perfil__accion--cancelar"
            type="button"
            onClick={cancelarCambio}
            disabled={guardando}
            aria-label="Cancelar cambio de foto"
            title="Cancelar"
          >
            <IconoCancelar />
          </button>
        </div>
      )}

      {error && (
        <p className="foto-perfil__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
