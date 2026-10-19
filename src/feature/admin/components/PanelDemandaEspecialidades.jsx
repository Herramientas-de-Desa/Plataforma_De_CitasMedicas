
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';

import {
  prediccionesEspecialidadesService,
} from '../services/prediccionesEspecialesService';

const DIAS_POR_VISTA = {
  dia: 14,
  semana: 56,
  mes: 180,
};

const VISTAS = [
  { valor: 'dia', etiqueta: 'Día' },
  { valor: 'semana', etiqueta: 'Semana' },
  { valor: 'mes', etiqueta: 'Mes' },
];

const NOMBRES_DIAS = [
  'Domingo',
  'Lunes',
  'Martes',
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
];

const FORMATEADOR_FECHA = new Intl.DateTimeFormat('es-PE', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const FORMATEADOR_NUMERO = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 0,
});

const FORMATEADOR_PROMEDIO = new Intl.NumberFormat('es-PE', {
  maximumFractionDigits: 1,
});

const FORMATEADOR_MES = new Intl.DateTimeFormat('es-PE', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});

const COLOR_PRINCIPAL = '#0e7c66';
const COLOR_SECUNDARIO = '#e2725b';

function crearFecha(fecha) {
  if (!fecha) return null;

  const texto = String(fecha).slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null;

  const [anio, mes, dia] = texto.split('-').map(Number);
  const date = new Date(Date.UTC(anio, mes - 1, dia));

  if (
    date.getUTCFullYear() !== anio ||
    date.getUTCMonth() !== mes - 1 ||
    date.getUTCDate() !== dia
  ) {
    return null;
  }

  return date;
}

function formatearFecha(fecha) {
  const date = crearFecha(fecha);

  return date
    ? FORMATEADOR_FECHA.format(date).replace(/\./g, '')
    : '—';
}

function obtenerDiaSemana(fecha) {
  const date = crearFecha(fecha);

  return date ? NOMBRES_DIAS[date.getUTCDay()] : '—';
}

function obtenerNumeroSemana(fecha) {
  const date = crearFecha(fecha);

  if (!date) return null;

  // Semana ISO: comienza el lunes.
  const jueves = new Date(date);
  const dia = jueves.getUTCDay() || 7;

  jueves.setUTCDate(jueves.getUTCDate() + 4 - dia);

  const inicioAnio = new Date(
    Date.UTC(jueves.getUTCFullYear(), 0, 1),
  );

  return Math.ceil(
    ((jueves - inicioAnio) / 86400000 + 1) / 7,
  );
}

function obtenerClaveSemana(fecha) {
  const date = crearFecha(fecha);

  if (!date) return '';

  const semana = obtenerNumeroSemana(fecha);

  // El año ISO puede diferir del año calendario.
  const jueves = new Date(date);
  const dia = jueves.getUTCDay() || 7;

  jueves.setUTCDate(jueves.getUTCDate() + 4 - dia);

  return `${jueves.getUTCFullYear()}-S${String(semana).padStart(2, '0')}`;
}

function obtenerEtiquetaSemana(fecha) {
  const date = crearFecha(fecha);

  if (!date) return '—';

  const semana = obtenerNumeroSemana(fecha);

  return `Sem. ${semana} · ${date.getUTCFullYear()}`;
}

function obtenerClaveMes(fecha) {
  const date = crearFecha(fecha);

  if (!date) return '';

  return `${date.getUTCFullYear()}-${String(
    date.getUTCMonth() + 1,
  ).padStart(2, '0')}`;
}

function obtenerEtiquetaMes(fecha) {
  const date = crearFecha(fecha);

  if (!date) return '—';

  const texto = FORMATEADOR_MES.format(date).replace(/\./g, '');

  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function obtenerCitas(valor) {
  const numero = Number(valor);

  return Number.isFinite(numero) ? Math.max(0, numero) : 0;
}

function formatearNumero(valor) {
  return FORMATEADOR_NUMERO.format(valor);
}

function Icono({ tipo, size = 20 }) {
  const iconos = {
    calendario: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    promedio: (
      <>
        <path d="M3 3v18h18" />
        <path d="m7 14 4-4 4 3 5-7" />
      </>
    ),
    tendencia: (
      <>
        <path d="m3 17 6-6 4 4 8-9" />
        <path d="M15 6h6v6" />
      </>
    ),
    especialidad: (
      <>
        <rect x="4" y="4" width="16" height="16" rx="4" />
        <path d="M12 8v8M8 12h8" />
      </>
    ),
    actualizar: (
      <>
        <path d="M20 7v5h-5" />
        <path d="M4 17v-5h5" />
        <path d="M5 9a7 7 0 0 1 12-3l3 6" />
        <path d="M19 15a7 7 0 0 1-12 3l-3-6" />
      </>
    ),
  };

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className="demanda-especialidades-icono-svg"
    >
      {iconos[tipo]}
    </svg>
  );
}

