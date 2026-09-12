# MediCitas — Plataforma Inteligente de Recomendación de Citas Médicas

Proyecto del curso **JavaScript** — Facultad de Ingeniería de Sistemas (2026, Ica – Perú).
Implementa lo solicitado en el documento del proyecto, con **arquitectura de componentes y services**, **reutilización de APIs** y **Supabase** como base de datos.

## Tecnologías
- **Frontend:** React 18 + Vite, React Router (rutas protegidas por rol), CSS propio responsivo.
- **Base de datos y backend:** Supabase (PostgreSQL + API REST + Auth con JWT y hash seguro de contraseñas — cumple RNF01 sin necesitar bcrypt manual).
- **Geolocalización:** Leaflet + OpenStreetMap (mapa interactivo), API de Geolocalización del navegador, API Nominatim (geocodificación) y fórmula de Haversine (distancias).

## APIs reutilizadas
| API | Uso |
|---|---|
| Supabase Auth | Registro, login, sesión (JWT) — RF01, RF02 |
| Supabase REST (PostgREST) | CRUD de usuarios, médicos, especialidades, clínicas y citas |
| Geolocation API (navegador) | Posición actual del usuario — RF07 |
| OpenStreetMap (tiles) + Leaflet | Mapa interactivo de clínicas — RF07 |
| Nominatim (OSM) | Búsqueda de direcciones (geocodificación) |

## Estructura (componentes + services)
```
src/
├── services/            ← capa de acceso a datos (reutilizable)
│   ├── supabaseClient.js
│   ├── authService.js
│   ├── medicosService.js
│   ├── citasService.js
│   ├── clinicasService.js
│   ├── especialidadesService.js
│   └── usuariosService.js
├── components/          ← capa de interfaz (componentes reutilizables)
│   ├── Navbar.jsx · RutaProtegida.jsx · Portada.jsx
│   ├── FormularioRegistro.jsx · FormularioLogin.jsx
│   ├── BuscadorEspecialistas.jsx · TarjetaMedico.jsx
│   ├── ReservaCita.jsx · MisCitas.jsx
│   ├── MapaClinicas.jsx · PerfilUsuario.jsx
│   └── PanelMedico.jsx · PanelAdmin.jsx
├── context/AuthContext.jsx
└── styles/global.css
```

## Instalación paso a paso

### 1. Crear el proyecto en Supabase
1. Entra a https://supabase.com y crea un proyecto gratuito.
2. Abre **SQL Editor → New query**, pega el contenido de `database/supabase_schema.sql` y ejecútalo (crea tablas, relaciones, trigger de perfiles, políticas RLS y datos de prueba).
3. En **Authentication → Providers → Email**, desactiva "Confirm email" si quieres probar sin verificar correos.

### 2. Configurar el frontend
```bash
npm install
copy .env.example .env     # en Windows (en Linux/Mac: cp .env.example .env)
```
Edita `.env` con los datos de **Project Settings → API** de tu proyecto Supabase:
```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 3. Ejecutar
```bash
npm run dev
```
Abre http://localhost:5173

### 4. Crear el usuario administrador
1. Regístrate normalmente desde la app (por ejemplo con `admin@demo.com`).
2. En el SQL Editor de Supabase ejecuta:
```sql
update public.usuarios set rol = 'admin' where correo = 'admin@demo.com';
```
3. Cierra sesión y vuelve a entrar: verás el menú **Administración**.

Para vincular una cuenta a un médico (que vea "Mi agenda"):
```sql
update public.medicos
set usuario_id = (select id_usuario from public.usuarios where correo = 'medico@demo.com')
where id_medico = 1;
update public.usuarios set rol = 'medico' where correo = 'medico@demo.com';
```

## Requerimientos cubiertos
- **RF01/RF02:** registro e inicio de sesión seguros (Supabase Auth: JWT + hash de contraseñas).
- **RF03:** búsqueda de médicos por especialidad y nombre.
- **RF04:** horarios semanales + horas libres por fecha (cruza horarios con citas ocupadas).
- **RF05/RF06:** reservar, cancelar y actualizar el estado de citas (con restricción única para evitar doble reserva).
- **RF07:** mapa Leaflet/OpenStreetMap, ubicación del usuario y clínicas ordenadas por distancia (Haversine).
- **RF08:** panel admin: gestión de usuarios (roles), médicos, especialidades y supervisión de citas.
- **RNF01:** contraseñas con hash seguro + políticas RLS en todas las tablas.
- **RNF03/RNF05:** interfaz responsiva e intuitiva.
# Plataforma_De_CitasMedicas
