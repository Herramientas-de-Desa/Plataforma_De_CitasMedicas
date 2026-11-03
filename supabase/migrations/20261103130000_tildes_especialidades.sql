-- Corrige tildes en los nombres de especialidades cargados sin ellas.
-- Solo cambia filas cuyo nombre coincide exactamente; si la versión con tilde
-- ya existe (nombre único), se deja la fila como está para no fallar.
-- Ejecutar una vez en el SQL Editor de Supabase.
begin;

update public.especialidades e
set nombre = c.correcto
from (values
  ('Nutricion', 'Nutrición'),
  ('Psicologia', 'Psicología'),
  ('Pediatria', 'Pediatría'),
  ('Cardiologia', 'Cardiología'),
  ('Dermatologia', 'Dermatología'),
  ('Ginecologia', 'Ginecología'),
  ('Traumatologia', 'Traumatología'),
  ('Odontologia', 'Odontología'),
  ('Oftalmologia', 'Oftalmología'),
  ('Medicina general', 'Medicina General')
) as c(actual, correcto)
where e.nombre = c.actual
  and not exists (select 1 from public.especialidades o where o.nombre = c.correcto);

commit;
