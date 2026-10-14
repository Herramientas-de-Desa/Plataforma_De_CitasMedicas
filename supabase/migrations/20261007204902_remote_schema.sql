


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."crear_perfil_usuario"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."crear_perfil_usuario"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."rol_actual"() RETURNS "text"
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$ select rol from public.usuarios where id_usuario = auth.uid() $$;


ALTER FUNCTION "public"."rol_actual"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."citas" (
    "id_cita" integer NOT NULL,
    "paciente_id" "uuid" NOT NULL,
    "medico_id" integer NOT NULL,
    "fecha" "date" NOT NULL,
    "hora" time without time zone NOT NULL,
    "estado" "text" DEFAULT 'pendiente'::"text" NOT NULL,
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "citas_estado_check" CHECK (("estado" = ANY (ARRAY['pendiente'::"text", 'confirmada'::"text", 'atendida'::"text", 'cancelada'::"text"])))
);


ALTER TABLE "public"."citas" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."citas_id_cita_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."citas_id_cita_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."citas_id_cita_seq" OWNED BY "public"."citas"."id_cita";



CREATE TABLE IF NOT EXISTS "public"."clinicas" (
    "id_clinica" integer NOT NULL,
    "nombre" "text" NOT NULL,
    "direccion" "text" NOT NULL,
    "telefono" "text",
    "latitud" double precision NOT NULL,
    "longitud" double precision NOT NULL
);


ALTER TABLE "public"."clinicas" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."clinicas_id_clinica_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."clinicas_id_clinica_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."clinicas_id_clinica_seq" OWNED BY "public"."clinicas"."id_clinica";



CREATE TABLE IF NOT EXISTS "public"."especialidades" (
    "id_especialidad" integer NOT NULL,
    "nombre" "text" NOT NULL
);


ALTER TABLE "public"."especialidades" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."especialidades_id_especialidad_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."especialidades_id_especialidad_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."especialidades_id_especialidad_seq" OWNED BY "public"."especialidades"."id_especialidad";



CREATE TABLE IF NOT EXISTS "public"."medicos" (
    "id_medico" integer NOT NULL,
    "usuario_id" "uuid",
    "nombre" "text" NOT NULL,
    "telefono" "text",
    "especialidad_id" integer NOT NULL,
    "clinica_id" integer NOT NULL,
    "disponible" boolean DEFAULT true NOT NULL
);


