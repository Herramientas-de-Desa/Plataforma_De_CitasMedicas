import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../core/context/AuthContext';
import { authService } from '../core/context/AuthContext';
import { enlaceActivo, NAVEGACION_ROL, NOMBRES_ROL } from './navegacion';
import './Navegacion.css';

export default function Navbar() {
  const { perfil, cargando, setPerfil } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [cuentaAbierta, setCuentaAbierta] = useState(false);
  const [saliendo, setSaliendo] = useState(false);
  const [error, setError] = useState('');
  const cabecera = useRef(null);
  const botonMenu = useRef(null);
  const botonCuenta = useRef(null);
  const cuenta = useRef(null);
  const rol = perfil?.rol || 'visitante';
  const enlaces = NAVEGACION_ROL[rol] || [];
  const nombre = perfil?.nombres?.trim() || 'Mi cuenta';

  useEffect(() => {
    setMenuAbierto(false);
    setCuentaAbierta(false);
    setError('');
  }, [ubicacion.pathname, ubicacion.search, ubicacion.hash, rol]);

  useEffect(() => {
    function fuera(evento) {
      if (!cabecera.current?.contains(evento.target)) setMenuAbierto(false);
      if (!cuenta.current?.contains(evento.target)) setCuentaAbierta(false);
    }
    function escapar(evento) {
      if (evento.key !== 'Escape') return;
      if (cuentaAbierta) {
        setCuentaAbierta(false);
        botonCuenta.current?.focus();
      } else if (menuAbierto) {
        setMenuAbierto(false);
        botonMenu.current?.focus();
      }
    }
    document.addEventListener('pointerdown', fuera);
    document.addEventListener('keydown', escapar);
    return () => {
      document.removeEventListener('pointerdown', fuera);
      document.removeEventListener('keydown', escapar);
    };
  }, [cuentaAbierta, menuAbierto]);

  async function salir() {
    if (saliendo) return;
    setSaliendo(true);
    setError('');
    try {
      await authService.cerrarSesion();
      setPerfil(null);
      navegar('/');
    } catch {
      setError('No pudimos cerrar la sesión. Vuelve a intentarlo.');
    } finally {
      setSaliendo(false);
    }
  }

  return (
    <header className="mc-cabecera" ref={cabecera} onBlur={(evento) => {
      if (!evento.currentTarget.contains(evento.relatedTarget)) setMenuAbierto(false);
    }}>
      <div className="mc-barra">
        <Link to="/" className="logo" aria-label="MediCitas · Inicio">Medi<span>Citas</span></Link>
        {cargando ? <span className="mc-carga" role="status">Cargando cuenta…</span> : <>
          <button ref={botonMenu} className="mc-toggle" type="button" aria-expanded={menuAbierto}
            aria-controls="mc-navegacion" onClick={() => setMenuAbierto(!menuAbierto)}>
            <span aria-hidden="true">{menuAbierto ? '×' : '☰'}</span> {menuAbierto ? 'Cerrar' : 'Menú'}
          </button>
          <div id="mc-navegacion" className={`mc-navegacion${menuAbierto ? ' mc-abierto' : ''}`} onClick={(evento) => {
            if (evento.target.closest('a')) {
              if (menuAbierto) botonMenu.current?.focus();
              setMenuAbierto(false);
              setCuentaAbierta(false);
            }
          }}>
            <nav className="mc-enlaces" aria-label="Navegación principal">
              {enlaces.map((enlace) => <Link key={enlace.to} to={enlace.to}
                aria-current={enlaceActivo(enlace.to, ubicacion) ? 'page' : undefined}
                className={`mc-enlace${enlace.destacado || enlace.accion ? ' mc-principal' : ''}`}>
                {enlace.titulo}{enlace.accion && <small>{enlace.accion} <span aria-hidden="true">↗</span></small>}
              </Link>)}
            </nav>
            {perfil ? <div className="mc-cuenta" ref={cuenta} onBlur={(evento) => {
              if (!evento.currentTarget.contains(evento.relatedTarget)) setCuentaAbierta(false);
            }}>
              <button type="button" ref={botonCuenta} className="mc-cuenta-boton"
                aria-expanded={cuentaAbierta} aria-controls="mc-menu-cuenta" onClick={() => setCuentaAbierta(!cuentaAbierta)}>
                <span className="mc-avatar" aria-hidden="true">{nombre.split(/\s+/).slice(0, 2).map(p => p[0]).join('').toUpperCase()}</span>
                <span className="mc-nombre"><strong>{nombre}</strong><small>{NOMBRES_ROL[rol] || rol}</small></span>
                <span aria-hidden="true">⌄</span>
              </button>
              {cuentaAbierta && <div id="mc-menu-cuenta" className="mc-menu-cuenta">
                <p>Mi cuenta</p>
                <Link to="/perfil" aria-current={ubicacion.pathname === '/perfil' ? 'page' : undefined}>Mi perfil</Link>
                <button type="button" onClick={salir} disabled={saliendo}>{saliendo ? 'Cerrando sesión…' : 'Cerrar sesión'}</button>
                {error && <p className="mc-error" role="alert">{error}</p>}
              </div>}
            </div> : <div className="mc-acceso">
              <Link className="mc-enlace" to="/login" aria-current={ubicacion.pathname === '/login' ? 'page' : undefined}>Iniciar sesión</Link>
              <Link className="mc-enlace mc-principal" to="/registro" aria-current={ubicacion.pathname === '/registro' ? 'page' : undefined}>Crear cuenta</Link>
            </div>}
          </div>
        </>}
      </div>
    </header>
  );
}
