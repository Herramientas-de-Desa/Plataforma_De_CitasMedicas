export const DIAS_ATENCION = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export function validarHorarios(horarios) {
  if (!horarios.length) return 'Activa al menos un día de atención.';
  if (horarios.length > 70) return 'Puedes registrar hasta 70 turnos de atención.';
  const minutos = hora => Number(hora.slice(0,2))*60+Number(hora.slice(3));
  for (const h of horarios) {
    if (!Number.isInteger(Number(h.dia_semana)) || h.dia_semana < 1 || h.dia_semana > 7) return 'Día no válido.';
    if (![h.hora_inicio,h.hora_fin].every(hora => /^([01]\d|2[0-3]):[0-5]\d$/.test(hora))) return 'Completa todas las horas de inicio y fin.';
    if (minutos(h.hora_fin)-minutos(h.hora_inicio)<30) return 'Cada turno debe durar al menos 30 minutos.';
  }
  for (let dia=1;dia<=7;dia++) {
    const bloques=horarios.filter(h=>Number(h.dia_semana)===dia).sort((a,b)=>a.hora_inicio.localeCompare(b.hora_inicio));
    if (bloques.some((h,i)=>i>0 && h.hora_inicio<bloques[i-1].hora_fin)) return 'Hay turnos superpuestos. Revisa las horas de cada día.';
  }
  return '';
}
