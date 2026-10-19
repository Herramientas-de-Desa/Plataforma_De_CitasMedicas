-- ============================================================
-- MIGRATION: Agregar imágenes de médicos para Cloudinary
-- ============================================================

-- URL pública/segura de la imagen almacenada en Cloudinary
alter table public.medicos
add column if not exists foto_url text;

-- Public ID de Cloudinary.
-- Se utiliza para identificar la imagen cuando se quiera
-- reemplazarla o eliminarla.
alter table public.medicos
add column if not exists foto_public_id text;

-- Versión de la imagen proporcionada por Cloudinary.
alter table public.medicos
add column if not exists foto_version bigint;


-- ============================================================
-- ÍNDICES
-- ============================================================

-- Permite localizar rápidamente un médico mediante su
-- public_id de Cloudinary si fuese necesario.
create index if not exists medicos_foto_public_id_idx
  on public.medicos (foto_public_id);


-- ============================================================
-- COMENTARIOS
-- ============================================================

comment on column public.medicos.foto_url is
  'URL segura de la fotografía del médico almacenada en Cloudinary';

comment on column public.medicos.foto_public_id is
  'Public ID de la imagen del médico en Cloudinary';

comment on column public.medicos.foto_version is
  'Versión de la imagen proporcionada por Cloudinary';
