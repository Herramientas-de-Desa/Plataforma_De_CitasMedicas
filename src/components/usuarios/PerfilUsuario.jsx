// Componente: perfil del usuario (actualización de datos).
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useAvisos } from '../../context/AvisosContext';
import { authService } from '../../services/authService';
import PerfilMedico from '../medico/PerfilMedico';
import { NOMBRES_ROL } from '../layout/navegacion';

export default function PerfilUsuario() {
  const { perfil } = useAuth();
  return perfil.rol === 'medico'
    ? <PerfilMedico key={perfil.id_usuario} />
    : <PerfilCuenta key={perfil.id_usuario} />;
}

function PerfilCuenta() {
  const { perfil, setPerfil } = useAuth();
  const [nombres, setNombres] = useState(perfil.nombres);
  const [telefono, setTelefono] = useState(perfil.telefono || '');
  const avisar = useAvisos();
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const nombreMostrado = perfil.nombres?.trim() || 'Mi perfil';
  const iniciales = nombreMostrado.split(/\s+/).slice(0, 2).map((parte) => parte[0]).join('').toUpperCase();
  const hayCambios = nombres !== perfil.nombres || telefono !== (perfil.telefono || '');
  const nombreVacio = !nombres.trim();
  const rolLegible = NOMBRES_ROL[perfil.rol] || perfil.rol;

  async function guardar(evento) {
    evento.preventDefault();
    if (!hayCambios || guardando) return;
    setError('');
    if (nombreVacio) { setError('Escribe tu nombre para guardar los cambios.'); return; }
    setGuardando(true);
    try {
      const actualizado = await authService.actualizarPerfil(perfil.id_usuario, { nombres: nombres.trim(), telefono: telefono.trim() });
      setPerfil(actualizado);
      setNombres(actualizado.nombres || '');
      setTelefono(actualizado.telefono || '');
      avisar('Guardaste los cambios de tu perfil.');
    } catch (e) {
      setError(e.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="contenedor perfil-pagina">
      <div className="encabezado">
        <p className="etiqueta-seccion">Mi cuenta</p>
        <h1>Perfil</h1>
        <p>Consulta la información de tu cuenta y mantén tus datos de contacto al día.</p>
      </div>
      <div className="perfil-identidad tarjeta">
        <div className="perfil-avatar" aria-hidden="true">{iniciales}</div>
        <div className="perfil-identidad-texto">
          <p className="perfil-identidad-etiqueta">Cuenta MediCitas</p>
          <h2>{nombreMostrado}</h2>
          <p>{perfil.correo}</p>
        </div>
        <span className="perfil-rol">{rolLegible}</span>
      </div>

      <div className="perfil-grid">
        <form className="tarjeta perfil-panel" onSubmit={guardar}>
          <div className="perfil-panel-encabezado">
            <h2>Datos personales</h2>
            <p>Puedes actualizar cómo te identificas y tu número de contacto.</p>
          </div>
          <div className="formulario perfil-formulario">
            <label>Nombres
              <input value={nombres} onChange={(e) => { setNombres(e.target.value); setError(''); }}
                autoComplete="name" required maxLength={150} aria-invalid={nombreVacio}
                aria-describedby={nombreVacio ? 'perfil-nombre-error' : undefined} />
              {nombreVacio && <small id="perfil-nombre-error" className="perfil-campo-error">El nombre no puede quedar vacío.</small>}
            </label>
            <label>Teléfono <span className="perfil-opcional">Opcional</span>
              <input value={telefono} maxLength={30} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej. 956000111" autoComplete="tel" inputMode="tel" type="tel" />
            </label>
            <p className="perfil-ayuda">Puedes dejarlo vacío si no deseas añadir un número.</p>
          </div>
          {error && <p className="alerta alerta-error" role="alert">{error}</p>}
          <div className="perfil-acciones">
            <button className="boton" type="submit" disabled={!hayCambios || nombreVacio || guardando}>
              {guardando ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </form>

        <section className="tarjeta perfil-panel perfil-cuenta" aria-labelledby="perfil-cuenta-titulo">
          <div className="perfil-panel-encabezado">
            <h2 id="perfil-cuenta-titulo">Datos de la cuenta</h2>
            <p>Esta información identifica tu acceso a MediCitas.</p>
          </div>
          <dl className="perfil-detalles">
            <div>
              <dt>Correo electrónico</dt>
              <dd>{perfil.correo}</dd>
            </div>
            <div>
              <dt>Rol de la cuenta</dt>
              <dd><span className="perfil-rol perfil-rol-detalle">{rolLegible}</span></dd>
            </div>
          </dl>
          <p className="perfil-cuenta-nota">Estos datos no se modifican desde el perfil.</p>
        </section>
      </div>
    </div>
  );
}
