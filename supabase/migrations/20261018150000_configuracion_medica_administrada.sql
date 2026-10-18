-- Alta administrada del médico y edición posterior de su propia atención.
-- Ejecutar una vez en el SQL Editor de Supabase.
begin;

-- Toda cuenta pública comienza como paciente; el administrador habilita al médico.
create or replace function public.crear_perfil_usuario() returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.usuarios(id_usuario, nombres, correo, rol)
  values (new.id, coalesce(new.raw_user_meta_data->>'nombres','Sin nombre'), new.email,
    'paciente')
  on conflict (id_usuario) do nothing;
  return new;
end;
$$;

-- Ningún usuario puede elevar su propio rol mediante la API de usuarios.
create or replace function public.proteger_rol_usuario() returns trigger
language plpgsql set search_path = public, pg_temp
as $$
begin
  if new.rol is distinct from old.rol then
    if public.rol_actual() is distinct from 'admin' then
      raise exception 'Solo el administrador puede asignar roles.';
    end if;
    if new.rol = 'medico' and not exists(select 1 from public.medicos where usuario_id=new.id_usuario) then
      raise exception 'Asigna primero la clínica, especialidad y horarios desde el panel médico.';
    end if;
    if old.rol = 'medico' and exists(select 1 from public.medicos where usuario_id=old.id_usuario) then
      raise exception 'Esta cuenta conserva un perfil médico. Revisa sus citas antes de cambiar el rol.';
    end if;
  end if;
  return new;
end;
$$;
drop trigger if exists proteger_rol_usuario on public.usuarios;
create trigger proteger_rol_usuario before update of rol on public.usuarios
  for each row execute function public.proteger_rol_usuario();

-- Sustituye cualquier borrador anterior de autogestión que se hubiese instalado.
drop function if exists public.guardar_mi_configuracion_medica(text,text,integer,integer,jsonb);

create or replace function public.guardar_mi_configuracion_medica(
  p_usuario_id uuid,
  p_nombre text, p_telefono text, p_especialidad_id integer,
  p_clinica_id integer, p_horarios jsonb
) returns integer
language plpgsql security definer set search_path = public, pg_temp
as $$
declare
  v_actor uuid := auth.uid();
  v_uid uuid;
  v_actor_rol text;
  v_rol_destino text;
  v_id integer;
  v_cantidad integer;
  v_clinica integer;
  v_especialidad integer;
  v_h record;
  v_ahora timestamp := timezone('America/Lima', now());
