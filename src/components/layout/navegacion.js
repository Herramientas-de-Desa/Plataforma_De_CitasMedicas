export const NOMBRES_ROL = {
  visitante: 'Visitante', paciente: 'Paciente', medico: 'Médico', admin: 'Administrador',
};

export const SECCIONES_ADMIN = [
  { id: 'resumen', titulo: 'Panel de control', grupo: 'Gestión' },
  { id: 'usuarios', titulo: 'Usuarios', grupo: 'Gestión' },
  { id: 'medicos', titulo: 'Médicos', grupo: 'Gestión' },
  { id: 'especialidades', titulo: 'Especialidades', grupo: 'Gestión' },
  { id: 'citas', titulo: 'Citas', grupo: 'Gestión' },
  { id: 'demanda-medicos', titulo: 'Demanda por médico', grupo: 'Predicciones' },
  { id: 'demanda-especialidades', titulo: 'Demanda por especialidad', grupo: 'Predicciones' },
];

export const NAVEGACION_ROL = {
  visitante: [
    { to: '/', titulo: 'Inicio' },
    { to: '/especialistas', titulo: 'Especialistas' },
  ],
  paciente: [
    { to: '/especialistas', titulo: 'Especialistas', accion: 'Reservar cita' },
    { to: '/clinicas', titulo: 'Mapa de clínicas' },
    { to: '/mis-citas', titulo: 'Mis citas' },
  ],
  medico: [
    { to: '/panel-medico', titulo: 'Mi agenda', destacado: true },
    { to: '/perfil#mi-atencion', titulo: 'Mi atención' },
    { to: '/perfil', titulo: 'Mi perfil profesional' },
  ],
  admin: [{ to: '/admin', titulo: 'Panel de control' }],
};

export function enlaceActivo(to, ubicacion) {
  const [ruta, ancla = ''] = to.split('#');
  return ubicacion.pathname === ruta && (ruta !== '/perfil' || ubicacion.hash === (ancla ? `#${ancla}` : ''));
}

export function seccionAdmin(search) {
  const id = new URLSearchParams(search).get('seccion');
  return SECCIONES_ADMIN.some((seccion) => seccion.id === id) ? id : 'resumen';
}
