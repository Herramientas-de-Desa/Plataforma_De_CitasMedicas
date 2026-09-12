-- ============================================================
--  PLATAFORMA INTELIGENTE DE RECOMENDACIÓN DE CITAS MÉDICAS
--  Base de datos para SUPABASE (PostgreSQL)
--  Ejecutar en: Supabase Dashboard -> SQL Editor -> New query
-- ============================================================

-- ------------------------------------------------------------
-- 1. TABLA: usuarios  (perfil vinculado a Supabase Auth)
--    Supabase Auth ya gestiona correo + contraseña con hash
--    seguro (equivalente a bcrypt) y emite JWT automáticamente,
--    cumpliendo RF01, RF02 y RNF01.
-- ------------------------------------------------------------
create table if not exists public.usuarios (
  id_usuario uuid primary key references auth.users(id) on delete cascade,
  nombres    text not null,
  correo     text not null unique,
  telefono   text,
  rol        text not null default 'paciente'
             check (rol in ('paciente', 'medico', 'admin')),
  creado_en  timestamptz not null default now()
);

-- ------------------------------------------------------------
-- 2. TABLA: especialidades
-- ------------------------------------------------------------
create table if not exists public.especialidades (
  id_especialidad serial primary key,
  nombre          text not null unique
);

-- ------------------------------------------------------------
-- 3. TABLA: clinicas  (con coordenadas para geolocalización)
-- ------------------------------------------------------------
create table if not exists public.clinicas (
  id_clinica serial primary key,
  nombre     text not null,
  direccion  text not null,
  telefono   text,
  latitud    double precision not null,
  longitud   double precision not null
);

-- ------------------------------------------------------------
-- 4. TABLA: medicos
--    Un médico pertenece a una especialidad y a una clínica.
-- ------------------------------------------------------------
create table if not exists public.medicos (
  id_medico       serial primary key,
  usuario_id      uuid references public.usuarios(id_usuario) on delete set null,
  nombre          text not null,
  telefono        text,
  especialidad_id int  not null references public.especialidades(id_especialidad),
  clinica_id      int  not null references public.clinicas(id_clinica),
  disponible      boolean not null default true
);

-- ------------------------------------------------------------
-- 5. TABLA: horarios  (disponibilidad semanal del médico)
--    dia_semana: 1 = Lunes ... 7 = Domingo
-- ------------------------------------------------------------
create table if not exists public.horarios (
  id_horario  serial primary key,
  medico_id   int not null references public.medicos(id_medico) on delete cascade,
  dia_semana  int not null check (dia_semana between 1 and 7),
  hora_inicio time not null,
  hora_fin    time not null,
  check (hora_fin > hora_inicio)
);

-- ------------------------------------------------------------
-- 6. TABLA: citas
--    Un paciente puede registrar múltiples citas.
--    Se evita doble reserva del mismo médico, fecha y hora.
-- ------------------------------------------------------------
create table if not exists public.citas (
  id_cita     serial primary key,
  paciente_id uuid not null references public.usuarios(id_usuario) on delete cascade,
  medico_id   int  not null references public.medicos(id_medico) on delete cascade,
  fecha       date not null,
  hora        time not null,
  estado      text not null default 'pendiente'
              check (estado in ('pendiente', 'confirmada', 'atendida', 'cancelada')),
  creado_en   timestamptz not null default now(),
  unique (medico_id, fecha, hora)
);

-- ------------------------------------------------------------
-- 7. VISTA: historial_citas  (entidad Historial de Citas)
-- ------------------------------------------------------------
create or replace view public.historial_citas as
select
  c.id_cita,
  c.paciente_id,
  u.nombres        as paciente,
  m.id_medico,
  m.nombre         as medico,
  e.nombre         as especialidad,
  cl.nombre        as clinica,
  c.fecha,
  c.hora,
  c.estado,
  c.creado_en
from public.citas c
join public.usuarios       u  on u.id_usuario = c.paciente_id
join public.medicos        m  on m.id_medico  = c.medico_id
join public.especialidades e  on e.id_especialidad = m.especialidad_id
join public.clinicas       cl on cl.id_clinica = m.clinica_id;

-- ------------------------------------------------------------
-- 8. TRIGGER: crear perfil automáticamente al registrarse
--    (lee nombres y rol desde los metadatos del registro)
-- ------------------------------------------------------------
create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.usuarios (id_usuario, nombres, correo, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombres', 'Sin nombre'),
    new.email,
    coalesce(new.raw_user_meta_data ->> 'rol', 'paciente')
  )
  on conflict (id_usuario) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_crear_perfil on auth.users;
create trigger trg_crear_perfil
  after insert on auth.users
  for each row execute function public.crear_perfil_usuario();

-- ------------------------------------------------------------
-- 9. SEGURIDAD: Row Level Security (RLS)
-- ------------------------------------------------------------
alter table public.usuarios       enable row level security;
alter table public.especialidades enable row level security;
alter table public.clinicas       enable row level security;
alter table public.medicos        enable row level security;
alter table public.horarios       enable row level security;
alter table public.citas          enable row level security;

