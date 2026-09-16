export default function AuthIcon({ nombre, size = 18 }) {
  const trazos = {
    usuario: <><circle cx="12" cy="8" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2H4Z" /></>,
    correo: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    candado: <><rect x="5" y="10" width="14" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" /></>,
    ojo: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6-10-6-10-6Z" /><circle cx="12" cy="12" r="2.5" /></>,
    ojoCerrado: <><path d="M3 3 21 21M10.5 6.1A12.5 12.5 0 0 1 12 6c6.5 0 10 6 10 6a16 16 0 0 1-3.1 3.5M6.2 6.2C3.5 8 2 12 2 12s3.5 6 10 6c1.3 0 2.5-.2 3.5-.6" /><path d="M10 10a3 3 0 0 0 4 4" /></>,
    flecha: <><path d="M4 12h16m-6-6 6 6-6 6" /></>,
    volver: <><path d="M20 12H4m6-6-6 6 6 6" /></>,
  };

  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {trazos[nombre]}
    </svg>
  );
}
