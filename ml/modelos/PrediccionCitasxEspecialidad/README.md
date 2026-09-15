# Uso de modelos XGBoost — Predicción de demanda de citas

## 1. Descripción

Este proyecto contiene modelos de Machine Learning entrenados con **XGBoost** para predecir la cantidad de citas médicas esperadas según:

- Especialidad médica.
- Fecha de la cita.

Se generó **un modelo `.json` independiente para cada especialidad médica**.

Los modelos ya están entrenados, por lo que para realizar predicciones **no es necesario volver a entrenarlos**.

---

## 2. Estructura de los modelos

Los modelos generados se encuentran dentro de la carpeta:

```text
Especialidades/
