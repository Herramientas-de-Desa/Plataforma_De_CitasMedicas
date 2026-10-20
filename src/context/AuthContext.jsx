// ============================================================
// AuthContext.jsx — Estado global de sesión y perfil del usuario.
// Reutiliza authService en toda la aplicación.
// ============================================================
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [perfil, establecerPerfil] = useState(null);
  const [cargando, setCargando] = useState(true);
  const solicitud = useRef(0);
  const activo = useRef(false);
  const usuarioActual = useRef(null);

  const setPerfil = useCallback((valor) => {
    solicitud.current += 1;
    usuarioActual.current = valor?.id_usuario || null;
    establecerPerfil(valor);
    setCargando(false);
  }, []);

  const refrescarPerfil = useCallback(async () => {
    const numero = ++solicitud.current;
    try {
      const p = await authService.obtenerPerfil();
      if (activo.current && numero === solicitud.current) {
        usuarioActual.current = p?.id_usuario || null;
        establecerPerfil(p);
      }
      return p;
    } finally {
      if (activo.current && numero === solicitud.current) setCargando(false);
    }
  }, []);

  useEffect(() => {
    activo.current = true;
    let pendiente;
    const cargar = () => { refrescarPerfil().catch(() => {}); };
    cargar();
    // Consultar fuera del callback evita retener el bloqueo interno de Supabase Auth.
    const { data: sub } = authService.onCambioDeSesion((sesion) => {
      clearTimeout(pendiente);
      if (!sesion) {
        setPerfil(null);
        return;
      }
      if (sesion.user.id !== usuarioActual.current) {
        solicitud.current += 1;
        establecerPerfil(null);
        setCargando(true);
      }
      pendiente = setTimeout(cargar, 0);
    });

    const alVolver = () => { if (document.visibilityState === 'visible') cargar(); };
    window.addEventListener('focus', alVolver);
    document.addEventListener('visibilitychange', alVolver);
    return () => {
      activo.current = false;
      solicitud.current += 1;
      clearTimeout(pendiente);
      window.removeEventListener('focus', alVolver);
      document.removeEventListener('visibilitychange', alVolver);
      sub?.subscription?.unsubscribe();
    };
  }, [refrescarPerfil, setPerfil]);

  return (
    <AuthContext.Provider value={{ perfil, setPerfil, cargando, refrescarPerfil }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
