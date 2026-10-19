import { Outlet } from "react-router-dom";
import SidebarMedico from "./SidebarMedico";
import HeaderMedico from "./HeaderMedico";
import "./Medico.css";

export default function LayoutMedico({ medico, onCerrarSesion }) {
  return (
    <div className="medico-layout">
      <SidebarMedico onCerrarSesion={onCerrarSesion} />

      <div className="medico-main">
        <HeaderMedico medico={medico} />

        <main className="medico-content">
          <Outlet context={{ medico }} />
        </main>
      </div>
    </div>
  );
}
