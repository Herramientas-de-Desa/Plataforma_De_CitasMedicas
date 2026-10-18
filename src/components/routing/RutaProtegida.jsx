// Componente: protege rutas según sesión y rol (navegación protegida).
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function RutaProtegida({ children, roles }) {
  const { perfil, cargando } = useAuth();
  const ubicacion = useLocation();

  if (cargando) return <p className="contenedor">Cargando…</p>;
  if (!perfil) return <Navigate to="/login" state={{ returnTo: `${ubicacion.pathname}${ubicacion.search}` }} replace />;
  if (roles && !roles.includes(perfil.rol)) return <Navigate to="/" replace />;
  return children;
}
