// Componente: perfil del usuario (actualización de datos).
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function PerfilUsuario() {
  const { perfil, setPerfil } = useAuth();
  const [nombres, setNombres] = useState(perfil.nombres);
  const [telefono, setTelefono] = useState(perfil.telefono || '');
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');

  async function guardar() {
    setMensaje(''); setError('');
    try {
      const actualizado = await authService.actualizarPerfil(perfil.id_usuario, { nombres, telefono });
      setPerfil(actualizado);
      setMensaje('Perfil actualizado.');
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="contenedor">
      <div className="encabezado">
        <p className="etiqueta-seccion">Mi cuenta</p>
        <h1>Perfil</h1>
      </div>
      <div className="tarjeta" style={{ maxWidth: 480 }}>
        <div className="formulario">
          <label>Nombres
            <input value={nombres} onChange={(e) => setNombres(e.target.value)} />
          </label>
          <label>Teléfono
            <input value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 956000111" />
          </label>
          <label>Correo
            <input value={perfil.correo} disabled />
          </label>
          <label>Rol
            <input value={perfil.rol} disabled />
          </label>
          {mensaje && <p className="alerta alerta-exito">{mensaje}</p>}
          {error && <p className="alerta alerta-error">{error}</p>}
          <button className="boton" onClick={guardar}>Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}
