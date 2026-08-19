// Componente: inicio de sesión (RF02). Usa authService.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function FormularioLogin() {
  const [datos, setDatos] = useState({ correo: '', password: '' });
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function entrar() {
    setError('');
    if (!datos.correo.trim() || !datos.password) return setError('Ingresa tu correo y contraseña.');
    setEnviando(true);
    try {
      await authService.iniciarSesion(datos);
      navegar('/especialistas');
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contenedor">
      <div className="encabezado">
        <p className="etiqueta-seccion">Bienvenido de nuevo</p>
        <h1>Iniciar sesión</h1>
      </div>
      <div className="tarjeta" style={{ maxWidth: 480 }}>
        <div className="formulario">
          <label>Correo electrónico
            <input name="correo" type="email" value={datos.correo} onChange={cambiar} />
          </label>
          <label>Contraseña
            <input name="password" type="password" value={datos.password} onChange={cambiar}
              onKeyDown={(e) => e.key === 'Enter' && entrar()} />
          </label>
          {error && <p className="alerta alerta-error">{error}</p>}
          <button className="boton" onClick={entrar} disabled={enviando}>
            {enviando ? 'Verificando…' : 'Entrar'}
          </button>
          <p style={{ fontSize: '0.9rem' }}>¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link></p>
        </div>
      </div>
    </div>
  );
}
