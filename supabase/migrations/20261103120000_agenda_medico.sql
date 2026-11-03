-- Agenda del médico: teléfono de contacto del paciente en historial_citas y
-- subida de la foto propia del médico (la tabla medicos solo la edita el admin).
-- Requiere la migración 20261102120000_historial_citas_seguro.sql.
-- Ejecutar una vez en el SQL Editor de Supabase.
begin;

-- Teléfono del paciente, con las mismas reglas que nombre_paciente: solo para
-- el propio paciente, el admin o un médico que lo atiende.
create or replace function public.telefono_paciente(p_paciente uuid) returns text
language sql stable security definer set search_path = public, pg_temp
as $$
  select u.telefono
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

revoke all on function public.telefono_paciente(uuid) from public, anon;
grant execute on function public.telefono_paciente(uuid) to authenticated;

-- Misma vista que antes, con la columna nueva al final.
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
  c.creado_en,
  public.telefono_paciente(c.paciente_id) as paciente_telefono
from public.citas c
join public.medicos        m  on m.id_medico  = c.medico_id
join public.especialidades e  on e.id_especialidad = m.especialidad_id
join public.clinicas       cl on cl.id_clinica = m.clinica_id;

revoke all on public.historial_citas from anon, authenticated;
grant select on public.historial_citas to authenticated;

-- El médico guarda su propia foto (ya subida a Cloudinary) sin poder tocar
-- ninguna otra columna de medicos.
create or replace function public.guardar_mi_foto_medico(
  p_url text, p_public_id text, p_version bigint
) returns void
language plpgsql security definer set search_path = public, pg_temp
as $$
begin
  if p_url is null or p_url !~ '^https://res\.cloudinary\.com/' then
    raise exception 'La foto debe estar alojada en Cloudinary.';
  end if;

  update public.medicos
  set foto_url = p_url, foto_public_id = p_public_id, foto_version = p_version
  where usuario_id = auth.uid();

  if not found then
    raise exception 'Tu cuenta no tiene un perfil médico asignado.';
  end if;
end;
$$;

revoke all on function public.guardar_mi_foto_medico(text, text, bigint) from public, anon;
grant execute on function public.guardar_mi_foto_medico(text, text, bigint) to authenticated;

commit;
