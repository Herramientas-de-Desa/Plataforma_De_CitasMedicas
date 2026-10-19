// Componente: panel principal de administración (RF08).
import { useCallback, useEffect, useState } from 'react';

import { usuariosService } from '../../../feature/usuarios/services/usuariosService';
import { medicosService } from '../../medicos/services/medicosService';
import { especialidadesService } from '../../medicos/services/especialidadesService';
import { clinicasService } from '../../../feature/clinicas/services/clinicasService';
import { citasService } from '../../citas/services/citasService';

import PanelUsuarios from '../components/PanelUsuarios';
import PanelMedicos from '../components/PanelMedicos';
import PanelEspecialidades from '../components/PanelEspecialidades';
import PanelCitas from '../components/PanelCitas';
import PanelDemandaMedicos from '../components/PanelDemandaMedicos';
import PanelDemandaEspecialidades from '../components/PanelDemandaEspecialidades';

export default function PanelAdmin() {
  const [pestania, setPestania] = useState('usuarios');
  const [usuarios, setUsuarios] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [clinicas, setClinicas] = useState([]);
  const [citas, setCitas] = useState([]);
  const [error, setError] = useState('');

  const cargarTodo = useCallback(async () => {
    setError('');

    try {
      const [u, m, e, cl, ci] = await Promise.all([
        usuariosService.listar(),
        medicosService.listarTodos(),
        especialidadesService.listar(),
        clinicasService.listar(),
        citasService.listarTodas(),
      ]);

      setUsuarios(u);
      setMedicos(m);
      setEspecialidades(e);
      setClinicas(cl);
      setCitas(ci);
    } catch (e) {
      setError(e.message || 'No se pudo cargar la información administrativa.');
    }
  }, []);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const pestanas = [
    ['usuarios', 'Usuarios'],
    ['medicos', 'Médicos'],
    ['especialidades', 'Especialidades'],
    ['citas', 'Citas'],
    ['demanda-medicos', 'Demanda por médico'],
    ['demanda-especialidades', 'Demanda por especialidad'],
  ];

  return (
    <div className="contenedor">
      <div className="encabezado">
        <p className="etiqueta-seccion">Administración</p>
        <h1>Panel de control</h1>
      </div>

      <nav className="admin-pestanas" aria-label="Secciones de administración">
        {pestanas.map(([clave, titulo]) => (
          <button
            key={clave}
            type="button"
            className={`boton boton-mini ${
              pestania === clave ? '' : 'boton-secundario'
            }`}
            onClick={() => setPestania(clave)}
            aria-pressed={pestania === clave}
          >
            {titulo}
          </button>
        ))}
      </nav>

      {error && (
        <div className="alerta alerta-error" role="alert">
          <p>{error}</p>
          <button
            type="button"
            className="boton boton-secundario boton-mini"
            onClick={cargarTodo}
          >
            Reintentar
          </button>
        </div>
      )}

      {pestania === 'usuarios' && (
        <PanelUsuarios
          usuarios={usuarios}
          medicos={medicos}
          onActualizar={cargarTodo}
          onError={setError}
        />
      )}

      {pestania === 'medicos' && (
        <PanelMedicos
          usuarios={usuarios}
          medicos={medicos}
          clinicas={clinicas}
          onActualizar={cargarTodo}
          onError={setError}
        />
      )}

      {pestania === 'especialidades' && (
        <PanelEspecialidades
          especialidades={especialidades}
          onActualizar={cargarTodo}
          onError={setError}
        />
      )}

      {pestania === 'citas' && (
        <PanelCitas citas={citas} />
      )}

      {pestania === 'demanda-medicos' && (
        <PanelDemandaMedicos />
      )}

      {pestania === 'demanda-especialidades' && (
        <PanelDemandaEspecialidades />
      )}
    </div>
  );
}