ALTER TABLE "public"."medicos" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."usuarios" (
    "id_usuario" "uuid" NOT NULL,
    "nombres" "text" NOT NULL,
    "correo" "text" NOT NULL,
    "telefono" "text",
    "rol" "text" DEFAULT 'paciente'::"text" NOT NULL,
    "creado_en" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "usuarios_rol_check" CHECK (("rol" = ANY (ARRAY['paciente'::"text", 'medico'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."usuarios" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."historial_citas" AS
 SELECT "c"."id_cita",
    "c"."paciente_id",
    "u"."nombres" AS "paciente",
    "m"."id_medico",
    "m"."nombre" AS "medico",
    "e"."nombre" AS "especialidad",
    "cl"."nombre" AS "clinica",
    "c"."fecha",
    "c"."hora",
    "c"."estado",
    "c"."creado_en"
   FROM (((("public"."citas" "c"
     JOIN "public"."usuarios" "u" ON (("u"."id_usuario" = "c"."paciente_id")))
     JOIN "public"."medicos" "m" ON (("m"."id_medico" = "c"."medico_id")))
     JOIN "public"."especialidades" "e" ON (("e"."id_especialidad" = "m"."especialidad_id")))
     JOIN "public"."clinicas" "cl" ON (("cl"."id_clinica" = "m"."clinica_id")));


ALTER VIEW "public"."historial_citas" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."horarios" (
    "id_horario" integer NOT NULL,
    "medico_id" integer NOT NULL,
    "dia_semana" integer NOT NULL,
    "hora_inicio" time without time zone NOT NULL,
    "hora_fin" time without time zone NOT NULL,
    CONSTRAINT "horarios_check" CHECK (("hora_fin" > "hora_inicio")),
    CONSTRAINT "horarios_dia_semana_check" CHECK ((("dia_semana" >= 1) AND ("dia_semana" <= 7)))
);


ALTER TABLE "public"."horarios" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."horarios_id_horario_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."horarios_id_horario_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."horarios_id_horario_seq" OWNED BY "public"."horarios"."id_horario";



CREATE SEQUENCE IF NOT EXISTS "public"."medicos_id_medico_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."medicos_id_medico_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."medicos_id_medico_seq" OWNED BY "public"."medicos"."id_medico";



ALTER TABLE ONLY "public"."citas" ALTER COLUMN "id_cita" SET DEFAULT "nextval"('"public"."citas_id_cita_seq"'::"regclass");



ALTER TABLE ONLY "public"."clinicas" ALTER COLUMN "id_clinica" SET DEFAULT "nextval"('"public"."clinicas_id_clinica_seq"'::"regclass");



ALTER TABLE ONLY "public"."especialidades" ALTER COLUMN "id_especialidad" SET DEFAULT "nextval"('"public"."especialidades_id_especialidad_seq"'::"regclass");



ALTER TABLE ONLY "public"."horarios" ALTER COLUMN "id_horario" SET DEFAULT "nextval"('"public"."horarios_id_horario_seq"'::"regclass");



ALTER TABLE ONLY "public"."medicos" ALTER COLUMN "id_medico" SET DEFAULT "nextval"('"public"."medicos_id_medico_seq"'::"regclass");



ALTER TABLE ONLY "public"."citas"
    ADD CONSTRAINT "citas_medico_id_fecha_hora_key" UNIQUE ("medico_id", "fecha", "hora");



ALTER TABLE ONLY "public"."citas"
    ADD CONSTRAINT "citas_pkey" PRIMARY KEY ("id_cita");



ALTER TABLE ONLY "public"."clinicas"
    ADD CONSTRAINT "clinicas_pkey" PRIMARY KEY ("id_clinica");



ALTER TABLE ONLY "public"."especialidades"
    ADD CONSTRAINT "especialidades_nombre_key" UNIQUE ("nombre");



ALTER TABLE ONLY "public"."especialidades"
    ADD CONSTRAINT "especialidades_pkey" PRIMARY KEY ("id_especialidad");



ALTER TABLE ONLY "public"."horarios"
    ADD CONSTRAINT "horarios_pkey" PRIMARY KEY ("id_horario");



ALTER TABLE ONLY "public"."medicos"
    ADD CONSTRAINT "medicos_pkey" PRIMARY KEY ("id_medico");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_correo_key" UNIQUE ("correo");



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id_usuario");



ALTER TABLE ONLY "public"."citas"
    ADD CONSTRAINT "citas_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "public"."medicos"("id_medico") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."citas"
    ADD CONSTRAINT "citas_paciente_id_fkey" FOREIGN KEY ("paciente_id") REFERENCES "public"."usuarios"("id_usuario") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."horarios"
    ADD CONSTRAINT "horarios_medico_id_fkey" FOREIGN KEY ("medico_id") REFERENCES "public"."medicos"("id_medico") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medicos"
    ADD CONSTRAINT "medicos_clinica_id_fkey" FOREIGN KEY ("clinica_id") REFERENCES "public"."clinicas"("id_clinica");



ALTER TABLE ONLY "public"."medicos"
    ADD CONSTRAINT "medicos_especialidad_id_fkey" FOREIGN KEY ("especialidad_id") REFERENCES "public"."especialidades"("id_especialidad");



ALTER TABLE ONLY "public"."medicos"
    ADD CONSTRAINT "medicos_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "public"."usuarios"("id_usuario") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."usuarios"
    ADD CONSTRAINT "usuarios_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."citas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "citas_delete" ON "public"."citas" FOR DELETE USING ((("paciente_id" = "auth"."uid"()) OR ("public"."rol_actual"() = 'admin'::"text")));



CREATE POLICY "citas_insert" ON "public"."citas" FOR INSERT WITH CHECK ((("paciente_id" = "auth"."uid"()) OR ("public"."rol_actual"() = 'admin'::"text")));



CREATE POLICY "citas_select" ON "public"."citas" FOR SELECT USING ((("paciente_id" = "auth"."uid"()) OR ("public"."rol_actual"() = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."medicos" "m"
  WHERE (("m"."id_medico" = "citas"."medico_id") AND ("m"."usuario_id" = "auth"."uid"()))))));



CREATE POLICY "citas_update" ON "public"."citas" FOR UPDATE USING ((("paciente_id" = "auth"."uid"()) OR ("public"."rol_actual"() = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."medicos" "m"
  WHERE (("m"."id_medico" = "citas"."medico_id") AND ("m"."usuario_id" = "auth"."uid"()))))));



ALTER TABLE "public"."clinicas" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "clinicas_admin" ON "public"."clinicas" USING (("public"."rol_actual"() = 'admin'::"text")) WITH CHECK (("public"."rol_actual"() = 'admin'::"text"));



CREATE POLICY "clinicas_select" ON "public"."clinicas" FOR SELECT USING (true);



ALTER TABLE "public"."especialidades" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "especialidades_admin" ON "public"."especialidades" USING (("public"."rol_actual"() = 'admin'::"text")) WITH CHECK (("public"."rol_actual"() = 'admin'::"text"));



CREATE POLICY "especialidades_select" ON "public"."especialidades" FOR SELECT USING (true);



ALTER TABLE "public"."horarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "horarios_gestion" ON "public"."horarios" USING ((("public"."rol_actual"() = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."medicos" "m"
  WHERE (("m"."id_medico" = "horarios"."medico_id") AND ("m"."usuario_id" = "auth"."uid"())))))) WITH CHECK ((("public"."rol_actual"() = 'admin'::"text") OR (EXISTS ( SELECT 1
   FROM "public"."medicos" "m"
  WHERE (("m"."id_medico" = "horarios"."medico_id") AND ("m"."usuario_id" = "auth"."uid"()))))));



