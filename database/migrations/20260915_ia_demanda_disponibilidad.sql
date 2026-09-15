-- ============================================================
-- IA: demanda por médico y predicción de disponibilidad.
-- Migración para instalaciones de MediCitas ya existentes.
-- ============================================================

-- Una cita cancelada deja nuevamente libre el horario. La restricción
-- original incluía también las canceladas y hacía imposible reservarlo.
alter table public.citas
  drop constraint if exists citas_medico_id_fecha_hora_key;

create unique index if not exists citas_horario_activo_unico_idx
  on public.citas (medico_id, fecha, hora)
  where estado <> 'cancelada';

-- Resultados agregados producidos por el notebook de Kaggle. No almacena
-- nombres ni identificadores de pacientes.
create table if not exists public.predicciones_medicos (
  id_prediccion              bigserial primary key,
  medico_id                  int not null references public.medicos(id_medico) on delete cascade,
  fecha_generacion           timestamptz not null default now(),
  fecha_inicio               date not null,
  fecha_fin                  date not null,
  horizonte_dias             int not null default 14 check (horizonte_dias between 1 and 90),
  demanda_estimada           numeric(5,2) not null check (demanda_estimada between 0 and 100),
  disponibilidad_estimada    numeric(5,2) not null check (disponibilidad_estimada between 0 and 100),
  nivel_demanda              text not null check (nivel_demanda in ('baja', 'media', 'alta', 'saturada')),
  version_modelo             text not null,
  origen_datos               text not null default 'historico',
  mae_modelo                 numeric(8,4),
  check (fecha_fin >= fecha_inicio),
  check (abs((demanda_estimada + disponibilidad_estimada) - 100) <= 0.10),
  unique (medico_id, fecha_inicio, fecha_fin, version_modelo)
);

create index if not exists predicciones_medicos_busqueda_idx
  on public.predicciones_medicos (medico_id, horizonte_dias, fecha_generacion desc);

alter table public.predicciones_medicos enable row level security;

drop policy if exists "predicciones_medicos_select" on public.predicciones_medicos;
create policy "predicciones_medicos_select" on public.predicciones_medicos
  for select using (true);

drop policy if exists "predicciones_medicos_admin_insert" on public.predicciones_medicos;
create policy "predicciones_medicos_admin_insert" on public.predicciones_medicos
  for insert with check (public.rol_actual() = 'admin');

drop policy if exists "predicciones_medicos_admin_update" on public.predicciones_medicos;
create policy "predicciones_medicos_admin_update" on public.predicciones_medicos
  for update using (public.rol_actual() = 'admin')
  with check (public.rol_actual() = 'admin');

drop policy if exists "predicciones_medicos_admin_delete" on public.predicciones_medicos;
create policy "predicciones_medicos_admin_delete" on public.predicciones_medicos
  for delete using (public.rol_actual() = 'admin');

grant select on public.predicciones_medicos to anon, authenticated;
grant insert, update, delete on public.predicciones_medicos to authenticated;
grant usage, select on sequence public.predicciones_medicos_id_prediccion_seq to authenticated;
