// AvisosContext.jsx — Avisos breves ("toasts") para confirmar acciones.
// Los errores siguen mostrándose junto al formulario o botón que los causó.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

const AvisosContext = createContext(() => {});
const DURACION_MS = 4500;

export function AvisosProvider({ children }) {
  const [avisos, setAvisos] = useState([]);
  const siguienteId = useRef(0);
  const temporizadores = useRef(new Map());

  const cerrar = useCallback((id) => {
    clearTimeout(temporizadores.current.get(id));
    temporizadores.current.delete(id);
    setAvisos((lista) => lista.filter((aviso) => aviso.id !== id));
  }, []);

  const avisar = useCallback((texto, tipo = 'exito') => {
    if (!texto) return;
    const id = ++siguienteId.current;
    // Como máximo tres a la vez: el más antiguo deja sitio al nuevo.
    setAvisos((lista) => [...lista.slice(-2), { id, texto, tipo }]);
    temporizadores.current.set(id, setTimeout(() => cerrar(id), DURACION_MS));
  }, [cerrar]);

  useEffect(() => () => temporizadores.current.forEach(clearTimeout), []);

  return (
    <AvisosContext.Provider value={avisar}>
      {children}
      <div className="avisos" role="status" aria-live="polite">
        {avisos.map((aviso) => (
          <div key={aviso.id} className={`aviso aviso-${aviso.tipo}`}>
            <span aria-hidden="true">{aviso.tipo === 'exito' ? '✓' : 'i'}</span>
            <p>{aviso.texto}</p>
            <button type="button" aria-label="Cerrar aviso" onClick={() => cerrar(aviso.id)}>×</button>
          </div>
        ))}
      </div>
    </AvisosContext.Provider>
  );
}

export const useAvisos = () => useContext(AvisosContext);
