import { useState } from 'react';
import { useAuth } from '../../../core/context/AuthContext';
import { authService } from '../../../core/services/authService';
import { uploadUserImageForDatabase } from '../../../core/services/cloudinaryService';
import FotoPerfil from '../../../core/components/FotoPerfil';
import PerfilMedico from '../../medicos/pages/PerfilMedico';

export default function PerfilUsuario() {
  const { perfil } = useAuth();

  return perfil.rol === 'medico'
    ? <PerfilMedico key={perfil.id_usuario} />
    : <PerfilCuenta key={perfil.id_usuario} />;
}

function PerfilCuenta() {
  const { perfil, setPerfil } = useAuth();

  const [nombres, setNombres] = useState(perfil.nombres || '');
  const [telefono, setTelefono] = useState(perfil.telefono || '');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const nombreMostrado = perfil.nombres?.trim() || 'Mi perfil';

  const hayCambios =
    nombres !== (perfil.nombres || '') ||
    telefono !== (perfil.telefono || '');

  async function guardar(evento) {
    evento.preventDefault();

    if (!hayCambios || guardando) return;

    setMensaje('');
    setError('');
    setGuardando(true);

    try {
      const actualizado = await authService.actualizarPerfil(
        perfil.id_usuario,
        {
          nombres: nombres.trim(),
          telefono: telefono.trim(),
        },
      );

      setPerfil((actual) => ({ ...actual, ...actualizado }));
      setNombres(actualizado.nombres || '');
      setTelefono(actualizado.telefono || '');
      setMensaje('Perfil actualizado.');
    } catch (e) {
      setError(e.message || 'No se pudo actualizar el perfil.');
    } finally {
      setGuardando(false);
    }
  }

  async function guardarFotoPerfil(archivo) {
    setError('');
    setMensaje('');

    // Sube la imagen a Cloudinary utilizando el ID del usuario.
    const datosFoto = await uploadUserImageForDatabase(
      archivo,
      perfil.id_usuario,
    );

    if (!datosFoto?.foto_url) {
      throw new Error('Cloudinary no devolvió una URL válida.');
    }

    // Guarda las referencias de la imagen en usuarios.
    const actualizado = await authService.actualizarPerfil(
      perfil.id_usuario,
      {
        foto_url: datosFoto.foto_url,
        foto_public_id: datosFoto.foto_public_id,
        foto_version: datosFoto.foto_version,
      },
    );

    setPerfil((actual) => ({
      ...actual,
      ...actualizado,
      foto_url: actualizado.foto_url || datosFoto.foto_url,
      foto_public_id:
        actualizado.foto_public_id || datosFoto.foto_public_id,
      foto_version:
        actualizado.foto_version ?? datosFoto.foto_version,
    }));

    setMensaje('Foto de perfil actualizada.');

    return {
      foto_url: actualizado.foto_url || datosFoto.foto_url,
    };
  }

  return (
    <div className="contenedor perfil-pagina">
      <div className="encabezado">
        <p className="etiqueta-seccion">Mi cuenta</p>
        <h1>Perfil</h1>
        <p>
          Consulta la información de tu cuenta y mantén tus datos de contacto al día.
        </p>
      </div>

      <div className="perfil-identidad tarjeta">
        <FotoPerfil
          nombre={nombreMostrado}
          fotoUrl={perfil.foto_url || ''}
          editable
          onGuardar={guardarFotoPerfil}
        />

        <div className="perfil-identidad-texto">
          <p className="perfil-identidad-etiqueta">Cuenta MediCitas</p>
          <h2>{nombreMostrado}</h2>
          <p>{perfil.correo}</p>
        </div>

        <span className="perfil-rol">{perfil.rol}</span>
      </div>

      <div className="perfil-grid">
        <form className="tarjeta perfil-panel" onSubmit={guardar}>
          <div className="perfil-panel-encabezado">
            <h2>Datos personales</h2>
            <p>
              Puedes actualizar cómo te identificas y tu número de contacto.
            </p>
          </div>

          <div className="formulario perfil-formulario">
            <label>
              Nombres
              <input
                value={nombres}
                onChange={(e) => {
                  setNombres(e.target.value);
                  setMensaje('');
                }}
                autoComplete="name"
              />
            </label>

            <label>
              Teléfono <span className="perfil-opcional">Opcional</span>
              <input
                value={telefono}
                onChange={(e) => {
                  setTelefono(e.target.value);
                  setMensaje('');
                }}
                placeholder="Ej. 956000111"
                autoComplete="tel"
                inputMode="tel"
                type="tel"
              />
            </label>

            <p className="perfil-ayuda">
              Puedes dejarlo vacío si no deseas añadir un número.
            </p>
          </div>

          {mensaje && (
            <p className="alerta alerta-exito" role="status">
              {mensaje}
            </p>
          )}

          {error && (
            <p className="alerta alerta-error" role="alert">
              {error}
            </p>
          )}

          <div className="perfil-acciones">
            <button
              className="boton"
              type="submit"
              disabled={!hayCambios || guardando}
            >
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>

        <section
          className="tarjeta perfil-panel perfil-cuenta"
          aria-labelledby="perfil-cuenta-titulo"
        >
          <div className="perfil-panel-encabezado">
            <h2 id="perfil-cuenta-titulo">Datos de la cuenta</h2>
            <p>Esta información identifica tu acceso a MediCitas.</p>
          </div>

          <dl className="perfil-detalles">
            <div>
              <dt>Correo electrónico</dt>
              <dd>{perfil.correo}</dd>
            </div>

            <div>
              <dt>Rol de la cuenta</dt>
              <dd>
                <span className="perfil-rol perfil-rol-detalle">
                  {perfil.rol}
                </span>
              </dd>
            </div>
          </dl>

          <p className="perfil-cuenta-nota">
            Estos datos no se modifican desde el perfil.
          </p>
        </section>
      </div>
    </div>
  );
}
