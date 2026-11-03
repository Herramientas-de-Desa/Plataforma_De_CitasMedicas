function partesEnIca(opciones) {
  return Object.fromEntries(
    new Intl.DateTimeFormat('en-US', { timeZone: 'America/Lima', ...opciones })
      .formatToParts(new Date()).map(({ type, value }) => [type, value]),
  );
}

// Fecha de hoy (YYYY-MM-DD) en la zona horaria de la clínica. toISOString()
// devuelve la fecha en UTC, que en Perú ya es "mañana" desde las 19:00.
export function fechaActualEnIca() {
  const partes = partesEnIca({ year: 'numeric', month: '2-digit', day: '2-digit' });
  return `${partes.year}-${partes.month}-${partes.day}`;
}

// Hora actual (HH:MM, 24 h) en la zona horaria de la clínica.
export function horaActualEnIca() {
  const partes = partesEnIca({ hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return `${partes.hour}:${partes.minute}`;
}

// Suma días a una fecha YYYY-MM-DD sin depender de la zona horaria del navegador.
export function sumarDias(fechaISO, dias) {
  const fecha = new Date(`${fechaISO}T00:00:00Z`);
  fecha.setUTCDate(fecha.getUTCDate() + dias);
  return fecha.toISOString().slice(0, 10);
}

// Día de la semana como en la tabla horarios: 1 = lunes … 7 = domingo.
export function diaSemana(fechaISO) {
  return new Date(`${fechaISO}T00:00:00Z`).getUTCDay() || 7;
}

const formatoLargo = new Intl.DateTimeFormat('es-PE', {
  weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
});

// "martes 4 de noviembre" a partir de 2026-11-04.
export function formatearFechaLarga(fechaISO) {
  return formatoLargo.format(new Date(`${fechaISO}T00:00:00Z`));
}

const formatoCorto = new Intl.DateTimeFormat('es-PE', {
  weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC',
});

// "Mar 4 nov 2026" a partir de 2026-11-04, para tablas y listas.
export function formatearFechaCorta(fechaISO) {
  if (!fechaISO) return '—';
  const texto = formatoCorto.format(new Date(`${fechaISO}T00:00:00Z`)).replace(/[.,]/g, '').replace(/\bde\b\s*/g, '');
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
