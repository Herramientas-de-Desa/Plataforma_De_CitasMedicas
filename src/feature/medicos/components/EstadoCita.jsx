const estados = {
  pendiente: { etiqueta: "Pendiente", clase: "estado-pendiente" },
  confirmada: { etiqueta: "Confirmada", clase: "estado-confirmada" },
  programada: { etiqueta: "Programada", clase: "estado-confirmada" },
  completada: { etiqueta: "Completada", clase: "estado-completada" },
  atendida: { etiqueta: "Atendida", clase: "estado-completada" },
  cancelada: { etiqueta: "Cancelada", clase: "estado-cancelada" },
  "no asistió": { etiqueta: "No asistió", clase: "estado-no-asistio" },
  "no asistio": { etiqueta: "No asistió", clase: "estado-no-asistio" },
};

export default function EstadoCita({ estado }) {
  const clave = String(estado ?? "pendiente")
    .trim()
    .toLowerCase()
    .replace("ó", "o");

  const configuracion = estados[clave] || {
    etiqueta: estado || "Sin estado",
    clase: "estado-pendiente",
  };

  return (
    <span className={`estado-cita ${configuracion.clase}`}>
      <span className="estado-dot" aria-hidden="true" />
      {configuracion.etiqueta}
    </span>
  );
}
