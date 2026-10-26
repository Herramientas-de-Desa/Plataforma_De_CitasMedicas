import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { SECCIONES_ADMIN, seccionAdmin } from './navegacion';

export default function AdminNavegacion() {
  const ubicacion = useLocation();
  const activa = seccionAdmin(ubicacion.search);
  const [abierto, setAbierto] = useState(false);
  const boton = useRef(null);
  useEffect(() => { setAbierto(false); }, [ubicacion.search]);
  return <aside className="mc-admin-lateral" onKeyDown={(evento) => {
    if (evento.key === 'Escape' && abierto) { setAbierto(false); boton.current?.focus(); }
  }}>
    <button className="mc-admin-toggle" type="button" ref={boton} aria-expanded={abierto}
      aria-controls="mc-admin-secciones" onClick={() => setAbierto(!abierto)}>
      {SECCIONES_ADMIN.find(s => s.id === activa)?.titulo} <span aria-hidden="true">{abierto ? '−' : '+'}</span>
    </button>
    <nav id="mc-admin-secciones" aria-label="Secciones de administración" className={abierto ? 'mc-admin-abierto' : ''}
      onClick={(evento) => {
        if (evento.target.closest('a')) { if (abierto) boton.current?.focus(); setAbierto(false); }
      }}>
      {['Gestión', 'Predicciones'].map(grupo => <div className="mc-admin-grupo" key={grupo}>
        <p>{grupo}</p>
        {SECCIONES_ADMIN.filter(s => s.grupo === grupo).map(s => <Link key={s.id}
          to={s.id === 'resumen' ? '/admin' : `/admin?seccion=${s.id}`}
          aria-current={activa === s.id ? 'page' : undefined}>{s.titulo}</Link>)}
      </div>)}
    </nav>
  </aside>;
}
