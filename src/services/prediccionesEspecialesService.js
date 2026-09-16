// src/services/prediccionesEspecialesService.js

import enfModel from '../../ml/modelos/PrediccionCitasxEspecialidad/Especialidades/enf.json';
import occupationalTherapyModel from '../../ml/modelos/PrediccionCitasxEspecialidad/Especialidades/occupational_therapy.json';
import physiotherapyModel from '../../ml/modelos/PrediccionCitasxEspecialidad/Especialidades/physiotherapy.json';
import psychotherapyModel from '../../ml/modelos/PrediccionCitasxEspecialidad/Especialidades/psychotherapy.json';
import speechTherapyModel from '../../ml/modelos/PrediccionCitasxEspecialidad/Especialidades/speech_therapy.json';

const HORIZONTE_PREDETERMINADO = 14;

// ======================================================
// MODELOS
// ======================================================

const modelos = {
  enf: {
    id: 'enf',
    nombre: 'Enfermería',
    modelo: enfModel,
  },

  occupational_therapy: {
    id: 'occupational_therapy',
    nombre: 'Terapia ocupacional',
    modelo: occupationalTherapyModel,
  },

  physiotherapy: {
    id: 'physiotherapy',
    nombre: 'Fisioterapia',
    modelo: physiotherapyModel,
  },

  psychotherapy: {
    id: 'psychotherapy',
    nombre: 'Psicoterapia',
    modelo: psychotherapyModel,
  },

  speech_therapy: {
    id: 'speech_therapy',
    nombre: 'Terapia de lenguaje',
    modelo: speechTherapyModel,
  },
};

// ======================================================
// OBTENER MODELO
// ======================================================

function obtenerModelo(especialidad) {
  const modelo = modelos[especialidad];

  if (!modelo) {
    throw new Error(
      `No existe un modelo para la especialidad: ${especialidad}`
    );
  }

  return modelo;
}

// ======================================================
// FECHA
// ======================================================

function normalizarFecha(fechaInput = new Date()) {
  const fecha = new Date(fechaInput);

  if (Number.isNaN(fecha.getTime())) {
    throw new Error('La fecha proporcionada no es válida.');
  }

  fecha.setHours(0, 0, 0, 0);

  return fecha;
}

function formatearFecha(fechaInput) {
  const fecha = normalizarFecha(fechaInput);

  const year = fecha.getFullYear();

  const month = String(
    fecha.getMonth() + 1
  ).padStart(2, '0');

  const day = String(
    fecha.getDate()
  ).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// ======================================================
// SEMANA ISO
// ======================================================

function obtenerSemanaISO(fechaInput) {
  const fecha = normalizarFecha(fechaInput);

  const date = new Date(
    Date.UTC(
      fecha.getFullYear(),
      fecha.getMonth(),
      fecha.getDate()
    )
  );

  const dia = date.getUTCDay() || 7;

  date.setUTCDate(
    date.getUTCDate() + 4 - dia
  );

  const inicioAnio = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      0,
      1
    )
  );

  return Math.ceil(
    (
      (
        date - inicioAnio
      ) / 86400000 + 1
    ) / 7
  );
}

// ======================================================
// FEATURES
// ======================================================

function construirFeatures(fechaInput = new Date()) {
  const fecha = normalizarFecha(fechaInput);

  const year = fecha.getFullYear();

  const month =
    fecha.getMonth() + 1;

  const dayofmonth =
    fecha.getDate();

  // pandas .dt.dayofweek
  // lunes = 0 ... domingo = 6
  const dayofweek =
    (fecha.getDay() + 6) % 7;

  // Día del año
  const inicioAnio =
    new Date(year, 0, 1);

  const diferenciaDias =
    Math.floor(
      (fecha - inicioAnio) / 86400000
    );

  const dayofyear =
    diferenciaDias + 1;

  // Trimestre
  const quarter =
    Math.floor(
      (month - 1) / 3
    ) + 1;

  // Semana ISO
  const weekofyear =
    obtenerSemanaISO(fecha);

  return {
    dayofyear,
    dayofweek,
    quarter,
    month,
    year,
    dayofmonth,
    weekofyear,
  };
}

