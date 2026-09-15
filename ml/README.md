# IA — demanda por médico y disponibilidad

Este módulo cubre exclusivamente:

- **Punto 3:** demanda por médico (carga futura de cada médico).
- **Punto 5:** predicción de disponibilidad (probabilidad de encontrar horarios libres).

No implementa demanda global, demanda por especialidad, horarios de mayor demanda
ni recomendación inteligente de citas.

## Flujo de trabajo

1. Ejecutar `database/exports/demanda_medicos_dataset.sql` en Supabase.
2. Exportar el resultado como `demanda_medicos_dataset.csv`.
3. Crear en Kaggle un dataset privado llamado `medicitas-historico` y subir el CSV.
4. Importar y ejecutar `notebooks/prediccion_demanda_medico.ipynb` con **Save & Run All**.
5. Descargar desde `/kaggle/working`:
   - `predicciones_medicos.csv`
   - `modelo_demanda_medico.joblib`
   - `metricas_modelo.json`
6. Ejecutar la migración `database/migrations/20260915_ia_demanda_disponibilidad.sql`.
7. Importar `predicciones_medicos.csv` en `public.predicciones_medicos` desde Supabase.

El notebook genera datos sintéticos cuando el CSV histórico no está disponible.
Ese modo sirve únicamente para demostrar que el proceso funciona; sus resultados
deben identificarse como un prototipo y no como predicciones reales.

## Privacidad

El dataset solo contiene identificadores técnicos y conteos agregados. Nunca se
deben subir a Kaggle nombres, correos, teléfonos o identificadores de pacientes.

