// Fecha de hoy (YYYY-MM-DD) en la zona horaria de la clínica. toISOString()
// devuelve la fecha en UTC, que en Perú ya es "mañana" desde las 19:00.
export function fechaActualEnIca() {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit',
    }).formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
  return `${partes.year}-${partes.month}-${partes.day}`;
}