CREATE POLICY "horarios_select" ON "public"."horarios" FOR SELECT USING (true);



ALTER TABLE "public"."medicos" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "medicos_admin" ON "public"."medicos" USING (("public"."rol_actual"() = 'admin'::"text")) WITH CHECK (("public"."rol_actual"() = 'admin'::"text"));



CREATE POLICY "medicos_select" ON "public"."medicos" FOR SELECT USING (true);



ALTER TABLE "public"."usuarios" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "usuarios_select" ON "public"."usuarios" FOR SELECT USING ((("auth"."uid"() = "id_usuario") OR ("public"."rol_actual"() = 'admin'::"text")));



CREATE POLICY "usuarios_update" ON "public"."usuarios" FOR UPDATE USING ((("auth"."uid"() = "id_usuario") OR ("public"."rol_actual"() = 'admin'::"text")));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































GRANT ALL ON FUNCTION "public"."crear_perfil_usuario"() TO "anon";
GRANT ALL ON FUNCTION "public"."crear_perfil_usuario"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."crear_perfil_usuario"() TO "service_role";



GRANT ALL ON FUNCTION "public"."rol_actual"() TO "anon";
GRANT ALL ON FUNCTION "public"."rol_actual"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."rol_actual"() TO "service_role";


















GRANT ALL ON TABLE "public"."citas" TO "anon";
GRANT ALL ON TABLE "public"."citas" TO "authenticated";
GRANT ALL ON TABLE "public"."citas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."citas_id_cita_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."citas_id_cita_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."citas_id_cita_seq" TO "service_role";



GRANT ALL ON TABLE "public"."clinicas" TO "anon";
GRANT ALL ON TABLE "public"."clinicas" TO "authenticated";
GRANT ALL ON TABLE "public"."clinicas" TO "service_role";



GRANT ALL ON SEQUENCE "public"."clinicas_id_clinica_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."clinicas_id_clinica_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."clinicas_id_clinica_seq" TO "service_role";



GRANT ALL ON TABLE "public"."especialidades" TO "anon";
GRANT ALL ON TABLE "public"."especialidades" TO "authenticated";
GRANT ALL ON TABLE "public"."especialidades" TO "service_role";



GRANT ALL ON SEQUENCE "public"."especialidades_id_especialidad_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."especialidades_id_especialidad_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."especialidades_id_especialidad_seq" TO "service_role";



GRANT ALL ON TABLE "public"."medicos" TO "anon";
GRANT ALL ON TABLE "public"."medicos" TO "authenticated";
GRANT ALL ON TABLE "public"."medicos" TO "service_role";



GRANT ALL ON TABLE "public"."usuarios" TO "anon";
GRANT ALL ON TABLE "public"."usuarios" TO "authenticated";
GRANT ALL ON TABLE "public"."usuarios" TO "service_role";



GRANT ALL ON TABLE "public"."historial_citas" TO "anon";
GRANT ALL ON TABLE "public"."historial_citas" TO "authenticated";
GRANT ALL ON TABLE "public"."historial_citas" TO "service_role";



GRANT ALL ON TABLE "public"."horarios" TO "anon";
GRANT ALL ON TABLE "public"."horarios" TO "authenticated";
GRANT ALL ON TABLE "public"."horarios" TO "service_role";



GRANT ALL ON SEQUENCE "public"."horarios_id_horario_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."horarios_id_horario_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."horarios_id_horario_seq" TO "service_role";



GRANT ALL ON SEQUENCE "public"."medicos_id_medico_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."medicos_id_medico_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."medicos_id_medico_seq" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































drop extension if exists "pg_net";

CREATE TRIGGER trg_crear_perfil AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.crear_perfil_usuario();


