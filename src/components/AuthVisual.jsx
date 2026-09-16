import { Link } from 'react-router-dom';
import doctor from '../assets/login-doctor.svg';
import AuthIcon from './AuthIcon';

export default function AuthVisual({ titulo, descripcion }) {
  return (
    <aside className="login-visual">
      <div className="login-visual-contenido">
        <div className="login-visual-nav">
          <Link to="/" className="login-volver-inicio" aria-label="Volver al inicio">
            <AuthIcon nombre="volver" size={19} />
          </Link>
          <span className="login-brand-badge">✦ Tu salud, más cerca</span>
        </div>
        <h1>{titulo}</h1>
        <p>{descripcion}</p>
        <div className="login-ilustracion" aria-hidden="true">
          <span className="login-circulo login-circulo-grande" />
          <span className="login-circulo login-circulo-pequeno" />
          <span className="login-anillo login-anillo-uno" />
          <span className="login-anillo login-anillo-dos" />
          <img src={doctor} alt="" />
          <span className="login-flotante login-flotante-cita"><b>✓</b> Cita confirmada</span>
          <span className="login-flotante login-flotante-atencion"><b>♡</b> Atención personalizada</span>
        </div>
      </div>
    </aside>
  );
}
