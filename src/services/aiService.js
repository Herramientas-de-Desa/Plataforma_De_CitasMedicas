// aiService.js — Servicio de Inteligencia Artificial: Recomendación Inteligente de Citas Médicas
const AI_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000';

export const aiService = {
  /**
   * Verifica la conectividad con el microservicio FastAPI
   */
  async verificarConexion() {
    try {
      const res = await fetch(`${AI_API_URL}/api/health`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Backend desconectado
    }
    return { status: 'offline', model_loaded: false };
  },

  /**
   * Obtiene la lista de síntomas comunes para sugerencias rápidas
   */
  async obtenerSintomasComunes() {
    try {
      const res = await fetch(`${AI_API_URL}/api/recommend/sintomas-comunes`);
      if (res.ok) {
        return await res.json();
      }
    } catch {
      // Usar fallback
    }

    return [
      { etiqueta: '❤️ Dolor de pecho o palpitaciones', texto: 'dolor en el pecho fatiga palpitaciones presion alta', esp: 'Cardiología' },
      { etiqueta: '🔬 Manchas rojas, acné o picazón', texto: 'erupcion cutanea picazon manchas rojas acne severo', esp: 'Dermatología' },
      { etiqueta: '👶 Fiebre, tos o malestar en niño', texto: 'fiebre alta tos vomitos resfriado en niño', esp: 'Pediatría' },
      { etiqueta: '🦴 Dolor articular, rodilla o lesión', texto: 'dolor en rodilla fractura esguince tobillo columna', esp: 'Traumatología' },
      { etiqueta: '👁️ Visión borrosa o ardor ocular', texto: 'vision borrosa ojo seco enrojecimiento ocular', esp: 'Oftalmología' },
      { etiqueta: '🦷 Dolor de muela o encías', texto: 'dolor de muela caries encia inflamada extraccion', esp: 'Odontología' },
      { etiqueta: '🌸 Control prenatal o ginecológico', texto: 'control ginecologico papanicolaou retraso colicos', esp: 'Ginecología' },
      { etiqueta: '🩺 Chequeo general o dolor estomacal', texto: 'chequeo general malestar estomago gastritis dolor de cabeza', esp: 'Medicina General' }
    ];
  },

  /**
   * Motor de Recomendación: Envía criterios y devuelve las mejores opciones de citas ordenadas por conveniencia
   */
  async recomendarCitas(parametros) {
    try {
      const res = await fetch(`${AI_API_URL}/api/recommend/citas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parametros),
      });

      if (res.ok) {
        const data = await res.json();
        return { ...data, fuente: 'FastAPI (Inferencia en Vivo)' };
      }
    } catch (err) {
      console.warn('API de IA no disponible, ejecutando motor recomendador local.', err);
    }

    // Fallback de contingencia local
    return motorRecomendadorLocal(parametros);
  }
};

/**
 * Motor de inferencia local de contingencia
 */
function motorRecomendadorLocal(params) {
  const medicosData = [
    {
      id_medico: 1,
      nombre: 'Dr. Carlos Ramos Peña',
      especialidad: 'Medicina General',
      clinica: 'Clínica Santa Rosa de Ica',
      direccion: 'Av. San Martín 350, Ica',
      telefono: '956111222',
      latitud: -14.0678,
      longitud: -75.7286,
      tarifa_base_soles: 50,
      calificacion_estrellas: 4.8,
      total_resenas: 124,
      experiencia_anos: 14,
      tiempo_espera_promedio_min: 15,
      modalidad: 'Presencial y Telemedicina',
      disponibilidad_inmediata: true,
      seguros_aceptados: 'Particular, SIS, EsSalud, EPS',
      descripcion_experiencia: 'Médico internista con amplia experiencia en diagnóstico preventivo, chequeos médicos, hipertensión y medicina familiar.'
    },
    {
      id_medico: 2,
      nombre: 'Dra. María Torres Gala',
      especialidad: 'Pediatría',
      clinica: 'Clínica Santa Rosa de Ica',
      direccion: 'Av. San Martín 350, Ica',
      telefono: '956333444',
      latitud: -14.0678,
      longitud: -75.7286,
      tarifa_base_soles: 65,
      calificacion_estrellas: 4.9,
      total_resenas: 180,
      experiencia_anos: 11,
      tiempo_espera_promedio_min: 12,
      modalidad: 'Presencial',
      disponibilidad_inmediata: true,
      seguros_aceptados: 'Particular, EPS, EsSalud',
      descripcion_experiencia: 'Especialista en pediatría integral, control del crecimiento y desarrollo del infante, nutrición y vacunación pediátrica.'
    },
    {
      id_medico: 3,
      nombre: 'Dr. Jorge Salas Quispe',
      especialidad: 'Cardiología',
      clinica: 'Centro Médico El Carmen',
      direccion: 'Calle Lima 145, Ica',
      telefono: '956555666',
      latitud: -14.0640,
      longitud: -75.7301,
      tarifa_base_soles: 120,
      calificacion_estrellas: 4.9,
      total_resenas: 210,
      experiencia_anos: 18,
      tiempo_espera_promedio_min: 20,
      modalidad: 'Presencial',
      disponibilidad_inmediata: false,
      seguros_aceptados: 'Particular, EPS',
      descripcion_experiencia: 'Cardiólogo clínico especialista en hipertensión refractaria, arritmias cardíacas, riesgo quirúrgico y ecocardiogramas.'
    },
    {
      id_medico: 4,
      nombre: 'Dra. Ana Lucía Herrera',
      especialidad: 'Dermatología',
      clinica: 'Centro Médico El Carmen',
      direccion: 'Calle Lima 145, Ica',
      telefono: '956777888',
      latitud: -14.0640,
      longitud: -75.7301,
      tarifa_base_soles: 90,
      calificacion_estrellas: 4.7,
      total_resenas: 98,
      experiencia_anos: 9,
      tiempo_espera_promedio_min: 18,
      modalidad: 'Presencial y Telemedicina',
      disponibilidad_inmediata: true,
      seguros_aceptados: 'Particular, EPS',
      descripcion_experiencia: 'Dermatóloga estética y clínica experta en acné, manchas de la piel, dermatitis, psoriasis y rejuvenecimiento facial.'
    },
    {
      id_medico: 5,
      nombre: 'Dr. Pedro Anicama Ríos',
      especialidad: 'Ginecología',
      clinica: 'Policlínico La Angostura',
      direccion: 'Av. Los Maestros 890, Ica',
      telefono: '956999000',
      latitud: -14.0755,
      longitud: -75.7350,
      tarifa_base_soles: 85,
      calificacion_estrellas: 4.8,
      total_resenas: 145,
      experiencia_anos: 16,
      tiempo_espera_promedio_min: 15,
      modalidad: 'Presencial',
      disponibilidad_inmediata: true,
      seguros_aceptados: 'Particular, SIS, EsSalud, EPS',
      descripcion_experiencia: 'Ginecólogo obstetra con amplia trayectoria en control prenatal, ecografías 4D, salud reproductiva y papanicolaou.'
    },
    {
      id_medico: 6,
      nombre: 'Dra. Rosa Uchuya Flores',
      especialidad: 'Traumatología',
      clinica: 'Policlínico La Angostura',
      direccion: 'Av. Los Maestros 890, Ica',
      telefono: '955123456',
      latitud: -14.0755,
      longitud: -75.7350,
      tarifa_base_soles: 95,
      calificacion_estrellas: 4.6,
      total_resenas: 87,
      experiencia_anos: 12,
      tiempo_espera_promedio_min: 22,
      modalidad: 'Presencial',
      disponibilidad_inmediata: false,
      seguros_aceptados: 'Particular, EsSalud, EPS',
      descripcion_experiencia: 'Traumatóloga y ortopedista especialista en lesiones deportivas, fracturas, dolores articulares, artroscopia y columna.'
    },
    {
      id_medico: 7,
      nombre: 'Dr. Luis Cabrera Munayco',
      especialidad: 'Oftalmología',
      clinica: 'Clínica San José',
      direccion: 'Av. Cutervo 512, Ica',
      telefono: '955654321',
      latitud: -14.0621,
      longitud: -75.7259,
      tarifa_base_soles: 80,
      calificacion_estrellas: 4.7,
      total_resenas: 112,
      experiencia_anos: 13,
      tiempo_espera_promedio_min: 15,
      modalidad: 'Presencial',
      disponibilidad_inmediata: true,
      seguros_aceptados: 'Particular, SIS, EPS',
      descripcion_experiencia: 'Oftalmólogo especialista en problemas refractivos (miopía, astigmatismo), fondo de ojo, cataratas y salud visual preventiva.'
    },
    {
      id_medico: 8,
      nombre: 'Dra. Karla Espino Donayre',
      especialidad: 'Medicina General',
      clinica: 'Clínica San José',
      direccion: 'Av. Cutervo 512, Ica',
      telefono: '955987654',
      latitud: -14.0621,
      longitud: -75.7259,
      tarifa_base_soles: 45,
      calificacion_estrellas: 4.6,
      total_resenas: 76,
      experiencia_anos: 8,
      tiempo_espera_promedio_min: 10,
      modalidad: 'Presencial y Telemedicina',
      disponibilidad_inmediata: true,
      seguros_aceptados: 'Particular, SIS, EsSalud',
      descripcion_experiencia: 'Médico cirujano general enfocado en atención primaria rápida, certificados de salud, gastritis y enfermedades respiratorias agudas.'
    },
    {
      id_medico: 9,
      nombre: 'Dr. Roberto Mendoza Silva',
      especialidad: 'Odontología',
      clinica: 'Centro Médico El Carmen',
      direccion: 'Calle Lima 145, Ica',
      telefono: '956444555',
      latitud: -14.0640,
      longitud: -75.7301,
      tarifa_base_soles: 70,
      calificacion_estrellas: 4.8,
      total_resenas: 92,
      experiencia_anos: 10,
      tiempo_espera_promedio_min: 15,
      modalidad: 'Presencial',
      disponibilidad_inmediata: true,
      seguros_aceptados: 'Particular, EPS',
      descripcion_experiencia: 'Cirujano dentista especialista en estética dental, profilaxis, endodoncia, ortodoncia y extracciones complejas.'
    },
    {
      id_medico: 10,
      nombre: 'Dra. Claudia Benavides Prado',
      especialidad: 'Cardiología',
      clinica: 'Clínica Santa Rosa de Ica',
      direccion: 'Av. San Martín 350, Ica',
      telefono: '956888999',
      latitud: -14.0678,
      longitud: -75.7286,
      tarifa_base_soles: 110,
      calificacion_estrellas: 4.8,
      total_resenas: 135,
      experiencia_anos: 15,
      tiempo_espera_promedio_min: 20,
      modalidad: 'Presencial y Telemedicina',
      disponibilidad_inmediata: true,
      seguros_aceptados: 'Particular, SIS, EPS',
      descripcion_experiencia: 'Cardióloga preventiva especialista en rehabilitación cardíaca, chequeos de salud coronaria y monitoreo Holter.'
    }
  ];

  // Clasificar especialidad según palabras clave
  const texto = (params.consulta_sintomas || '').toLowerCase();
  let espSugerida = 'Medicina General';
  let urgencia = 'Baja';

  if (texto.includes('pecho') || texto.includes('corazon') || texto.includes('presion') || texto.includes('arritmia') || texto.includes('palpitacion')) {
    espSugerida = 'Cardiología';
    urgencia = 'Alta';
  } else if (texto.includes('piel') || texto.includes('mancha') || texto.includes('acne') || texto.includes('grano') || texto.includes('picazon') || texto.includes('roncha')) {
    espSugerida = 'Dermatología';
    urgencia = 'Baja';
  } else if (texto.includes('niño') || texto.includes('bebe') || texto.includes('hijo') || texto.includes('lactante') || texto.includes('pediatra')) {
    espSugerida = 'Pediatría';
    urgencia = 'Media';
  } else if (texto.includes('embarazo') || texto.includes('menstrua') || texto.includes('ginec') || texto.includes('ovario') || texto.includes('prenatal') || texto.includes('flujo')) {
    espSugerida = 'Ginecología';
    urgencia = 'Media';
  } else if (texto.includes('rodilla') || texto.includes('fractura') || texto.includes('hueso') || texto.includes('tobillo') || texto.includes('espalda') || texto.includes('lumbar') || texto.includes('esguince')) {
    espSugerida = 'Traumatología';
    urgencia = 'Media';
  } else if (texto.includes('ojo') || texto.includes('vision') || texto.includes('vista') || texto.includes('borros') || texto.includes('lente')) {
    espSugerida = 'Oftalmología';
    urgencia = 'Media';
  } else if (texto.includes('muela') || texto.includes('diente') || texto.includes('encia') || texto.includes('carie') || texto.includes('odontolog')) {
    espSugerida = 'Odontología';
    urgencia = 'Media';
  }

  if (params.especialidad_forzada && params.especialidad_forzada !== 'Todas') {
    espSugerida = params.especialidad_forzada;
  }

  const candidatos = medicosData.map((m) => {
    const dlat = (m.latitud - (params.lat_usuario || -14.0678)) * 111;
    const dlon = (m.longitud - (params.lon_usuario || -75.7286)) * 111;
    const distancia_km = Number(Math.sqrt(dlat * dlat + dlon * dlon).toFixed(2));

    const esMismaEsp = m.especialidad.toLowerCase() === espSugerida.toLowerCase();
    const subscoreAfinidad = esMismaEsp ? 1.0 : 0.25;
    const subscoreCalidad = (m.calificacion_estrellas - 3.0) / 2.0;

    let tarifaEfectiva = m.tarifa_base_soles;
    const aceptaSeguro = m.seguros_aceptados.toLowerCase().includes((params.seguro_usuario || 'particular').toLowerCase());
    if (aceptaSeguro && params.seguro_usuario !== 'Particular') {
      if (params.seguro_usuario.includes('EPS')) tarifaEfectiva *= 0.3;
      else if (params.seguro_usuario.includes('EsSalud')) tarifaEfectiva *= 0.15;
      else if (params.seguro_usuario.includes('SIS')) tarifaEfectiva *= 0.05;
    }
    tarifaEfectiva = Number(tarifaEfectiva.toFixed(2));

    const subscorePrecio = Math.max(0, 1.0 - (tarifaEfectiva / (params.presupuesto_max || 150)));
    const subscoreDist = Math.max(0, 1.0 - (distancia_km / 8.0));
    const subscoreTiempo = (m.disponibilidad_inmediata ? 1.0 : 0.5) - (m.tiempo_espera_promedio_min / 60) * 0.3;

    const scoreGlobal = (subscoreAfinidad * 0.35) + (subscoreCalidad * 0.25) + (subscorePrecio * 0.15) + (subscoreDist * 0.15) + (subscoreTiempo * 0.10);
    const matchScore = Math.min(99, Math.max(48, Math.round(scoreGlobal * 100)));

    const insignias = [];
    const razones = [];
    if (esMismaEsp) razones.push(`Especialista idóneo en ${m.especialidad}`);
    if (m.calificacion_estrellas >= 4.8) {
      insignias.push('⭐ Excelente Calificación');
      razones.push(`${m.calificacion_estrellas}★ (${m.total_resenas} opiniones)`);
    }
    if (m.disponibilidad_inmediata) {
      insignias.push('⚡ Cita Inmediata');
      razones.push('Turnos libres hoy');
    }
    if (distancia_km <= 1.5) {
      insignias.push(`📍 Muy Cerca (${distancia_km} km)`);
      razones.push(`A solo ${distancia_km} km`);
    }
    if (aceptaSeguro && params.seguro_usuario !== 'Particular') {
      insignias.push('🛡️ Acepta tu seguro');
      razones.push(`Copago: S/. ${tarifaEfectiva.toFixed(2)}`);
    } else if (tarifaEfectiva <= 50) {
      insignias.push('💰 Tarifa Económica');
      razones.push(`Tarifa: S/. ${tarifaEfectiva.toFixed(2)}`);
    }

    return {
      id_medico: m.id_medico,
      nombre: m.nombre,
      especialidad: m.especialidad,
      clinica: m.clinica,
      direccion: m.direccion,
      telefono: m.telefono,
      distancia_km,
      tarifa_base_soles: m.tarifa_base_soles,
      tarifa_con_seguro_soles: tarifaEfectiva,
      calificacion_estrellas: m.calificacion_estrellas,
      total_resenas: m.total_resenas,
      experiencia_anos: m.experiencia_anos,
      tiempo_espera_promedio_min: m.tiempo_espera_promedio_min,
      modalidad: m.modalidad,
      disponibilidad_inmediata: m.disponibilidad_inmediata,
      seguros_aceptados: m.seguros_aceptados,
      descripcion_experiencia: m.descripcion_experiencia,
      match_score: matchScore,
      estrellas_compatibilidad: Number((scoreGlobal * 5).toFixed(1)),
      insignias: insignias.slice(0, 3),
      por_que_conviene: razones.slice(0, 3).join(' • '),
      score_global_raw: scoreGlobal
    };
  });

  candidatos.sort((a, b) => b.score_global_raw - a.score_global_raw);
  if (candidatos.length > 0) {
    candidatos[0].insignias.unshift('🏆 Opción Más Recomendada');
  }

  return {
    especialidad_sugerida: espSugerida,
    urgencia_detectada: urgencia,
    criterio_priorizado: params.prioridad || 'balanceado',
    total_opciones_evaluadas: candidatos.length,
    recomendaciones: candidatos.slice(0, params.top_k || 6),
    fuente: 'Motor de Inferencia Local'
  };
}
