// App.jsx — Rutas de la aplicación con protección por rol.
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Portada from './components/Portada';
import FormularioRegistro from './components/FormularioRegistro';
import FormularioLogin from './components/FormularioLogin';
import BuscadorEspecialistas from './components/BuscadorEspecialistas';
import ReservaCita from './components/ReservaCita';
import MisCitas from './components/MisCitas';
import MapaClinicas from './components/MapaClinicas';
import PerfilUsuario from './components/PerfilUsuario';
import PanelMedico from './components/PanelMedico';
import PanelAdmin from './components/PanelAdmin';
import RutaProtegida from './components/RutaProtegida';

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
            <RutaProtegida roles={['medico', 'admin']}><PanelMedico /></RutaProtegida>
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
