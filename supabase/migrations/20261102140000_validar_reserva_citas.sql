-- La política citas_insert solo comprobaba que paciente_id fuese el usuario
-- actual: se podía crear una cita ya confirmada o atendida, en el pasado, con
-- un médico no disponible o fuera de su horario. El trigger valida cada
-- reserva igual que la app (turnos de 30 minutos dentro del horario semanal).
-- El administrador conserva el control total.
-- Ejecutar una vez en el SQL Editor de Supabase.
begin;

create or replace function public.validar_reserva_cita() returns trigger
language plpgsql set search_path = public, pg_temp
as $$
begin
  if public.rol_actual() = 'admin' then
    return new;
  end if;

  -- Toda reserva nace pendiente; la confirma el médico.
  new.estado := 'pendiente';
  new.creado_en := now();

  if (new.fecha + new.hora) <= (now() at time zone 'America/Lima') then
    raise exception 'No puedes reservar una fecha u hora que ya pasó.';
  end if;

  if not exists (
    select 1 from public.medicos m
    where m.id_medico = new.medico_id and m.disponible
  ) then
    raise exception 'Este médico no está disponible para nuevas citas.';
  end if;

  if not exists (
    select 1 from public.horarios h
    where h.medico_id = new.medico_id
      and h.dia_semana = extract(isodow from new.fecha)
      and new.hora >= h.hora_inicio
      and extract(epoch from new.hora) + 1800 <= extract(epoch from h.hora_fin)
      and (extract(epoch from (new.hora - h.hora_inicio)) / 60)::int % 30 = 0
  ) then
    raise exception 'La hora elegida no está dentro del horario de atención del médico.';
  end if;

  return new;
end;
$$;

drop trigger if exists validar_reserva_cita on public.citas;
create trigger validar_reserva_cita before insert on public.citas
  for each row execute function public.validar_reserva_cita();

commit;
