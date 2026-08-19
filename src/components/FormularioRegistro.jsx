// Componente: registro de usuarios (RF01). Usa authService.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

export default function FormularioRegistro() {
  const [datos, setDatos] = useState({ nombres: '', correo: '', password: '' });
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();

  const cambiar = (e) => setDatos({ ...datos, [e.target.name]: e.target.value });

  async function registrar() {
    setError(''); setExito('');
    if (!datos.nombres.trim() || !datos.correo.trim() || !datos.password) {
      return setError('Completa todos los campos.');
    }
    if (datos.password.length < 6) {
      return setError('La contraseña debe tener al menos 6 caracteres.');
    }
    setEnviando(true);
    try {
      await authService.registrar(datos);
      setExito('Cuenta creada. Redirigiendo…');
      setTimeout(() => navegar('/especialistas'), 900);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contenedor">
      <div className="encabezado">
        <p className="etiqueta-seccion">Crear cuenta</p>
        <h1>Regístrate como paciente</h1>
        <p>Con tu cuenta podrás reservar citas y consultar tu historial.</p>
      </div>
      <div className="tarjeta" style={{ maxWidth: 480 }}>
        <div className="formulario">
          <label>Nombres completos
            <input name="nombres" value={datos.nombres} onChange={cambiar} placeholder="Ej. Junior Canchari" />
          </label>
          <label>Correo electrónico
            <input name="correo" type="email" value={datos.correo} onChange={cambiar} placeholder="tucorreo@ejemplo.com" />
          </label>
          <label>Contraseña
            <input name="password" type="password" value={datos.password} onChange={cambiar} placeholder="Mínimo 6 caracteres" />
          </label>
          {error && <p className="alerta alerta-error">{error}</p>}
          {exito && <p className="alerta alerta-exito">{exito}</p>}
          <button className="boton" onClick={registrar} disabled={enviando}>
            {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
          <p style={{ fontSize: '0.9rem' }}>¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
        </div>
      </div>
    </div>
  );
}
