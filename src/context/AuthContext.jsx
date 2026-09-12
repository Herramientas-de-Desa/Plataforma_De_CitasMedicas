// ============================================================
// AuthContext.jsx — Estado global de sesión y perfil del usuario.
// Reutiliza authService en toda la aplicación.
// ============================================================
import { createContext, useContext, useEffect, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [perfil, setPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let activo = true;

    async function cargarPerfil() {
      const p = await authService.obtenerPerfil();
      if (activo) {
        setPerfil(p);
        setCargando(false);
      }
    }
    cargarPerfil();

    const { data: sub } = authService.onCambioDeSesion(async (sesion) => {
      if (!sesion) {
        setPerfil(null);
        setCargando(false);
        return;
      }
      const p = await authService.obtenerPerfil();
      if (activo) {
        setPerfil(p);
        setCargando(false);
      }
    });

    return () => {
      activo = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ perfil, setPerfil, cargando }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
