import { Navigate, Outlet, useLocation } from "react-router-dom";

export default function ProteccionRolMedico({
  usuario,
  cargando = false,
  children,
}) {
  const location = useLocation();

  if (cargando) {
    return (
      <div className="protegido-loading">
        <span className="medico-spinner" />
        <p>Verificando acceso...</p>
      </div>
    );
  }

  if (!usuario) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location }}
      />
    );
  }

  const rol = String(
    usuario.rol
      ?? usuario.role
      ?? usuario.perfil?.rol
      ?? usuario.user_metadata?.rol
      ?? ""
  ).toLowerCase();

  if (rol !== "medico" && rol !== "médico") {
    return <Navigate to="/no-autorizado" replace />;
  }

  return children ?? <Outlet />;
}
