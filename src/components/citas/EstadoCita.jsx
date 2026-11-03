// Etiqueta legible del estado de una cita, con su color.
export const ETIQUETAS_ESTADO = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  atendida: 'Atendida',
  cancelada: 'Cancelada',
};

export default function EstadoCita({ estado }) {
  return <span className={`estado estado-${estado}`}>{ETIQUETAS_ESTADO[estado] || estado}</span>;
}
