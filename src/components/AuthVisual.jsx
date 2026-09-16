import { Link } from 'react-router-dom';
import doctor from '../assets/login-doctor.svg';

export default function AuthVisual({ titulo, descripcion }) {
  return (
    <aside className="login-visual">
      <div className="login-visual-contenido">
        <Link to="/" className="login-brand-badge">✦ Tu salud, más cerca</Link>
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