// ======================================================
// VECTOR
// ======================================================

function obtenerVectorFeatures(fecha) {
  const features =
    construirFeatures(fecha);

  return [
    features.dayofyear,
    features.dayofweek,
    features.quarter,
    features.month,
    features.year,
    features.dayofmonth,
    features.weekofyear,
  ];
}

// ======================================================
// FEATURES DEL MODELO
// ======================================================

function obtenerNombresFeatures(especialidad) {
  const item =
    obtenerModelo(especialidad);

  return (
    item.modelo?.learner?.feature_names ||
    [
      'dayofyear',
      'dayofweek',
      'quarter',
      'month',
      'year',
      'dayofmonth',
      'weekofyear',
    ]
  );
}

// ======================================================
// UTILIDADES XGBOOST
// ======================================================

function obtenerModeloArboles(modelo) {
  const model =
    modelo?.learner?.gradient_booster?.model;

  if (!model) {
    throw new Error(
      'No se encontró la estructura de árboles del modelo XGBoost.'
    );
  }

  if (!Array.isArray(model.trees)) {
    throw new Error(
      'El modelo XGBoost no contiene árboles.'
    );
  }

  return model;
}

function obtenerBaseScore(modelo) {
  const learnerModelParam =
    modelo?.learner?.learner_model_param;

  if (!learnerModelParam) {
    return 0;
  }

  let baseScore =
    learnerModelParam.base_score;

  if (baseScore == null) {
    return 0;
  }

  // Algunas versiones guardan el valor como string.
  if (typeof baseScore === 'string') {
    try {
      const parseado =
        JSON.parse(baseScore);

      if (Array.isArray(parseado)) {
        baseScore = parseado[0];
      } else {
        baseScore = parseado;
      }
    } catch {
      // Puede venir como "[5E-1]" u otro formato.
      const encontrado =
        baseScore.match(
          /[-+]?(?:\d*\.\d+|\d+\.?)(?:[eE][-+]?\d+)?/
        );

      baseScore =
        encontrado
          ? Number(encontrado[0])
          : 0;
    }
  }

  if (Array.isArray(baseScore)) {
    baseScore =
      Number(baseScore[0]);
  }

  const numero =
    Number(baseScore);

  return Number.isFinite(numero)
    ? numero
    : 0;
}

// ======================================================
// OBTENER VALOR DE HOJA
// ======================================================

function obtenerValorHoja(
  arbol,
  indice
) {
  const valores =
    arbol.base_weights ||
    arbol.leaf ||
    arbol.leaf_values;

  if (
    Array.isArray(valores) &&
    valores[indice] != null
  ) {
    return Number(
      valores[indice]
    );
  }

  /*
   * En los JSON actuales de XGBoost,
   * split_conditions contiene también
   * el valor de la hoja.
   */
  if (
    Array.isArray(arbol.split_conditions) &&
    arbol.split_conditions[indice] != null
  ) {
    return Number(
      arbol.split_conditions[indice]
    );
  }

  throw new Error(
    `No se encontró el valor de la hoja ${indice}.`
  );
}

// ======================================================
// RECORRER UN ÁRBOL
// ======================================================