function TarjetaMetrica({ tipo, etiqueta, valor, detalle }) {
  return (
    <article className="metrica-card">
      <div className="metrica-icono" aria-hidden="true">
        <Icono tipo={tipo} />
      </div>

      <div className="metrica-contenido">
        <span className="metrica-label">{etiqueta}</span>
        <strong>{valor}</strong>
        {detalle && <small>{detalle}</small>}
      </div>
    </article>
  );
}

function TooltipDemanda({ active, payload, label }) {
  if (!active || !payload?.length) return null;

  return (
    <div className="demanda-tooltip">
      <strong>{label}</strong>
      <p>
        {formatearNumero(payload[0].value)} citas proyectadas
      </p>
    </div>
  );
}

function TooltipEspecialidad({ active, payload }) {
  if (!active || !payload?.length) return null;

  const item = payload[0].payload;

  return (
    <div className="demanda-tooltip">
      <strong>{item.especialidad}</strong>
      <p>{formatearNumero(item.citas)} citas proyectadas</p>
    </div>
  );
}

export default function PanelDemandaEspecialidades() {
  const [vista, setVista] = useState('dia');
  const [predicciones, setPredicciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [especialidadSeleccionada, setEspecialidadSeleccionada] =
    useState('todas');

  const dias = DIAS_POR_VISTA[vista];

  const cargarPredicciones = useCallback(async () => {
    setCargando(true);
    setError('');

    try {
      const datos =
        await prediccionesEspecialidadesService.predecirProximosDias(dias);

      if (!Array.isArray(datos)) {
        throw new Error('El servicio devolvió un formato de datos inesperado.');
      }

      setPredicciones(datos);
    } catch (err) {
      console.error('Error al obtener predicciones:', err);

      setPredicciones([]);
      setError(
        err?.message ||
          'No se pudieron obtener las predicciones de demanda.',
      );
    } finally {
      setCargando(false);
    }
  }, [dias]);

  useEffect(() => {
    cargarPredicciones();
  }, [cargarPredicciones]);

  const especialidades = useMemo(() => {
    return [
      ...new Set(
        predicciones
          .map((item) => item.especialidad)
          .filter((nombre) => typeof nombre === 'string' && nombre.trim()),
      ),
    ].sort((a, b) => a.localeCompare(b, 'es'));
  }, [predicciones]);

  // Si la especialidad desaparece de los resultados, restablecer el filtro.
  useEffect(() => {
    if (
      especialidadSeleccionada !== 'todas' &&
      !especialidades.includes(especialidadSeleccionada)
    ) {
      setEspecialidadSeleccionada('todas');
    }
  }, [especialidades, especialidadSeleccionada]);

  const prediccionesFiltradas = useMemo(() => {
    if (especialidadSeleccionada === 'todas') {
      return predicciones;
    }

    return predicciones.filter(
      (item) => item.especialidad === especialidadSeleccionada,
    );
  }, [predicciones, especialidadSeleccionada]);

  const datosGrafica = useMemo(() => {
    const agrupado = new Map();

    for (const item of prediccionesFiltradas) {
      const date = crearFecha(item.fecha);

      if (!date) continue;

      const fechaNormalizada = [
        date.getUTCFullYear(),
        String(date.getUTCMonth() + 1).padStart(2, '0'),
        String(date.getUTCDate()).padStart(2, '0'),
      ].join('-');

      let clave;
      let etiqueta;

      if (vista === 'dia') {
        clave = fechaNormalizada;
        etiqueta = formatearFecha(fechaNormalizada);
      } else if (vista === 'semana') {
        clave = obtenerClaveSemana(fechaNormalizada);
        etiqueta = obtenerEtiquetaSemana(fechaNormalizada);
      } else {
        clave = obtenerClaveMes(fechaNormalizada);
        etiqueta = obtenerEtiquetaMes(fechaNormalizada);
      }

      if (!clave) continue;

      const grupo = agrupado.get(clave) || {
        clave,
        etiqueta,
        citas: 0,
      };

      grupo.citas += obtenerCitas(item.citas_predichas);
      agrupado.set(clave, grupo);
    }

    return [...agrupado.values()].sort((a, b) =>
      a.clave.localeCompare(b.clave),
    );
  }, [prediccionesFiltradas, vista]);

  const resumenEspecialidades = useMemo(() => {
    const agrupado = new Map();

    for (const item of prediccionesFiltradas) {
      const nombre = item.especialidad?.trim() || 'Sin especialidad';

      agrupado.set(
        nombre,
        (agrupado.get(nombre) || 0) +
          obtenerCitas(item.citas_predichas),
      );
    }

    return [...agrupado.entries()]
      .map(([especialidad, citas]) => ({ especialidad, citas }))
      .sort(
        (a, b) =>
          b.citas - a.citas ||
          a.especialidad.localeCompare(b.especialidad, 'es'),
      );
  }, [prediccionesFiltradas]);

  const metricas = useMemo(() => {
    const total = prediccionesFiltradas.reduce(
      (suma, item) => suma + obtenerCitas(item.citas_predichas),
      0,
    );

    // El denominador es el período seleccionado, no solo los días
    // que aparecen en los registros recibidos.
    const promedio = total / dias;

    const mayor = datosGrafica.reduce(
      (maximo, item) => Math.max(maximo, item.citas),
      0,
    );

    return {
      total,
      promedio,
      mayor,
      cantidadEspecialidades: new Set(
        prediccionesFiltradas
          .map((item) => item.especialidad)
          .filter(Boolean),
      ).size,
    };
  }, [prediccionesFiltradas, datosGrafica, dias]);

  const datosTabla = useMemo(
    () =>
      [...prediccionesFiltradas].sort(
        (a, b) =>
          String(a.fecha || '').localeCompare(String(b.fecha || '')) ||
          String(a.especialidad || '').localeCompare(
            String(b.especialidad || ''),
            'es',
          ),
      ),
    [prediccionesFiltradas],
  );

  const periodoTexto = {
    dia: 'día',
    semana: 'semana',
    mes: 'mes',
  }[vista];

  const textoPeriodo = {
    dia: 'diaria',
    semana: 'semanal',
    mes: 'mensual',
  }[vista];

  const tituloGrafica = {
    dia: 'Evolución diaria de la demanda',
    semana: 'Evolución semanal de la demanda',
    mes: 'Evolución mensual de la demanda',
  }[vista];

  const hayDatos = prediccionesFiltradas.length > 0;

  if (cargando) {
    return (
      <section
        className="tarjeta panel-cargando"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="spinner" aria-hidden="true" />
        <h3>Predicción de demanda</h3>
        <p className="detalle">Calculando las citas proyectadas...</p>
      </section>
    );
  }

return (
  <section
    className="tarjeta panel-demanda-especialidades"
    aria-labelledby="titulo-demanda-especialidades"
  >
      <header className="demanda-especialidades-cabecera">
        <div>
          <span className="etiqueta-seccion">Análisis predictivo</span>

          <h2 id="titulo-demanda-especialidades">
            Predicción de demanda por especialidad
          </h2>

          <p className="detalle">
            Analiza las citas proyectadas, compara especialidades e identifica
            los períodos de mayor demanda.
          </p>
        </div>

        <button
          type="button"
          className="boton demanda-actualizar"
          onClick={cargarPredicciones}
          disabled={cargando}
        >
          <Icono tipo="actualizar" size={17} />
          Actualizar
        </button>
      </header>

      {error && (
        <div className="alerta alerta-error" role="alert">
          <div>
            <strong>No se pudieron cargar las predicciones.</strong>
            <p>{error}</p>
          </div>

          <button
            type="button"
            className="boton boton-secundario"
            onClick={cargarPredicciones}
          >
            Reintentar
          </button>
        </div>
      )}

      {!error && (
        <>
          <div className="demanda-especialidades-filtros">
            <div className="filtro-periodo">
              <span className="filtro-titulo">Período de análisis</span>

              <div
                className="demanda-periodo-opciones"
                role="group"
                aria-label="Seleccionar período de análisis"
              >
                {VISTAS.map(({ valor, etiqueta }) => (
                  <button
                    key={valor}
                    type="button"
                    className={
                      vista === valor
                        ? 'boton demanda-periodo-btn demanda-periodo-btn-activo'
                        : 'boton demanda-periodo-btn'
                    }
                    aria-pressed={vista === valor}
                    onClick={() => setVista(valor)}
                  >
                    {etiqueta}
                  </button>
                ))}
              </div>
            </div>

            <label
              className="filtro-especialidad"
              htmlFor="especialidad-demanda"
            >
              Especialidad

              <select
                id="especialidad-demanda"
                value={especialidadSeleccionada}
                onChange={(event) =>
                  setEspecialidadSeleccionada(event.target.value)
                }
              >
                <option value="todas">Todas las especialidades</option>

                {especialidades.map((especialidad) => (
                  <option key={especialidad} value={especialidad}>
                    {especialidad}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="demanda-periodo-descripcion">
            Próximos <strong>{dias} días</strong>, con agrupación{' '}
            <strong>{textoPeriodo}</strong>
            {especialidadSeleccionada !== 'todas' && (
              <>
                {' '}para <strong>{especialidadSeleccionada}</strong>
              </>
            )}
            .
          </p>

          <div className="metricas-grid">
            <TarjetaMetrica
              tipo="calendario"
              etiqueta="Citas proyectadas"
              valor={formatearNumero(metricas.total)}
              detalle="Total del período"
            />

            <TarjetaMetrica
              tipo="promedio"
              etiqueta="Promedio diario"
              valor={FORMATEADOR_PROMEDIO.format(metricas.promedio)}
              detalle="Citas por día del período"
            />

            <TarjetaMetrica
              tipo="tendencia"
              etiqueta="Mayor demanda"
              valor={formatearNumero(metricas.mayor)}
              detalle={`Máximo por ${periodoTexto}`}
            />

            <TarjetaMetrica
              tipo="especialidad"
              etiqueta="Especialidades"
              valor={formatearNumero(metricas.cantidadEspecialidades)}
              detalle="Incluidas en el filtro"
            />
          </div>

          {!hayDatos ? (
            <div className="demanda-especialidades-vacia">
              <div className="demanda-vacia-icono" aria-hidden="true">
                <Icono tipo="calendario" size={26} />
              </div>

              <h3>No hay predicciones para mostrar</h3>

              <p>
                Prueba con otra especialidad o actualiza los datos para
                consultar la demanda estimada.
              </p>

              {especialidadSeleccionada !== 'todas' && (
                <button
                  type="button"
                  className="boton"
                  onClick={() => setEspecialidadSeleccionada('todas')}
                >
                  Ver todas las especialidades
                </button>
              )}
            </div>
          ) : (
            <>
              <article className="tarjeta grafica-card">
                <div className="grafica-header">
                  <div>
                    <h3>{tituloGrafica}</h3>
                    <p className="detalle">
                      Citas proyectadas por {periodoTexto}, sumadas entre
                      las especialidades seleccionadas.
                    </p>
                  </div>

                  <span className="demanda-grafica-etiqueta">
                    {datosGrafica.length} períodos
                  </span>
                </div>

                <div
                  className="demanda-grafica-temporal"
                  role="img"
                  aria-label={`${tituloGrafica}. La gráfica muestra las citas proyectadas por ${periodoTexto}.`}
                >
                  {datosGrafica.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={datosGrafica}
                        margin={{
                          top: 12,
                          right: 12,
                          left: 0,
                          bottom: vista === 'dia' ? 24 : 8,
                        }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          vertical={false}
                          stroke="#dbe5e0"
                        />

                        <XAxis
                          dataKey="etiqueta"
                          tick={{ fontSize: 11, fill: '#6b7a76' }}
                          tickLine={false}
                          axisLine={false}
                          interval={vista === 'dia' ? 'preserveStartEnd' : 0}
                          angle={vista === 'dia' ? -25 : 0}
                          textAnchor={vista === 'dia' ? 'end' : 'middle'}
                          height={vista === 'dia' ? 62 : 36}
                        />

                        <YAxis
                          allowDecimals={false}
                          width={44}
                          tick={{ fontSize: 11, fill: '#6b7a76' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={formatearNumero}
                        />

                        <Tooltip
                          content={<TooltipDemanda />}
                          cursor={{ fill: '#e3f2ec', opacity: 0.7 }}
                        />

                        <Bar
                          dataKey="citas"
                          name="Citas proyectadas"
                          fill={COLOR_PRINCIPAL}
                          radius={[5, 5, 0, 0]}
                          maxBarSize={44}
                          minPointSize={0}
                          isAnimationActive={false}
                        >
                          {datosGrafica.map((item) => (
                            <Cell
                              key={item.clave}
                              fill={COLOR_PRINCIPAL}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <p className="detalle">No hay datos temporales válidos.</p>
                  )}
                </div>
              </article>

              <article className="tarjeta grafica-card">
                <div className="grafica-header">
                  <div>
                    <h3>Demanda por especialidad</h3>
                    <p className="detalle">
                      Comparación de citas proyectadas, ordenada de mayor
                      a menor.
                    </p>
                  </div>

                  <span className="demanda-grafica-etiqueta">
                    {resumenEspecialidades.length} especialidades
                  </span>
                </div>

                {resumenEspecialidades.length > 0 ? (
                  <div
                    className="demanda-grafica-especialidades"
                    role="img"
                    aria-label="Comparación del total de citas proyectadas por especialidad."
                  >
                    <ResponsiveContainer
                      width="100%"
                      height={Math.max(
                        230,
                        resumenEspecialidades.length * 54 + 30,
                      )}
                    >
                      <BarChart
                        data={resumenEspecialidades}
                        layout="vertical"
                        margin={{ top: 6, right: 24, left: 8, bottom: 6 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          horizontal={false}
                          stroke="#dbe5e0"
                        />

                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fontSize: 11, fill: '#6b7a76' }}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={formatearNumero}
                        />

                        <YAxis
                          type="category"
                          dataKey="especialidad"
                          width={130}
                          tick={{ fontSize: 11, fill: '#10322b' }}
                          tickLine={false}
                          axisLine={false}
                        />

                        <Tooltip
                          content={<TooltipEspecialidad />}
                          cursor={{ fill: '#e3f2ec', opacity: 0.7 }}
                        />

                        <Bar
                          dataKey="citas"
                          name="Citas proyectadas"
                          fill={COLOR_PRINCIPAL}
                          radius={[0, 5, 5, 0]}
                          maxBarSize={28}
                          isAnimationActive={false}
                        >
                          {resumenEspecialidades.map((item, index) => (
                            <Cell
                              key={item.especialidad}
                              fill={
                                index === 0
                                  ? COLOR_SECUNDARIO
                                  : COLOR_PRINCIPAL
                              }
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="detalle">No hay especialidades para comparar.</p>
                )}

                <p className="demanda-grafica-nota">
                  El total por especialidad suma las predicciones de los días
                  incluidos en el período seleccionado.
                </p>
              </article>

              <article className="tarjeta demanda-tabla-card">
                <div className="encabezado-tabla demanda-tabla-cabecera">
                  <div>
                    <h3>Detalle de predicciones</h3>
                    <p className="detalle">
                      Consulta las citas estimadas para cada fecha y
                      especialidad.
                    </p>
                  </div>

                  <span className="demanda-registros">
                    {datosTabla.length} registros
                  </span>
                </div>

                <div className="tabla-contenedor demanda-tabla-contenedor">
                  <table className="tabla tabla-tarjetas demanda-tabla">
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Día</th>
                        <th>Especialidad</th>
                        <th>Trimestre</th>
                        <th>Semana</th>
                        <th>Citas proyectadas</th>
                      </tr>
                    </thead>

                    <tbody>
                      {datosTabla.map((item, index) => (
                        <tr
                          key={`${item.fecha}-${item.especialidad}-${index}`}
                        >
                          <td data-label="Fecha">
                            <strong>{formatearFecha(item.fecha)}</strong>
                          </td>

                          <td data-label="Día">
                            {obtenerDiaSemana(item.fecha)}
                          </td>

                          <td data-label="Especialidad">
                            {item.especialidad || 'Sin especialidad'}
                          </td>

                          <td data-label="Trimestre">
                            {item.quarter ?? '—'}
                          </td>

                          <td data-label="Semana">
                            {item.weekofyear ??
                              obtenerNumeroSemana(item.fecha) ??
                              '—'}
                          </td>

                          <td data-label="Citas proyectadas">
                            <span className="citas-predichas">
                              {formatearNumero(
                                obtenerCitas(item.citas_predichas),
                              )}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <p className="demanda-tabla-pie">
                  Los valores corresponden a estimaciones del modelo, no a
                  reservas confirmadas.
                </p>
              </article>
            </>
          )}
        </>
      )}
    </section>
  );
}
