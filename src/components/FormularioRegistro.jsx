// Componente: registro de usuarios (RF01). Usa authService.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthIcon from './AuthIcon';
import AuthVisual from './AuthVisual';
import { authService } from '../services/authService';

export default function FormularioRegistro() {
  const [datos, setDatos] = useState({ nombres: '', correo: '', password: '' });
  const [confirmacion, setConfirmacion] = useState('');
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmacion, setMostrarConfirmacion] = useState(false);
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();

  const cambiar = (e) => setDatos((actual) => ({ ...actual, [e.target.name]: e.target.value }));

  async function registrar(e) {
    e.preventDefault();
    if (enviando) return;
    setError('');
    setExito('');
    if (!datos.nombres.trim() || !datos.correo.trim() || !datos.password || !confirmacion) {
      setError('Completa todos los campos.');
      return;
    }
    if (datos.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    if (datos.password !== confirmacion) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setEnviando(true);
    try {
      await authService.registrar({
        nombres: datos.nombres.trim(),
        correo: datos.correo.trim(),
        password: datos.password,
      });
      setExito('Cuenta creada. Redirigiendo…');
      setTimeout(() => navegar('/especialistas'), 900);
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="login-page registro-page">
      <AuthVisual
        titulo={<>Comienza a<br />cuidar tu salud</>}
        descripcion="Crea tu cuenta para reservar citas, encontrar especialistas y consultar tu historial."
      />

      <main className="login-panel">
        <div className="login-contenido">
          <div className="login-encabezado">
            <span className="login-cruz" aria-hidden="true">+</span>
            <div>
              <p>ÚNETE A MEDICITAS</p>
              <h2>Crear cuenta</h2>
            </div>
          </div>
          <p className="login-descripcion">Regístrate como paciente para empezar.</p>

          <form className="login-formulario" onSubmit={registrar} noValidate>
            <label htmlFor="registro-nombres">Nombres completos
              <span className="login-campo">
                <AuthIcon nombre="usuario" />
                <input id="registro-nombres" name="nombres" type="text" autoComplete="name"
                  value={datos.nombres} onChange={cambiar} placeholder="Ingresa tus nombres completos" />
              </span>
            </label>

            <label htmlFor="registro-correo">Correo electrónico
              <span className="login-campo">
                <AuthIcon nombre="correo" />
                <input id="registro-correo" name="correo" type="email" autoComplete="email"
                  value={datos.correo} onChange={cambiar} placeholder="tucorreo@ejemplo.com" />
              </span>
            </label>

            <label htmlFor="registro-password">Contraseña
              <span className="login-campo">
                <AuthIcon nombre="candado" />
                <input id="registro-password" name="password" type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="new-password" value={datos.password} onChange={cambiar}
                  placeholder="Crea una contraseña" />
                <button type="button" className="login-ver-password"
                  aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={mostrarPassword} onClick={() => setMostrarPassword((visible) => !visible)}>
                  <AuthIcon nombre={mostrarPassword ? 'ojoCerrado' : 'ojo'} />
                </button>
              </span>
            </label>

            <label htmlFor="registro-confirmacion">Confirmar contraseña
              <span className="login-campo">
                <AuthIcon nombre="candado" />
                <input id="registro-confirmacion" type={mostrarConfirmacion ? 'text' : 'password'}
                  autoComplete="new-password" value={confirmacion}
                  onChange={(e) => setConfirmacion(e.target.value)} placeholder="Confirma tu contraseña" />
                <button type="button" className="login-ver-password"
                  aria-label={mostrarConfirmacion ? 'Ocultar confirmación' : 'Mostrar confirmación'}
                  aria-pressed={mostrarConfirmacion}
                  onClick={() => setMostrarConfirmacion((visible) => !visible)}>
                  <AuthIcon nombre={mostrarConfirmacion ? 'ojoCerrado' : 'ojo'} />
                </button>
              </span>
            </label>

            {error && <p className="alerta alerta-error" role="alert">{error}</p>}
            {exito && <p className="alerta alerta-exito" role="status">{exito}</p>}
            <button className="login-enviar" type="submit" disabled={enviando}>
              {enviando ? 'Creando cuenta…' : 'Crear cuenta'}
              {!enviando && <AuthIcon nombre="flecha" />}
            </button>
          </form>

          <p className="login-registro">¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link></p>
          <p className="login-privacidad"><span aria-hidden="true">✦</span> Tus datos están protegidos</p>
        </div>
      </main>
    </section>
  );
}
