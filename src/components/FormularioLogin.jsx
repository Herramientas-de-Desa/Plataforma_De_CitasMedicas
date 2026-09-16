// Componente: acceso y recuperación de contraseña con Supabase Auth.
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import doctor from '../assets/login-doctor.svg';
import { authService } from '../services/authService';

function correoRecordado() {
  try {
    return localStorage.getItem('medicitas-correo-recordado') || '';
  } catch {
    return '';
  }
}

function Icono({ nombre, size = 18 }) {
  const trazos = {
    correo: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    candado: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    ojo: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    ojoCerrado: <><path d="M3 3 21 21M10.5 6.1A12.5 12.5 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.1 3.5M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.5-.6" /><path d="M10 10a3 3 0 0 0 4 4" /></>,
    flecha: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {trazos[nombre]}
    </svg>
  );
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
      <aside className="login-visual">
        <div className="login-visual-contenido">
          <Link to="/" className="login-brand-badge">✦ Tu salud, más cerca</Link>
          <h1>Bienvenido a<br />nuestra plataforma</h1>
          <p>Gestiona tus citas, encuentra especialistas y lleva el control de tu atención de una manera sencilla.</p>
          <div className="login-ilustracion" aria-hidden="true">
            <span className="login-circulo login-circulo-grande" />
            <span className="login-circulo login-circulo-pequeno" />
            <span className="login-anillo login-anillo-uno" />
            <span className="login-anillo login-anillo-dos" />
            <img src={doctor} alt="" />
            <span className="login-flotante login-flotante-cita"><b>✓</b> Cita confirmada</span>
            <span className="login-flotante login-flotante-atencion"><b>♡</b> Atención personalizada</span>
          </div>
        </div>
      </aside>

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
                  <Icono nombre="correo" />
                  <input id="login-correo" name="correo" type="email" autoComplete="email"
                    value={datos.correo} onChange={cambiar} aria-invalid={Boolean(error && !datos.correo.trim())} />
                </span>
              </label>
            )}

            {modo !== 'recuperar' && (
              <label htmlFor="login-password">{modo === 'nueva' ? 'Nueva contraseña' : 'Contraseña'}
                <span className="login-campo">
                  <Icono nombre="candado" />
                  <input id="login-password" name="password" type={mostrarPassword ? 'text' : 'password'}
                    autoComplete={modo === 'nueva' ? 'new-password' : 'current-password'}
                    value={datos.password} onChange={cambiar} />
                  <button type="button" className="login-ver-password"
                    aria-label={mostrarPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    aria-pressed={mostrarPassword} onClick={() => setMostrarPassword((visible) => !visible)}>
                    <Icono nombre={mostrarPassword ? 'ojoCerrado' : 'ojo'} />
                  </button>
                </span>
              </label>
            )}

            {modo === 'nueva' && (
              <label htmlFor="login-confirmacion">Confirmar contraseña
                <span className="login-campo">
                  <Icono nombre="candado" />
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
              {!enviando && <Icono nombre="flecha" />}
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
