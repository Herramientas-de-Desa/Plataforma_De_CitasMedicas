// Componente: barra de navegación con enlaces según el rol.
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/authService';

export default function Navbar() {
  const { perfil } = useAuth();
  const navegar = useNavigate();

  async function salir() {
    await authService.cerrarSesion();
    navegar('/');
  }

  const clase = ({ isActive }) => (isActive ? 'activo' : undefined);

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="logo">Medi<span>Citas</span></NavLink>
        <div className="nav-links">
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
