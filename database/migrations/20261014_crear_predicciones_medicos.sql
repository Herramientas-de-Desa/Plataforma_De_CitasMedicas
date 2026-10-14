-- ============================================================
-- Resultados de demanda por médico generados en Kaggle.
-- Esta migración solo agrega la tabla de predicciones y su índice.
-- No modifica la lógica ni las tablas existentes del proyecto.
-- ============================================================

begin;

create table if not exists public.predicciones_medicos (
  id_prediccion           bigserial primary key,
  medico_id               int not null
    references public.medicos(id_medico) on delete cascade,
  fecha_generacion        timestamptz not null default now(),
  fecha_inicio            date not null,
  fecha_fin               date not null,
  horizonte_dias          int not null default 14
    check (horizonte_dias between 1 and 90),
  demanda_estimada        numeric(5,2) not null
    check (demanda_estimada between 0 and 100),
  disponibilidad_estimada numeric(5,2) not null
    check (disponibilidad_estimada between 0 and 100),
  nivel_demanda           text not null
    check (nivel_demanda in ('baja', 'media', 'alta', 'saturada')),
  version_modelo          text not null,
  origen_datos            text not null default 'historico',
  mae_modelo              numeric(8,4),
  check (fecha_fin >= fecha_inicio),
  check (
    abs((demanda_estimada + disponibilidad_estimada) - 100) <= 0.10
  ),
  unique (medico_id, fecha_inicio, fecha_fin, version_modelo)
);

create index if not exists predicciones_medicos_busqueda_idx
  on public.predicciones_medicos (
    medico_id,
    horizonte_dias,
    fecha_generacion desc
  );

-- La aplicación únicamente consulta los resultados. Las cargas se realizan
-- desde el panel de Supabase mediante el CSV producido por Kaggle.
grant select on public.predicciones_medicos to anon, authenticated;

commit;
