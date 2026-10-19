// App.jsx — Rutas de la aplicación con protección por rol.
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './core/context/AuthContext';
import Navbar from './layout/Navbar';
import Portada from './feature/home/pages/Portada';
import FormularioRegistro from './feature/auth/pages/FormularioRegistro';
import FormularioLogin from './feature/auth/pages/FormularioLogin';
import BuscadorEspecialistas from './feature/medicos/pages/BuscadorEspecialistas';
import ReservaCita from './feature/citas/components/ReservaCita';
import MisCitas from './feature/citas/pages/MisCitas';
import MapaClinicas from './feature/clinicas/pages/MapaClinicas';
import PerfilUsuario from './feature/usuarios/pages/PerfilUsuario';
import MedicoAgenda from './feature/medicos/pages/MedicoAgenda';
import PanelAdmin from './feature/admin/pages/PanelAdmin';
import RutaProtegida from './feature/routing/RutaProtegida';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Portada />} />
          <Route path="/registro" element={<FormularioRegistro />} />
          <Route path="/login" element={<FormularioLogin />} />
          <Route path="/especialistas" element={<BuscadorEspecialistas />} />
          <Route path="/clinicas" element={<MapaClinicas />} />
          <Route path="/reservar/:idMedico" element={
            <RutaProtegida><ReservaCita /></RutaProtegida>
          } />
          <Route path="/mis-citas" element={
            <RutaProtegida><MisCitas /></RutaProtegida>
          } />
          <Route path="/perfil" element={
            <RutaProtegida><PerfilUsuario /></RutaProtegida>
          } />
          <Route path="/panel-medico" element={
            <RutaProtegida roles={['medico', 'admin']}><MedicoAgenda /></RutaProtegida>
          } />
          <Route path="/admin" element={
            <RutaProtegida roles={['admin']}><PanelAdmin /></RutaProtegida>
          } />
          <Route path="*" element={<Portada />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