begin
  if v_actor is null then raise exception 'Inicia sesión para guardar tu perfil.'; end if;
  select rol into v_actor_rol from public.usuarios where id_usuario = v_actor;
  if p_usuario_id is not null and v_actor_rol is distinct from 'admin' then
    raise exception 'Solo el administrador puede asignar un médico.';
  end if;
  v_uid := coalesce(p_usuario_id, v_actor);
  -- Bloqueo por cuenta: dos guardados simultáneos no crean dos registros.
  select rol into v_rol_destino from public.usuarios where id_usuario = v_uid for update;
  if p_usuario_id is null and v_rol_destino is distinct from 'medico' then
    raise exception 'Esta opción requiere una cuenta de médico.';
  end if;
  if p_usuario_id is not null and (v_rol_destino is null or v_rol_destino = 'admin') then
    raise exception 'Selecciona una cuenta de paciente o médico válida.';
  end if;
  if p_nombre is null or length(btrim(p_nombre)) = 0 or length(p_nombre) > 150 then
    raise exception 'Escribe un nombre profesional válido.';
  end if;
  if not exists(select 1 from public.especialidades where id_especialidad = p_especialidad_id)
    or not exists(select 1 from public.clinicas where id_clinica = p_clinica_id) then
    raise exception 'Selecciona una especialidad y una clínica del catálogo.';
  end if;
  if p_horarios is null or jsonb_typeof(p_horarios) <> 'array' then
    raise exception 'Agrega al menos un turno de atención.';
  end if;
  if jsonb_array_length(p_horarios) = 0 or jsonb_array_length(p_horarios) > 70 then
    raise exception 'Agrega entre 1 y 70 turnos de atención.';
  end if;
  for v_h in select * from jsonb_to_recordset(p_horarios)
    as h(dia_semana integer, hora_inicio text, hora_fin text)
  loop
    if v_h.dia_semana is null or v_h.dia_semana not between 1 and 7
      or v_h.hora_inicio is null or v_h.hora_fin is null
      or v_h.hora_inicio !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or v_h.hora_fin !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then
      raise exception 'Revisa el día y las horas de cada turno.';
    end if;
    if v_h.hora_fin::time - v_h.hora_inicio::time < interval '30 minutes' then
      raise exception 'Cada turno debe durar al menos 30 minutos.';
    end if;
  end loop;
  if exists (
    select 1 from jsonb_array_elements(p_horarios) with ordinality a(h,i),
      jsonb_array_elements(p_horarios) with ordinality b(h,i)
    where a.i < b.i and (a.h->>'dia_semana')::integer = (b.h->>'dia_semana')::integer
      and (a.h->>'hora_inicio')::time < (b.h->>'hora_fin')::time
      and (b.h->>'hora_inicio')::time < (a.h->>'hora_fin')::time
  ) then raise exception 'Hay turnos superpuestos. Ajusta las horas.'; end if;

  select count(*), min(id_medico) into v_cantidad, v_id from public.medicos where usuario_id = v_uid;
  if v_cantidad > 1 then raise exception 'Tu cuenta tiene registros duplicados. Solicita su revisión al administrador.'; end if;
  if v_id is null and p_usuario_id is null then
    raise exception 'El administrador debe configurar primero tu perfil profesional.';
  end if;
  if v_id is not null then
    select clinica_id, especialidad_id into v_clinica, v_especialidad
      from public.medicos where id_medico = v_id for update;
    -- No cambiar el lugar o especialidad de citas ya concertadas.
    if (v_clinica <> p_clinica_id or v_especialidad <> p_especialidad_id)
      and exists(select 1 from public.citas where medico_id = v_id
        and estado in ('pendiente','confirmada') and fecha + hora >= v_ahora) then
      raise exception 'Tienes citas futuras. Resuélvelas antes de cambiar de clínica o especialidad.';
    end if;
    -- Conservar el turno exacto de cada cita futura, incluida su duración.
    if exists (
      select 1 from public.citas c where c.medico_id = v_id
        and c.estado in ('pendiente','confirmada') and c.fecha + c.hora >= v_ahora
        and not exists (
          select 1 from jsonb_to_recordset(p_horarios)
            as h(dia_semana integer, hora_inicio time, hora_fin time)
          where h.dia_semana = extract(isodow from c.fecha)
            and c.hora >= h.hora_inicio
            and extract(epoch from (h.hora_fin - c.hora)) >= 1800
            and mod(extract(epoch from (c.hora - h.hora_inicio)),1800) = 0
        )
    ) then raise exception 'Los nuevos turnos dejan fuera citas futuras. Conserva sus horarios o gestiona esas citas primero.'; end if;

    update public.medicos set nombre=btrim(p_nombre), telefono=nullif(btrim(p_telefono),''),
      especialidad_id=p_especialidad_id, clinica_id=p_clinica_id where id_medico=v_id;
  else
    insert into public.medicos(usuario_id,nombre,telefono,especialidad_id,clinica_id,disponible)
      values(v_uid,btrim(p_nombre),nullif(btrim(p_telefono),''),p_especialidad_id,p_clinica_id,true)
      returning id_medico into v_id;
  end if;
  delete from public.horarios where medico_id=v_id;
  insert into public.horarios(medico_id,dia_semana,hora_inicio,hora_fin)
    select v_id,dia_semana,hora_inicio,hora_fin from jsonb_to_recordset(p_horarios)
      as h(dia_semana integer,hora_inicio time,hora_fin time);
  if p_usuario_id is not null and v_rol_destino <> 'medico' then
    update public.usuarios set rol='medico' where id_usuario=v_uid;
  end if;
  return v_id;
end;
$$;
revoke all on function public.guardar_mi_configuracion_medica(uuid,text,text,integer,integer,jsonb) from public, anon;
grant execute on function public.guardar_mi_configuracion_medica(uuid,text,text,integer,integer,jsonb) to authenticated;
notify pgrst, 'reload schema';
commit;
