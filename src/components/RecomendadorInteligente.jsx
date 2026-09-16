// RecomendadorInteligente.jsx — Módulo de IA: Recomendación Inteligente de Citas ("Qué opción conviene recomendar")
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { aiService } from '../services/aiService';

export default function RecomendadorInteligente() {
  const [sintomasComunes, setSintomasComunes] = useState([]);
  const [conexionApi, setConexionApi] = useState({ status: 'verificando', model_loaded: false });
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);

  const [form, setForm] = useState({
    consulta_sintomas: 'Siento dolor opresivo en el pecho, fatiga al caminar y palpitaciones',
    especialidad_forzada: 'Todas',
    seguro_usuario: 'Particular',
    presupuesto_max: 200,
    modalidad_preferida: 'Cualquiera',
    prioridad: 'balanceado',
    lat_usuario: -14.0678,
    lon_usuario: -75.7286
  });

  useEffect(() => {
    async function init() {
      const conn = await aiService.verificarConexion();
      setConexionApi(conn);
      const sintomas = await aiService.obtenerSintomasComunes();
      setSintomasComunes(sintomas);
      ejecutarRecomendacion(form);
    }
    init();
  }, []);

  async function ejecutarRecomendacion(datos = form) {
    setCargando(true);
    try {
      const res = await aiService.recomendarCitas(datos);
      setResultado(res);
    } catch (err) {
      console.error('Error al generar recomendaciones:', err);
    } finally {
      setCargando(false);
    }
  }

  function handleChange(e) {
    const { name, value, type } = e.target;
    const nuevoForm = {
      ...form,
      [name]: type === 'number' ? Number(value) : value
    };
    setForm(nuevoForm);
    ejecutarRecomendacion(nuevoForm);
  }

  function seleccionarSintomaRapido(sintoma) {
    const nuevoForm = {
      ...form,
      consulta_sintomas: sintoma.texto,
      especialidad_forzada: 'Todas'
    };
    setForm(nuevoForm);
    ejecutarRecomendacion(nuevoForm);
  }

  return (
    <div className="contenedor">
      <header className="encabezado">
        <span className="etiqueta-seccion">Módulo de IA — Item 6: Recomendación Inteligente de Citas (★★★★★)</span>
        <h1>¿Qué opción de cita te conviene recomendar?</h1>
        <p>
          Sistema inteligente que evalúa <strong>síntomas clínicos en lenguaje natural</strong>,{' '}
          <strong>tarifas con seguro</strong>, <strong>distancia geográfica</strong> y <strong>reputación médica</strong>{' '}
          para determinar la opción más óptima y personalizada.
        </p>
      </header>

      {/* Estado del Modelo */}
      <div className="tarjeta" style={{ marginBottom: '22px', background: '#f6fbf9', borderColor: '#bfe0d3' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                display: 'inline-block',
                width: '12px',
                height: '12px',
                borderRadius: '50%',
                background: conexionApi?.status === 'online' ? '#0e7c66' : '#e2725b'
              }}
            />
            <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>
              Motor de Recomendación:{' '}
              <span style={{ color: conexionApi?.status === 'online' ? '#0e7c66' : '#e2725b' }}>
                {conexionApi?.status === 'online' ? 'FastAPI API (Online)' : 'Motor Local de Contingencia'}
              </span>
            </span>
          </div>

          <div style={{ display: 'flex', gap: '14px', fontSize: '0.82rem', color: 'var(--gris)' }}>
            <span><strong>Algoritmos:</strong> TF-IDF + Cosine Similarity + MCDA</span>
            <span><strong>Clustering:</strong> K-Means</span>
            <span><strong>Explicabilidad:</strong> XAI activa</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', alignItems: 'start' }}>
        {/* Formulario de Entrada y Filtros */}
        <div className="tarjeta">
          <h2 style={{ fontSize: '1.2rem', marginBottom: '14px', color: 'var(--tinta)' }}>
            1. Describe tus Síntomas o Necesidad
          </h2>

          <form onSubmit={(e) => { e.preventDefault(); ejecutarRecomendacion(); }} className="formulario" style={{ maxWidth: '100%' }}>
            <label>
              Motivo de consulta o síntomas (Lenguaje Natural)
              <textarea
                name="consulta_sintomas"
                rows="3"
                value={form.consulta_sintomas}
                onChange={handleChange}
                placeholder="Ejemplo: dolor de cabeza fuerte con visión borrosa y náuseas..."
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: '1px solid var(--borde)',
                  font: 'inherit',
                  resize: 'vertical'
                }}
              />
            </label>

            {/* Sugerencias Rápidas */}
            <div style={{ marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--gris)' }}>
                Sugerencias Rápidas de Pacientes:
              </span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
                {sintomasComunes.map((s, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => seleccionarSintomaRapido(s)}
                    className="hora-btn"
                    style={{
                      fontSize: '0.78rem',
                      padding: '5px 10px',
                      background: form.consulta_sintomas === s.texto ? 'var(--verde)' : '#fdfaf5',
                      color: form.consulta_sintomas === s.texto ? '#fff' : 'var(--tinta)'
                    }}
                  >
                    {s.etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                ¿Qué criterio priorizas?
                <select name="prioridad" value={form.prioridad} onChange={handleChange}>
                  <option value="balanceado">⚖️ Recomendación Balanceada</option>
                  <option value="calidad">⭐ Mejor Calificación (Estrellas)</option>
                  <option value="precio">💰 Mejor Tarifa / Ahorro</option>
                  <option value="cercania">📍 Mayor Cercanía a mi Ubicación</option>
                  <option value="rapidez">⚡ Disponibilidad Inmediata</option>
                </select>
              </label>

              <label>
                Seguro / Cobertura
                <select name="seguro_usuario" value={form.seguro_usuario} onChange={handleChange}>
                  <option value="Particular">Particular (Sin Seguro)</option>
                  <option value="Seguro Privado (EPS)">Seguro Privado (EPS)</option>
                  <option value="EsSalud / Básico">EsSalud</option>
                  <option value="Seguro Integral (SIS)">Seguro Integral (SIS)</option>
                </select>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <label>
                Presupuesto Máximo: S/. {form.presupuesto_max}
                <input
                  type="range"
                  name="presupuesto_max"
                  min="30"
                  max="250"
                  step="10"
                  value={form.presupuesto_max}
                  onChange={handleChange}
                />
              </label>

              <label>
                Filtrar Especialidad
                <select name="especialidad_forzada" value={form.especialidad_forzada} onChange={handleChange}>
                  <option value="Todas">Automática por IA</option>
                  <option value="Medicina General">Medicina General</option>
                  <option value="Pediatría">Pediatría</option>
                  <option value="Cardiología">Cardiología</option>
                  <option value="Dermatología">Dermatología</option>
                  <option value="Ginecología">Ginecología</option>
                  <option value="Traumatología">Traumatología</option>
                  <option value="Oftalmología">Oftalmología</option>
                  <option value="Odontología">Odontología</option>
                </select>
              </label>
            </div>
          </form>
        </div>

        {/* Diagnóstico y Recomendaciones */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {/* Banner de Diagnóstico IA */}
          <div className="tarjeta" style={{ borderLeft: '5px solid var(--verde)', background: 'var(--blanco)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--verde)', fontWeight: 700 }}>
                  Diagnóstico Preliminar por IA
                </span>
                <h3 style={{ fontSize: '1.4rem', marginTop: '4px', color: 'var(--tinta)' }}>
                  Especialidad Sugerida:{' '}
                  <span style={{ color: 'var(--verde-osc)' }}>
                    {cargando ? 'Analizando...' : resultado?.especialidad_sugerida || 'Medicina General'}
                  </span>
                </h3>
              </div>

              <span
                style={{
                  padding: '4px 12px',
                  borderRadius: '999px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  background: resultado?.urgencia_detectada === 'Alta' ? '#fdecec' : '#e7ecf5',
                  color: resultado?.urgencia_detectada === 'Alta' ? '#a13333' : '#2d4a7a'
                }}
              >
                Prioridad: {resultado?.urgencia_detectada || 'Baja'}
              </span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--gris)', marginTop: '8px' }}>
              Hemos clasificado {resultado?.total_opciones_evaluadas || 0} especialistas según su nivel de compatibilidad con tus síntomas.
            </p>
          </div>

          {/* Lista de Opciones Recomendadas */}
          <div style={{ display: 'grid', gap: '14px' }}>
            {cargando ? (
              <div className="tarjeta" style={{ textAlign: 'center', padding: '30px' }}>
                <p>Analizando compatibilidad y calculando las mejores opciones...</p>
              </div>
            ) : (
              resultado?.recomendaciones?.map((med, index) => (
                <div
                  key={med.id_medico}
                  className="tarjeta"
                  style={{
                    position: 'relative',
                    borderColor: index === 0 ? 'var(--verde)' : 'var(--borde)',
                    background: index === 0 ? '#fafdfc' : 'var(--blanco)',
                    boxShadow: index === 0 ? '0 4px 18px rgba(14, 124, 102, 0.12)' : 'var(--sombra)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            background: index === 0 ? 'var(--verde)' : 'var(--tinta)',
                            color: '#fff',
                            fontWeight: 800,
                            fontSize: '0.78rem',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          #{index + 1}
                        </span>
                        <h3 style={{ fontSize: '1.15rem', color: 'var(--tinta)' }}>{med.nombre}</h3>
                        <span className="chip-rol" style={{ background: 'var(--menta)', color: 'var(--verde-osc)' }}>
                          {med.especialidad}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.88rem', color: 'var(--gris)', marginTop: '4px' }}>
                        🏥 {med.clinica} — 📍 {med.direccion} ({med.distancia_km} km de ti)
                      </p>
                    </div>

                    {/* Match Score Badge */}
                    <div style={{ textAlign: 'right' }}>
                      <div
                        style={{
                          background: 'var(--menta)',
                          color: 'var(--verde-osc)',
                          fontWeight: 800,
                          fontSize: '1.2rem',
                          padding: '4px 12px',
                          borderRadius: '8px',
                          display: 'inline-block'
                        }}
                      >
                        {med.match_score}% Afinidad
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gris)', marginTop: '2px' }}>
                        Compatibilidad: {med.estrellas_compatibilidad} / 5.0 ★
                      </div>
                    </div>
                  </div>

                  {/* Insignias de la IA */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', margin: '10px 0' }}>
                    {med.insignias?.map((ins, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          padding: '3px 9px',
                          borderRadius: '999px',
                          background: ins.includes('🏆') ? '#fff4dc' : ins.includes('⭐') ? '#f3e8ff' : '#e6f4ea',
                          color: ins.includes('🏆') ? '#8a6410' : ins.includes('⭐') ? '#581c87' : '#137333'
                        }}
                      >
                        {ins}
                      </span>
                    ))}
                  </div>

                  {/* Explicabilidad (XAI): Por qué conviene */}
                  <div
                    style={{
                      background: '#f8faf9',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: 'var(--tinta)',
                      borderLeft: '3px solid var(--verde)',
                      marginBottom: '12px'
                    }}
                  >
                    <strong>💡 ¿Por qué conviene esta opción?:</strong> {med.por_que_conviene}
                  </div>

                  {/* Tarifas y Acción */}
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '10px',
                      borderTop: '1px solid var(--borde)',
                      paddingTop: '12px'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--gris)' }}>Tarifa Consulta: </span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--tinta)' }}>
                        S/. {med.tarifa_con_seguro_soles.toFixed(2)}
                      </strong>
                      {med.tarifa_con_seguro_soles < med.tarifa_base_soles && (
                        <span style={{ fontSize: '0.8rem', textDecoration: 'line-through', color: 'var(--gris)', marginLeft: '6px' }}>
                          S/. {med.tarifa_base_soles.toFixed(2)}
                        </span>
                      )}
                    </div>

                    <Link to={`/reservar/${med.id_medico}`} className="boton boton-mini" style={{ padding: '8px 16px' }}>
                      Reservar esta Cita
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
