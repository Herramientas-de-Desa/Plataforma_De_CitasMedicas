// Componente: acceso y recuperación de contraseña con Supabase Auth.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthIcon from './AuthIcon';
import AuthVisual from './AuthVisual';
import { authService } from '../services/authService';

function correoRecordado() {
  try {
    return localStorage.getItem('medicitas-correo-recordado') || '';
  } catch {
    return '';
  }
}

export default function FormularioLogin() {
  const [datos, setDatos] = useState({ correo: correoRecordado(), password: '' });
  const [recordarCorreo, setRecordarCorreo] = useState(Boolean(correoRecordado()));
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [modo, setModo] = useState(() =>
    new URLSearchParams(window.location.search).has('recuperar') ? 'nueva' : 'entrar'
  );
  const [confirmacion, setConfirmacion] = useState('');
  const [error, setError] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();

  const cambiar = (e) => setDatos((actual) => ({ ...actual, [e.target.name]: e.target.value }));

  function cambiarModo(siguiente) {
    if (modo === 'nueva' && siguiente === 'entrar') navegar('/login', { replace: true });
    setModo(siguiente);
    setError('');
    setMensaje('');
  }

  async function enviar(e) {
    e.preventDefault();
    setError('');
    setMensaje('');

    if (modo === 'entrar' && (!datos.correo.trim() || !datos.password)) {
      setError('Ingresa tu correo y contraseña.');
      return;
    }
    if (modo === 'recuperar' && !datos.correo.trim()) {
      setError('Ingresa tu correo electrónico.');
      return;
    }
    if (modo === 'nueva' && (datos.password.length < 6 || datos.password !== confirmacion)) {
      setError('La contraseña debe tener al menos 6 caracteres y coincidir con la confirmación.');
      return;
    }

    setEnviando(true);
    try {
      if (modo === 'entrar') {
        await authService.iniciarSesion(datos);
        try {
          if (recordarCorreo) localStorage.setItem('medicitas-correo-recordado', datos.correo.trim());
          else localStorage.removeItem('medicitas-correo-recordado');
        } catch { /* El acceso también funciona si el navegador bloquea el almacenamiento. */ }
        navegar('/especialistas');
      } else if (modo === 'recuperar') {
        await authService.solicitarRecuperacion(datos.correo.trim());
        setMensaje('Si ese correo está registrado, recibirás un enlace para cambiar tu contraseña.');
      } else {
        await authService.cambiarPassword(datos.password);
        navegar('/especialistas');
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setEnviando(false);
    }
  }

  const titulo = modo === 'entrar' ? 'Iniciar sesión' : modo === 'recuperar' ? 'Recuperar acceso' : 'Nueva contraseña';
  const descripcion = modo === 'entrar'
    ? 'Ingresa tus datos para acceder a tu cuenta.'
    : modo === 'recuperar'
      ? 'Te enviaremos un enlace para recuperar tu cuenta.'
      : 'Elige una nueva contraseña para tu cuenta.';

  return (
    <section className="login-page">
      <AuthVisual
        titulo={<>Bienvenido a<br />nuestra plataforma</>}
        descripcion="Gestiona tus citas, encuentra especialistas y lleva el control de tu atención de una manera sencilla."
      />

      <main className="login-panel">
        <div className="login-contenido">
          <div className="login-encabezado">
            <span className="login-cruz" aria-hidden="true">+</span>
            <div>
              <p>BIENVENIDO DE NUEVO</p>
              <h2>{titulo}</h2>
            </div>
          </div>
          <p className="login-descripcion">{descripcion}</p>

          <form className="login-formulario" onSubmit={enviar} noValidate>
            {modo !== 'nueva' && (
              <label htmlFor="login-correo">Correo electrónico
                <span className="login-campo">
                  <AuthIcon nombre="correo" />
                  <input id="login-correo" name="correo" type="email" autoComplete="email"
                    value={datos.correo} onChange={cambiar} aria-invalid={Boolean(error && !datos.correo.trim())} />
                </span>
              </label>
            )}

            {modo !== 'recuperar' && (
              <label htmlFor="login-password">{modo === 'nueva' ? 'Nueva contraseña' : 'Contraseña'}
                <span className="login-campo">
                  <AuthIcon nombre="candado" />
                  <input id="login-password" name="password" type={mostrarPassword ? 'text' : 'password'}
                    autoComplete={modo === 'nueva' ? 'new-password' : 'current-password'}
                    value={datos.password} onChange={cambiar} />
                  <button type="button" className="login-ver-password"
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={mostrarPassword} onClick={() => setMostrarPassword((visible) => !visible)}>
                    <AuthIcon nombre={mostrarPassword ? 'ojoCerrado' : 'ojo'} />
                  </button>
                </span>
              </label>
            )}

            {modo === 'nueva' && (
              <label htmlFor="login-confirmacion">Confirmar contraseña
                <span className="login-campo">
                  <AuthIcon nombre="candado" />
                  <input id="login-confirmacion" type="password" autoComplete="new-password"
                    value={confirmacion} onChange={(e) => setConfirmacion(e.target.value)} />
                </span>
              </label>
            )}

            {modo === 'entrar' && (
              <div className="login-opciones">
                <label className="login-recordar">
                  <input type="checkbox" checked={recordarCorreo}
                    onChange={(e) => setRecordarCorreo(e.target.checked)} />
                  Recordar mi correo
                </label>
                <button type="button" className="login-enlace" onClick={() => cambiarModo('recuperar')}>
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
            )}

            {error && <p className="alerta alerta-error" role="alert">{error}</p>}
            {mensaje && <p className="alerta alerta-exito" role="status">{mensaje}</p>}
            <button className="login-enviar" type="submit" disabled={enviando}>
              {enviando ? 'Espera un momento…' : modo === 'entrar' ? 'Entrar' : modo === 'recuperar' ? 'Enviar enlace' : 'Guardar contraseña'}
              {!enviando && <AuthIcon nombre="flecha" />}
            </button>
          </form>

          {modo === 'entrar' ? (
            <p className="login-registro">¿Aún no tienes cuenta? <Link to="/registro">Regístrate</Link></p>
          ) : (
            <button type="button" className="login-volver login-enlace" onClick={() => cambiarModo('entrar')}>
              Volver a iniciar sesión
            </button>
          )}
          <p className="login-privacidad"><span aria-hidden="true">✦</span> Tus datos están protegidos</p>
        </div>
      </main>
    </section>
  );
}
