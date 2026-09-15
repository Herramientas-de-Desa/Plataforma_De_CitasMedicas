-- ============================================================
-- Dataset anónimo para los puntos 3 y 5.
-- Ejecutar en Supabase SQL Editor y exportar el resultado como CSV.
-- No contiene información personal de pacientes.
-- ============================================================

with fechas as (
  select generate_series(
    coalesce((select min(fecha) from public.citas), current_date - 365),
    current_date - 1,
    interval '1 day'
  )::date as fecha
),
capacidad_diaria as (
  select
    m.id_medico as medico_id,
    m.especialidad_id,
    m.clinica_id,
    f.fecha,
    extract(isodow from f.fecha)::int as dia_semana,
    extract(month from f.fecha)::int as mes,
    coalesce(sum(
      floor(extract(epoch from (h.hora_fin - h.hora_inicio)) / 1800)
    ), 0)::int as capacidad
  from public.medicos m
  cross join fechas f
  left join public.horarios h
    on h.medico_id = m.id_medico
   and h.dia_semana = extract(isodow from f.fecha)::int
  group by m.id_medico, m.especialidad_id, m.clinica_id, f.fecha
),
citas_diarias as (
  select
    medico_id,
    fecha,
    count(*) filter (where estado <> 'cancelada')::int as reservadas,
    count(*) filter (where estado = 'cancelada')::int as canceladas
  from public.citas
  group by medico_id, fecha
)
select
  c.medico_id,
  c.especialidad_id,
  c.clinica_id,
  c.fecha,
  c.dia_semana,
  c.mes,
  c.capacidad,
  coalesce(cd.reservadas, 0) as reservadas,
  coalesce(cd.canceladas, 0) as canceladas,
  round(
    least(100, 100.0 * coalesce(cd.reservadas, 0) / nullif(c.capacidad, 0)),
    2
  ) as demanda_pct
from capacidad_diaria c
left join citas_diarias cd
  on cd.medico_id = c.medico_id
 and cd.fecha = c.fecha
where c.capacidad > 0
order by c.fecha, c.medico_id;

