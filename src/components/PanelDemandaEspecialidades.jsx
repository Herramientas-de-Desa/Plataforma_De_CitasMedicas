// src/components/PanelDemandaEspecialidades.jsx

import { useEffect, useMemo, useState } from 'react';
import {
  prediccionesEspecialidadesService,
} from '../services/prediccionesEspecialesService';

const DIAS_POR_VISTA = {
  dia: 14,
  semana: 56,
  mes: 180,
};

const NOMBRES_DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

function crearFecha(fecha) {
  if (!fecha) return null;

  const date = new Date(`${fecha}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

function formatearFecha(fecha) {
  const date = crearFecha(fecha);

  if (!date) return '—';

  return date.toLocaleDateString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function obtenerDiaSemana(fecha) {
  const date = crearFecha(fecha);

  if (!date) return '—';

  return NOMBRES_DIAS[date.getDay()];
}

function obtenerNumeroSemana(fecha) {
  const date = crearFecha(fecha);

  if (!date) return null;

  const utcDate = new Date(
    Date.UTC(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    )
  );

  const dia = utcDate.getUTCDay() || 7;

  utcDate.setUTCDate(
    utcDate.getUTCDate() + 4 - dia
  );

  const inicioAnio = new Date(
    Date.UTC(
      utcDate.getUTCFullYear(),
      0,
      1
    )
  );

  return Math.ceil(
    (
      (
        (utcDate - inicioAnio) / 86400000
      ) + 1
    ) / 7
  );
}

function obtenerClaveSemana(fecha) {
  const date = crearFecha(fecha);

  if (!date) return '';

  const semana = obtenerNumeroSemana(fecha);

  return `${date.getFullYear()}-S${String(semana).padStart(2, '0')}`;
}

function obtenerEtiquetaSemana(fecha) {
  const semana = obtenerNumeroSemana(fecha);

  if (!semana) return '—';

  return `Semana ${semana}`;
}

function obtenerClaveMes(fecha) {
  const date = crearFecha(fecha);

  if (!date) return '';

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, '0')}`;
}

function obtenerEtiquetaMes(fecha) {
  const date = crearFecha(fecha);

  if (!date) return '—';

  const texto = date.toLocaleDateString('es-PE', {
    month: 'long',
    year: 'numeric',
  });

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function redondear(valor) {
  return Number(valor || 0).toFixed(0);
}

export default function PanelDemandaEspecialidades() {
  const [vista, setVista] = useState('dia');

  const [dias, setDias] = useState(
    DIAS_POR_VISTA.dia
  );

  const [predicciones, setPredicciones] =
    useState([]);

  const [cargando, setCargando] =
    useState(true);

  const [error, setError] =
    useState('');

  const [
    especialidadSeleccionada,
    setEspecialidadSeleccionada,
  ] = useState('todas');

  useEffect(() => {
    cargarPredicciones();
  }, [dias]);

  function cargarPredicciones() {
    try {
      setCargando(true);
      setError('');

      const datos =
        prediccionesEspecialidadesService.predecirProximosDias(
          dias
        );

      setPredicciones(
        Array.isArray(datos)
          ? datos
          : []
      );
    } catch (err) {
      console.error(
        'Error al obtener predicciones:',
        err
      );

      setPredicciones([]);

      setError(
        err?.message ||
          'No se pudieron obtener las predicciones de demanda.'
      );
    } finally {
      setCargando(false);
    }
  }

  function cambiarVista(nuevaVista) {
    setVista(nuevaVista);

    setDias(
      DIAS_POR_VISTA[nuevaVista]
    );
  }

  const especialidades = useMemo(() => {
    return [
      ...new Set(
        predicciones
          .map(
            (item) =>
              item.especialidad
          )
          .filter(Boolean)
      ),
    ];
  }, [predicciones]);

  const prediccionesFiltradas =
    useMemo(() => {
      if (
        especialidadSeleccionada ===
        'todas'
      ) {
        return predicciones;
      }

      return predicciones.filter(
        (item) =>
          item.especialidad ===
          especialidadSeleccionada
      );
    }, [
      predicciones,
      especialidadSeleccionada,
    ]);

  /*
   * Agrupación utilizada por la gráfica
   */
  const datosGrafica = useMemo(() => {
    const agrupado = {};

    prediccionesFiltradas.forEach(
      (item) => {
        const citas = Number(
          item.citas_predichas || 0
        );

        let clave;
        let etiqueta;

        if (vista === 'dia') {
          clave = item.fecha;
          etiqueta =
            formatearFecha(item.fecha);
        }

        if (vista === 'semana') {
          clave =
            obtenerClaveSemana(
              item.fecha
            );

          etiqueta =
            obtenerEtiquetaSemana(
              item.fecha
            );
        }

        if (vista === 'mes') {
          clave =
            obtenerClaveMes(
              item.fecha
            );

          etiqueta =
            obtenerEtiquetaMes(
              item.fecha
            );
        }

        if (!clave) return;

        if (!agrupado[clave]) {
          agrupado[clave] = {
            clave,
            etiqueta,
            citas: 0,
          };
        }

        agrupado[clave].citas +=
          citas;
      }
    );

    return Object.values(
      agrupado
    ).sort((a, b) =>
      a.clave.localeCompare(
        b.clave
      )
    );
  }, [
    prediccionesFiltradas,
    vista,
  ]);

  /*
   * Agrupación por especialidad
   */
  const resumenEspecialidades =
    useMemo(() => {
      const agrupado = {};

      prediccionesFiltradas.forEach(
        (item) => {
          const especialidad =
            item.especialidad ||
            'Sin especialidad';

          const citas = Number(
            item.citas_predichas || 0
          );

          if (
            !agrupado[especialidad]
          ) {
            agrupado[especialidad] = 0;
          }

          agrupado[especialidad] +=
            citas;
        }
      );

      return Object.entries(
        agrupado
      )
        .map(
          ([
            especialidad,
            citas,
          ]) => ({
            especialidad,
            citas,
          })
        )
        .sort(
          (a, b) =>
            b.citas - a.citas
        );
    }, [
      prediccionesFiltradas,
    ]);

  /*
   * Métricas
   */
  const metricas = useMemo(() => {
    const total =
      prediccionesFiltradas.reduce(
        (sum, item) =>
          sum +
          Number(
            item.citas_predichas ||
              0
          ),
        0
      );

    const fechas = [
      ...new Set(
        prediccionesFiltradas.map(
          (item) => item.fecha
        )
      ),
    ];

    const promedio =
      fechas.length > 0
        ? total / fechas.length
        : 0;

    const mayor =
      datosGrafica.length > 0
        ? Math.max(
            ...datosGrafica.map(
              (item) =>
                item.citas
            )
          )
        : 0;

    return {
      total,
      promedio,
      mayor,
    };
  }, [
    prediccionesFiltradas,
    datosGrafica,
  ]);

  const maxGrafica = Math.max(
    ...datosGrafica.map(
      (item) => item.citas
    ),
    1
  );

  const maxEspecialidad =
    Math.max(
      ...resumenEspecialidades.map(
        (item) => item.citas
      ),
      1
    );

  /*
   * Tabla
   */
  const datosTabla = useMemo(() => {
    return [
      ...prediccionesFiltradas,
    ].sort((a, b) =>
      String(a.fecha).localeCompare(
        String(b.fecha)
      )
    );
  }, [
    prediccionesFiltradas,
  ]);

  if (cargando) {
    return (
      <div className="tarjeta panel-cargando">
        <div className="spinner"></div>

        <h3>
          Predicción de demanda
        </h3>

        <p className="detalle">
          Calculando las citas
          proyectadas...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tarjeta">
        <h3>
          Predicción de demanda
        </h3>

        <div className="alerta alerta-error">
          {error}
        </div>

        <button
          type="button"
          className="boton"
          onClick={
            cargarPredicciones
          }
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="panel-demanda-especialidades">

      {/* ENCABEZADO */}

      <div className="panel-titulo">
        <div>
          <h2>
            Predicción de demanda
            por especialidad
          </h2>

          <p className="detalle">
            Analiza las citas
            proyectadas por día,
            semana, mes y
            especialidad.
          </p>
        </div>

        <button
          type="button"
          className="boton"
          onClick={
            cargarPredicciones
          }
        >
          ↻ Actualizar
        </button>
      </div>


      {/* BOTONES DE VISTA */}

      <div
        className="filtros-demanda"
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '10px',
          alignItems: 'end',
        }}
      >

        <div className="filtro">
          <label>
            Período
          </label>

          <div
            style={{
              display: 'flex',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >

            <button
              type="button"
              className={
                vista === 'dia'
                  ? 'boton boton-activo'
                  : 'boton'
              }
              onClick={() =>
                cambiarVista('dia')
              }
            >
              Día
            </button>

            <button
              type="button"
              className={
                vista === 'semana'
                  ? 'boton boton-activo'
                  : 'boton'
              }
              onClick={() =>
                cambiarVista(
                  'semana'
                )
              }
            >
              Semana
            </button>

            <button
              type="button"
              className={
                vista === 'mes'
                  ? 'boton boton-activo'
                  : 'boton'
              }
              onClick={() =>
                cambiarVista('mes')
              }
            >
              Mes
            </button>

          </div>
        </div>


        {/* ESPECIALIDAD */}

        <div className="filtro">
          <label htmlFor="especialidad-demanda">
            Especialidad
          </label>

          <select
            id="especialidad-demanda"
            value={
              especialidadSeleccionada
            }
            onChange={(e) =>
              setEspecialidadSeleccionada(
                e.target.value
              )
            }
          >
            <option value="todas">
              Todas las especialidades
            </option>

            {especialidades.map(
              (especialidad) => (
                <option
                  key={especialidad}
                  value={especialidad}
                >
                  {especialidad}
                </option>
              )
            )}
          </select>
        </div>

      </div>


      {/* INFORMACIÓN DE LA VISTA */}

      <div
        className="detalle"
        style={{
          marginBottom: '18px',
        }}
      >
        Mostrando los próximos{' '}
        <strong>
          {dias} días
        </strong>{' '}
        agrupados por{' '}
        <strong>
          {vista === 'dia'
            ? 'día'
            : vista === 'semana'
            ? 'semana'
            : 'mes'}
        </strong>
        {especialidadSeleccionada !==
          'todas' && (
          <>
            {' '}
            para{' '}
            <strong>
              {
                especialidadSeleccionada
              }
            </strong>
          </>
        )}
        .
      </div>


      {/* MÉTRICAS */}

      <div className="metricas-grid">

        <div className="metrica-card">
          <div className="metrica-icono">
            📅
          </div>

          <div>
            <span className="metrica-label">
              Citas proyectadas
            </span>

            <strong>
              {redondear(
                metricas.total
              )}
            </strong>
          </div>
        </div>


        <div className="metrica-card">
          <div className="metrica-icono">
            📊
          </div>

          <div>
            <span className="metrica-label">
              Promedio diario
            </span>

            <strong>
              {metricas.promedio.toFixed(
                1
              )}
            </strong>
          </div>
        </div>


        <div className="metrica-card">
          <div className="metrica-icono">
            📈
          </div>

          <div>
            <span className="metrica-label">
              Mayor demanda
            </span>

            <strong>
              {redondear(
                metricas.mayor
              )}
            </strong>
          </div>
        </div>


        <div className="metrica-card">
          <div className="metrica-icono">
            🏥
          </div>

          <div>
            <span className="metrica-label">
              Especialidades
            </span>

            <strong>
              {
                especialidades.length
              }
            </strong>
          </div>
        </div>

      </div>


      {/* GRÁFICA PRINCIPAL */}

      <div
        className="tarjeta grafica-card"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="grafica-header">
          <div>
            <h3>
              Evolución de la demanda
            </h3>

            <p className="detalle">
              Citas proyectadas por{' '}
              {vista === 'dia'
                ? 'día'
                : vista === 'semana'
                ? 'semana'
                : 'mes'}
              .
            </p>
          </div>
        </div>


        <div
          style={{
            width: '100%',
            overflowX: 'auto',
            paddingBottom: '10px',
          }}
        >

          <div
            style={{
              minWidth:
                vista === 'dia'
                  ? '700px'
                  : '500px',
              padding:
                '20px 10px 10px',
            }}
          >

            {datosGrafica.length ===
            0 ? (
              <p className="detalle">
                No hay datos para
                mostrar.
              </p>
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'stretch',
                  gap:
                    vista === 'dia'
                      ? '8px'
                      : '18px',
                  height: '300px',
                  borderBottom:
                    '1px solid var(--color-borde, #ddd)',
                  padding:
                    '10px 5px 0',
                }}
              >

                {datosGrafica.map(
                  (item) => {
                    const altura =
                      Math.max(
                        5,
                        (
                          item.citas /
                          maxGrafica
                        ) * 240
                      );

                    return (
                      <div
                        key={
                          item.clave
                        }
                        style={{
                          flex: 1,
                          minWidth:
                            vista ===
                            'dia'
                              ? '38px'
                              : '80px',
                          display:
                            'flex',
                          flexDirection:
                            'column',
                          justifyContent:
                            'flex-end',
                          alignItems:
                            'center',
                          gap: '8px',
                        }}
                      >

                        <strong
                          style={{
                            fontSize:
                              '12px',
                          }}
                        >
                          {redondear(
                            item.citas
                          )}
                        </strong>

                        <div
                          title={`${item.etiqueta}: ${redondear(item.citas)} citas`}
                          style={{
                            width:
                              '100%',
                            maxWidth:
                              '48px',
                            height: `${altura}px`,
                            background:
                              'var(--color-principal, #2563eb)',
                            borderRadius:
                              '6px 6px 0 0',
                            transition:
                              'height 0.3s ease',
                          }}
                        />

                        <span
                          style={{
                            fontSize:
                              '11px',
                            textAlign:
                              'center',
                            maxWidth:
                              '80px',
                            overflow:
                              'hidden',
                            textOverflow:
                              'ellipsis',
                            whiteSpace:
                              'nowrap',
                          }}
                          title={
                            item.etiqueta
                          }
                        >
                          {item.etiqueta}
                        </span>

                      </div>
                    );
                  }
                )}

              </div>
            )}

          </div>

        </div>

      </div>


      {/* COMPARACIÓN DE ESPECIALIDADES */}

      <div
        className="tarjeta grafica-card"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="grafica-header">
          <div>
            <h3>
              Demanda por especialidad
            </h3>

            <p className="detalle">
              Comparación de las
              citas proyectadas
              durante el período.
            </p>
          </div>
        </div>


        <div
          className="grafica-barras"
          style={{
            display: 'flex',
            flexDirection:
              'column',
            gap: '18px',
            marginTop: '20px',
          }}
        >

          {resumenEspecialidades.length ===
          0 ? (
            <p className="detalle">
              No hay datos para
              mostrar.
            </p>
          ) : (
            resumenEspecialidades.map(
              (item) => {
                const porcentaje =
                  (
                    item.citas /
                    maxEspecialidad
                  ) * 100;

                return (
                  <div
                    className="barra-item"
                    key={
                      item.especialidad
                    }
                  >

                    <div
                      className="barra-info"
                      style={{
                        display:
                          'flex',
                        justifyContent:
                          'space-between',
                        gap: '15px',
                        marginBottom:
                          '6px',
                      }}
                    >

                      <strong>
                        {
                          item.especialidad
                        }
                      </strong>

                      <span>
                        {redondear(
                          item.citas
                        )}{' '}
                        citas
                      </span>

                    </div>

                    <div
                      className="barra-contenedor"
                      style={{
                        width:
                          '100%',
                        height:
                          '12px',
                        background:
                          '#e5e7eb',
                        borderRadius:
                          '10px',
                        overflow:
                          'hidden',
                      }}
                    >

                      <div
                        className="barra-demanda"
                        style={{
                          width: `${porcentaje}%`,
                          height:
                            '100%',
                          background:
                            'var(--color-principal, #2563eb)',
                          borderRadius:
                            '10px',
                          transition:
                            'width 0.3s ease',
                        }}
                      />

                    </div>

                  </div>
                );
              }
            )
          )}

        </div>

      </div>


      {/* TABLA */}

      <div
        className="tarjeta"
        style={{
          marginTop: '20px',
        }}
      >

        <div className="encabezado-tabla">

          <div>
            <h3>
              Predicciones
            </h3>

            <p className="detalle">
              Detalle de las citas
              proyectadas.
            </p>
          </div>

        </div>


        <div
          className="tabla-contenedor"
          style={{
            overflowX: 'auto',
          }}
        >

          <table className="tabla">

            <thead>
              <tr>
                <th>
                  Fecha
                </th>

                <th>
                  Día
                </th>

                <th>
                  Especialidad
                </th>

                <th>
                  Trimestre
                </th>

                <th>
                  Semana
                </th>

                <th>
                  Citas predichas
                </th>
              </tr>
            </thead>


            <tbody>

              {datosTabla.map(
                (prediccion, index) => (
                  <tr
                    key={`${prediccion.fecha}-${prediccion.especialidad}-${index}`}
                  >

                    <td>
                      <strong>
                        {formatearFecha(
                          prediccion.fecha
                        )}
                      </strong>
                    </td>

                    <td>
                      {obtenerDiaSemana(
                        prediccion.fecha
                      )}
                    </td>

                    <td>
                      {
                        prediccion.especialidad
                      }
                    </td>

                    <td>
                      {prediccion.quarter ??
                        '—'}
                    </td>

                    <td>
                      {prediccion.weekofyear ??
                        obtenerNumeroSemana(
                          prediccion.fecha
                        ) ??
                        '—'}
                    </td>

                    <td>
                      <span className="citas-predichas">
                        {redondear(
                          prediccion.citas_predichas
                        )}
                      </span>
                    </td>

                  </tr>
                )
              )}


              {datosTabla.length ===
                0 && (
                <tr>
                  <td
                    colSpan="6"
                  >
                    No hay predicciones
                    para los filtros
                    seleccionados.
                  </td>
                </tr>
              )}

            </tbody>

          </table>

        </div>

      </div>


      {/* VARIABLES DEL MODELO */}

      <div
        className="tarjeta"
        style={{
          marginTop: '20px',
        }}
      >

        <details>

          <summary>
            Ver variables utilizadas
            para las predicciones
          </summary>

          <div
            className="features-prediccion"
            style={{
              marginTop: '15px',
            }}
          >

            <p className="detalle">
              Las predicciones se
              calculan utilizando
              las variables
              temporales del modelo
              XGBoost.
            </p>

            <div
              className="lista-features"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >

              {[
                'dayofyear',
                'dayofweek',
                'quarter',
                'month',
                'year',
                'dayofmonth',
                'weekofyear',
              ].map(
                (feature) => (
                  <span
                    key={feature}
                    className="etiqueta-feature"
                  >
                    {feature}
                  </span>
                )
              )}

            </div>

          </div>

        </details>

      </div>

    </div>
  );
}