-- Función auxiliar: rol del usuario autenticado
create or replace function public.rol_actual()
returns text language sql stable security definer set search_path = public
as $$ select rol from public.usuarios where id_usuario = auth.uid() $$;

-- usuarios: cada quien ve/edita su perfil; el admin ve todos
create policy "usuarios_select" on public.usuarios
  for select using (auth.uid() = id_usuario or public.rol_actual() = 'admin');
create policy "usuarios_update" on public.usuarios
  for update using (auth.uid() = id_usuario or public.rol_actual() = 'admin');

-- catálogos: lectura pública, escritura solo admin
create policy "especialidades_select" on public.especialidades for select using (true);
create policy "especialidades_admin"  on public.especialidades for all
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');

create policy "clinicas_select" on public.clinicas for select using (true);
create policy "clinicas_admin"  on public.clinicas for all
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');

create policy "medicos_select" on public.medicos for select using (true);
create policy "medicos_admin"  on public.medicos for all
  using (public.rol_actual() = 'admin') with check (public.rol_actual() = 'admin');

create policy "horarios_select" on public.horarios for select using (true);
create policy "horarios_gestion" on public.horarios for all
  using (
    public.rol_actual() = 'admin'
    or exists (select 1 from public.medicos m
               where m.id_medico = horarios.medico_id and m.usuario_id = auth.uid())
  )
  with check (
    public.rol_actual() = 'admin'
    or exists (select 1 from public.medicos m
               where m.id_medico = horarios.medico_id and m.usuario_id = auth.uid())
  );

-- citas: el paciente gestiona las suyas; el médico ve las de su agenda; admin todo
create policy "citas_select" on public.citas
  for select using (
    paciente_id = auth.uid()
    or public.rol_actual() = 'admin'
    or exists (select 1 from public.medicos m
               where m.id_medico = citas.medico_id and m.usuario_id = auth.uid())
  );
create policy "citas_insert" on public.citas
  for insert with check (paciente_id = auth.uid() or public.rol_actual() = 'admin');
create policy "citas_update" on public.citas
  for update using (
    paciente_id = auth.uid()
    or public.rol_actual() = 'admin'
    or exists (select 1 from public.medicos m
               where m.id_medico = citas.medico_id and m.usuario_id = auth.uid())
  );
create policy "citas_delete" on public.citas
  for delete using (paciente_id = auth.uid() or public.rol_actual() = 'admin');

-- ------------------------------------------------------------
-- 10. DATOS DE PRUEBA (semilla)
-- ------------------------------------------------------------
insert into public.especialidades (nombre) values
  ('Medicina General'), ('Pediatría'), ('Cardiología'),
  ('Dermatología'), ('Ginecología'), ('Traumatología'),
  ('Oftalmología'), ('Odontología')
on conflict (nombre) do nothing;

insert into public.clinicas (nombre, direccion, telefono, latitud, longitud) values
  ('Clínica Santa Rosa de Ica',  'Av. San Martín 350, Ica',   '056-234511', -14.0678, -75.7286),
  ('Centro Médico El Carmen',    'Calle Lima 145, Ica',       '056-221430', -14.0640, -75.7301),
  ('Policlínico La Angostura',   'Av. Los Maestros 890, Ica', '056-238765', -14.0755, -75.7350),
  ('Clínica San José',           'Av. Cutervo 512, Ica',      '056-215678', -14.0621, -75.7259);

insert into public.medicos (nombre, telefono, especialidad_id, clinica_id) values
  ('Dr. Carlos Ramos Peña',    '956111222', 1, 1),
  ('Dra. María Torres Gala',   '956333444', 2, 1),
  ('Dr. Jorge Salas Quispe',   '956555666', 3, 2),
  ('Dra. Ana Lucía Herrera',   '956777888', 4, 2),
  ('Dr. Pedro Anicama Ríos',   '956999000', 5, 3),
  ('Dra. Rosa Uchuya Flores',  '955123456', 6, 3),
  ('Dr. Luis Cabrera Munayco', '955654321', 7, 4),
  ('Dra. Karla Espino Donayre','955987654', 1, 4);

-- Horarios: lunes a viernes, turno mañana para todos
insert into public.horarios (medico_id, dia_semana, hora_inicio, hora_fin)
select m.id_medico, d.dia, time '08:00', time '13:00'
from public.medicos m cross join (values (1),(2),(3),(4),(5)) as d(dia);

-- Turno tarde (lun, mié, vie) para médicos con id par
insert into public.horarios (medico_id, dia_semana, hora_inicio, hora_fin)
select m.id_medico, d.dia, time '15:00', time '19:00'
from public.medicos m cross join (values (1),(3),(5)) as d(dia)
where m.id_medico % 2 = 0;

-- ------------------------------------------------------------
-- Para convertir un usuario en ADMIN después de registrarlo:
--   update public.usuarios set rol = 'admin' where correo = 'admin@demo.com';
-- ------------------------------------------------------------
