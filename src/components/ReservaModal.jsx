import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import ReservaCita from './ReservaCita';

export default function ReservaModal({ medicoId, fechaInicial, onClose }) {
  const dialogo = useRef(null);
  const desmontando = useRef(false);

  useEffect(() => {
    const elemento = dialogo.current;
    desmontando.current = false;
    elemento?.showModal();
    return () => {
      desmontando.current = true;
      if (elemento?.open) elemento.close();
    };
  }, []);

  return createPortal(
    <dialog
      ref={dialogo}
      className="reserva-modal"
      aria-label="Reservar cita médica"
      onClose={() => { if (!desmontando.current && !dialogo.current?.open) onClose(); }}
      onClick={(evento) => {
        if (evento.target === dialogo.current) dialogo.current.close();
      }}
    >
      <div className="reserva-modal-barra">
        <span>Reserva de cita</span>
        <button type="button" onClick={() => dialogo.current?.close()} aria-label="Cerrar ventana de reserva">
          Cerrar <span aria-hidden="true">×</span>
        </button>
      </div>
      <ReservaCita medicoIdProp={medicoId} fechaInicial={fechaInicial} enModal />
    </dialog>,
    document.body,
  );
}