function predecirArbol(
  arbol,
  vector
) {
  const leftChildren =
    arbol.left_children;

  const rightChildren =
    arbol.right_children;

  const splitIndices =
    arbol.split_indices;

  const splitConditions =
    arbol.split_conditions;

  if (
    !Array.isArray(leftChildren) ||
    !Array.isArray(rightChildren) ||
    !Array.isArray(splitIndices) ||
    !Array.isArray(splitConditions)
  ) {
    throw new Error(
      'El árbol XGBoost no tiene la estructura esperada.'
    );
  }

  let nodo = 0;

  while (true) {
    const izquierdo =
      Number(leftChildren[nodo]);

    const derecho =
      Number(rightChildren[nodo]);

    // Nodo hoja
    if (
      izquierdo < 0 &&
      derecho < 0
    ) {
      return obtenerValorHoja(
        arbol,
        nodo
      );
    }

    const indiceFeature =
      Number(splitIndices[nodo]);

    const umbral =
      Number(splitConditions[nodo]);

    if (
      !Number.isInteger(indiceFeature) ||
      indiceFeature < 0 ||
      indiceFeature >= vector.length
    ) {
      throw new Error(
        `Índice de feature inválido: ${indiceFeature}.`
      );
    }

    const valor =
      Number(vector[indiceFeature]);

    /*
     * XGBoost utiliza el hijo izquierdo
     * cuando la condición del split se cumple.
     *
     * Para variables numéricas:
     *
     * valor < umbral
     */

    if (
      Number.isNaN(valor)
    ) {
      const defaultLeft =
        Array.isArray(arbol.default_left)
          ? Number(
              arbol.default_left[nodo]
            )
          : 1;

      nodo =
        defaultLeft
          ? izquierdo
          : derecho;
    } else if (
      valor < umbral
    ) {
      nodo = izquierdo;
    } else {
      nodo = derecho;
    }

    if (nodo < 0) {
      throw new Error(
        'El árbol contiene una referencia de nodo inválida.'
      );
    }
  }
}

// ======================================================
// EJECUTAR MODELO XGBOOST
// ======================================================

function ejecutarModelo(
  especialidad,
  fecha
) {
  const item =
    obtenerModelo(especialidad);

  const modelo =
    item.modelo;

  const vector =
    obtenerVectorFeatures(fecha);

  try {
    const estructura =
      obtenerModeloArboles(modelo);

    const arboles =
      estructura.trees;

    if (arboles.length === 0) {
      throw new Error(
        'El modelo no contiene árboles.'
      );
    }

    /*
     * Predicción inicial.
     */
    let prediccion =
      obtenerBaseScore(modelo);

    /*
     * XGBoost gbtree:
     *
     * predicción =
     * base_score + suma de los árboles
     *
     * Los valores de hoja ya forman parte
     * del modelo serializado.
     */
    for (const arbol of arboles) {
      prediccion +=
        predecirArbol(
          arbol,
          vector
        );
    }

    /*
     * Para reg:squarederror la salida
     * es directamente una regresión.
     */
    const objective =
      modelo?.learner?.objective?.name ||
      modelo?.learner?.objective?.name;

    if (
      objective &&
      objective !== 'reg:squarederror'
    ) {
      console.warn(
        `Objetivo XGBoost detectado: ${objective}`
      );
    }

    if (!Number.isFinite(prediccion)) {
      throw new Error(
        'El modelo devolvió una predicción no válida.'
      );
    }

    /*
     * Una cantidad de citas no puede ser negativa.
     */
    return Math.max(
      0,
      prediccion
    );
  } catch (error) {
    console.error(
      `Error ejecutando modelo ${especialidad}:`,
      error
    );

    throw new Error(
      `No se pudo calcular la predicción de ${item.nombre}: ${error.message}`
    );
  }
}

// ======================================================
// NIVEL DE DEMANDA
// ======================================================

function obtenerNivelDemanda(citas) {
  const valor =
    Number(citas);

  if (!Number.isFinite(valor)) {
    return 'sin-datos';
  }

  if (valor >= 30) {
    return 'alta';
  }

  if (valor >= 15) {
    return 'media';
  }

  return 'baja';
}

// ======================================================
// PREDICCIÓN DE UNA ESPECIALIDAD
// ======================================================

