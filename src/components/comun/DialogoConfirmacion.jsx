// Ventana de confirmación propia (reemplaza a confirm() del navegador).
// Se cierra con Escape, con "Volver" o tocando fuera; mientras confirma no se puede cerrar.
import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

export default function DialogoConfirmacion({
  titulo, children, textoConfirmar = 'Confirmar', textoCancelar = 'Volver',
  peligro = false, procesando = false, error = '', onConfirmar, onCancelar,
}) {
  const dialogo = useRef(null);

  useEffect(() => {
    const elemento = dialogo.current;
    elemento?.showModal();
    return () => { if (elemento?.open) elemento.close(); };
  }, []);

  function cancelar() {
    if (!procesando) onCancelar();
  }

  return createPortal(
    <dialog
      ref={dialogo}
      className="dialogo-confirmacion"
      aria-labelledby="dialogo-confirmacion-titulo"
      onCancel={(evento) => { evento.preventDefault(); cancelar(); }}
      onClick={(evento) => { if (evento.target === dialogo.current) cancelar(); }}
    >
      <h2 id="dialogo-confirmacion-titulo">{titulo}</h2>
      <div className="dialogo-confirmacion-cuerpo">{children}</div>
      {error && <p className="alerta alerta-error" role="alert">{error}</p>}
      <div className="dialogo-confirmacion-acciones">
        <button type="button" className="boton boton-secundario" onClick={cancelar} disabled={procesando}>{textoCancelar}</button>
        <button type="button" className={`boton${peligro ? ' boton-peligro-solido' : ''}`} onClick={onConfirmar} disabled={procesando}>
          {procesando ? 'Procesando…' : textoConfirmar}
        </button>
      </div>
    </dialog>,
    document.body,
  );
}
