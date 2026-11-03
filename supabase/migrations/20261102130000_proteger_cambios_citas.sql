-- La política citas_update dejaba al paciente y al médico cambiar cualquier
-- columna de sus citas (estado, médico, paciente, fecha u hora). RLS no puede
-- comparar el valor anterior con el nuevo, así que un trigger limita qué
-- cambio puede hacer cada rol. El administrador conserva el control total.
-- Ejecutar una vez en el SQL Editor de Supabase.
begin;

create or replace function public.proteger_cambios_cita() returns trigger
language plpgsql set search_path = public, pg_temp
as $$
declare
  v_es_medico boolean;
begin
  if public.rol_actual() = 'admin' then
    return new;
  end if;

  if new.paciente_id is distinct from old.paciente_id
     or new.medico_id is distinct from old.medico_id
     or new.fecha is distinct from old.fecha
     or new.hora is distinct from old.hora
     or new.creado_en is distinct from old.creado_en
     or new.id_cita is distinct from old.id_cita then
    raise exception 'Solo puedes cambiar el estado de la cita.';
  end if;

  if new.estado is not distinct from old.estado then
    return new;
  end if;

  if old.estado in ('atendida', 'cancelada') then
    raise exception 'Esta cita ya está %, no se puede modificar.', old.estado;
  end if;

  v_es_medico := exists (
    select 1 from public.medicos m
    where m.id_medico = old.medico_id and m.usuario_id = auth.uid()
  );

  if new.estado = 'cancelada' then
    return new; -- paciente o médico, sobre una cita pendiente o confirmada
  end if;

  if not v_es_medico then
    raise exception 'Solo el médico puede confirmar o marcar como atendida la cita.';
  end if;

  if new.estado = 'pendiente' then
    raise exception 'Una cita no puede volver a pendiente.';
  end if;

  if new.estado = 'confirmada' and old.estado <> 'pendiente' then
    raise exception 'Solo se pueden confirmar citas pendientes.';
  end if;

  if new.estado = 'atendida'
     and old.fecha > (now() at time zone 'America/Lima')::date then
    raise exception 'No puedes marcar como atendida una cita futura.';
  end if;

  return new;
end;
$$;

drop trigger if exists proteger_cambios_cita on public.citas;
create trigger proteger_cambios_cita before update on public.citas
  for each row execute function public.proteger_cambios_cita();

-- Sin WITH CHECK, la fila modificada solo se validaba con USING. Se deja
-- explícito para que nadie pueda sacar una cita de su propio alcance.
drop policy if exists "citas_update" on public.citas;
create policy "citas_update" on public.citas
  for update
  using (
    paciente_id = auth.uid()
    or public.rol_actual() = 'admin'
    or exists (select 1 from public.medicos m
               where m.id_medico = citas.medico_id and m.usuario_id = auth.uid())
  )
  with check (
    paciente_id = auth.uid()
    or public.rol_actual() = 'admin'
    or exists (select 1 from public.medicos m
               where m.id_medico = citas.medico_id and m.usuario_id = auth.uid())
  );

commit;