function predecirEspecialidad(
  especialidad,
  fecha
) {
  const item =
    obtenerModelo(especialidad);

  const fechaNormalizada =
    normalizarFecha(fecha);

  const features =
    construirFeatures(
      fechaNormalizada
    );

  const citasPredichas =
    ejecutarModelo(
      especialidad,
      fechaNormalizada
    );

  return {
    id_especialidad:
      item.id,

    especialidad:
      item.nombre,

    fecha:
      formatearFecha(
        fechaNormalizada
      ),

    dayofyear:
      features.dayofyear,

    dayofweek:
      features.dayofweek,

    quarter:
      features.quarter,

    month:
      features.month,

    year:
      features.year,

    dayofmonth:
      features.dayofmonth,

    weekofyear:
      features.weekofyear,

    citas_predichas:
      citasPredichas,

    nivel_demanda:
      obtenerNivelDemanda(
        citasPredichas
      ),
  };
}

// ======================================================
// TODAS LAS ESPECIALIDADES PARA UNA FECHA
// ======================================================

function prepararPrediccionesTodas(
  fechaInput = new Date()
) {
  const fecha =
    normalizarFecha(fechaInput);

  return Object.keys(modelos).map(
    (especialidad) =>
      predecirEspecialidad(
        especialidad,
        fecha
      )
  );
}

// ======================================================
// PRÓXIMOS DÍAS
// ======================================================

function predecirProximosDias(
  dias = HORIZONTE_PREDETERMINADO,
  fechaInicial = new Date()
) {
  const cantidad =
    Number(dias);

  if (
    !Number.isInteger(cantidad) ||
    cantidad <= 0
  ) {
    throw new Error(
      'La cantidad de días debe ser un entero positivo.'
    );
  }

  const inicio =
    normalizarFecha(
      fechaInicial
    );

  const resultados = [];

  for (
    let i = 0;
    i < cantidad;
    i++
  ) {
    const fecha =
      new Date(inicio);

    fecha.setDate(
      fecha.getDate() + i
    );

    const predicciones =
      prepararPrediccionesTodas(
        fecha
      );

    resultados.push(
      ...predicciones
    );
  }

  return resultados;
}

// ======================================================
// LISTAR MODELOS
// ======================================================

function listarModelos() {
  return Object.values(modelos).map(
    (item) => ({
      id: item.id,

      nombre: item.nombre,

      features:
        obtenerNombresFeatures(
          item.id
        ),

      disponible:
        Boolean(item.modelo),
    })
  );
}

// ======================================================
// OBTENER MODELO JSON
// ======================================================

function obtenerModeloJSON(
  especialidad
) {
  return obtenerModelo(
    especialidad
  ).modelo;
}

// ======================================================
// PREDICCIÓN INDIVIDUAL
// ======================================================

function prepararPrediccion(
  especialidad,
  fecha = new Date()
) {
  return predecirEspecialidad(
    especialidad,
    fecha
  );
}

// ======================================================
// FORMATEAR PREDICCIÓN
// ======================================================

function formatearPrediccion(
  especialidad,
  demanda,
  fecha = new Date()
) {
  const item =
    obtenerModelo(
      especialidad
    );

  const valor =
    Number(demanda);

  if (!Number.isFinite(valor)) {
    throw new Error(
      `La predicción para ${item.nombre} no es válida.`
    );
  }

  return {
    id_especialidad:
      item.id,

    especialidad:
      item.nombre,

    fecha:
      formatearFecha(fecha),

    citas_predichas:
      Math.max(
        0,
        valor
      ),

    nivel_demanda:
      obtenerNivelDemanda(
        valor
      ),
  };
}

// ======================================================
// EXPORTACIONES
// ======================================================

export const prediccionesEspecialidadesService = {
  listarModelos,

  obtenerModelo,

  obtenerModeloJSON,

  construirFeatures,

  obtenerVectorFeatures,

  obtenerNombresFeatures,

  prepararPrediccion,

  prepararPrediccionesTodas,

  predecirProximosDias,

  ejecutarModelo,

  obtenerNivelDemanda,

  formatearPrediccion,
};

export {
  HORIZONTE_PREDETERMINADO,
};
