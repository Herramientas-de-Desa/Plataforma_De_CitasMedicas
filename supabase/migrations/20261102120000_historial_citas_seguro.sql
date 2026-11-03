-- La vista historial_citas se ejecutaba con los permisos de su dueño (postgres)
-- e ignoraba el RLS de citas: cualquiera con la clave pública podía leer todas
-- las citas con el nombre de cada paciente. Ahora respeta el RLS de quien
-- consulta y deja de estar disponible para visitantes sin sesión.
-- Ejecutar una vez en el SQL Editor de Supabase.
begin;

-- El RLS de usuarios no deja al médico leer el perfil de sus pacientes, así que
-- el nombre se resuelve aquí y solo para quien ya puede ver esas citas. No
-- expone correo ni teléfono.
create or replace function public.nombre_paciente(p_paciente uuid) returns text
language sql stable security definer set search_path = public, pg_temp
as $$
  select u.nombres
  from public.usuarios u
  where u.id_usuario = p_paciente
    and (
      p_paciente = auth.uid()
      or public.rol_actual() = 'admin'
      or exists (
        select 1
        from public.citas c
        join public.medicos m on m.id_medico = c.medico_id
        where c.paciente_id = p_paciente and m.usuario_id = auth.uid()
      )
    )
$$;

revoke all on function public.nombre_paciente(uuid) from public, anon;
grant execute on function public.nombre_paciente(uuid) to authenticated;

create or replace view public.historial_citas
with (security_invoker = true) as
select
  c.id_cita,
  c.paciente_id,
  public.nombre_paciente(c.paciente_id) as paciente,
  m.id_medico,
  m.nombre         as medico,
  e.nombre         as especialidad,
  cl.nombre        as clinica,
  c.fecha,
  c.hora,
  c.estado,
  c.creado_en
from public.citas c
join public.medicos        m  on m.id_medico  = c.medico_id
join public.especialidades e  on e.id_especialidad = m.especialidad_id
join public.clinicas       cl on cl.id_clinica = m.clinica_id;

-- Es una vista de solo lectura para usuarios con sesión.
revoke all on public.historial_citas from anon, authenticated;
grant select on public.historial_citas to authenticated;

commit;
