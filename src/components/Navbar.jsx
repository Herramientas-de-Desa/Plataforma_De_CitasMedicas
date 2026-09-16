// Componente: barra de navegación con enlaces según el rol.
import { useEffect, useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function Navbar() {
  const { perfil } = useAuth();
  const navegar = useNavigate();
  const ubicacion = useLocation();
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [ubicacion.pathname]);

  async function salir() {
    await authService.cerrarSesion();
    navegar('/');
  }

  const clase = ({ isActive }) => (isActive ? 'activo' : undefined);

  if (ubicacion.pathname === '/login') return null;

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="logo">Medi<span>Citas</span></NavLink>
        <button
          type="button"
          className="boton-menu"
          aria-controls="navegacion-principal"
          aria-expanded={menuAbierto}
          aria-label={menuAbierto ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
          onClick={() => setMenuAbierto((abierto) => !abierto)}
        >
          <span aria-hidden="true">{menuAbierto ? '✕' : '☰'}</span>
          <span>Menú</span>
        </button>
        <div
          id="navegacion-principal"
          className={`nav-links${menuAbierto ? ' nav-links-abierto' : ''}`}
          onClick={(evento) => {
            if (evento.target.closest('a')) setMenuAbierto(false);
          }}
        >
          <NavLink to="/especialistas" className={clase}>Especialistas</NavLink>
          <NavLink to="/clinicas" className={clase}>Clínicas cercanas</NavLink>
          {perfil && <NavLink to="/mis-citas" className={clase}>Mis citas</NavLink>}
          {perfil?.rol === 'medico' && <NavLink to="/panel-medico" className={clase}>Mi agenda</NavLink>}
          {perfil?.rol === 'admin' && <NavLink to="/admin" className={clase}>Administración</NavLink>}
          {perfil ? (
            <>
              <NavLink to="/perfil" className={clase}>{perfil.nombres.split(' ')[0]}</NavLink>
              <span className="chip-rol">{perfil.rol}</span>
              <button className="boton boton-secundario boton-mini" onClick={salir}>Cerrar sesión</button>
            </>
          ) : (
            <>
              <NavLink to="/login" className={clase}>Iniciar sesión</NavLink>
              <NavLink to="/registro" className={clase}>Crear cuenta</NavLink>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
