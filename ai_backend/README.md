# MediCitas — Módulo de Inteligencia Artificial: Recomendación Inteligente de Citas

Este módulo implementa el requerimiento **N° 6: "Recomendación inteligente de citas — Qué opción conviene recomendar" (★★★★★)** para la plataforma **MediCitas**.

---

## 🎯 Objetivo de la IA
Determinar de forma inteligente y personalizada **qué médico, clínica y horario le conviene reservar al paciente**, evaluando múltiples variables clínicas, geográficas y socioeconómicas en tiempo real:

1. **Afinidad Clínica & Síntomas (NLP):** Procesamiento de lenguaje natural sobre la descripción libre de síntomas del paciente para sugerir la especialidad adecuada mediante **TF-IDF (1-2 gramas)** y **Similitud de Coseno (Cosine Similarity)**.
2. **Segmentación y Perfiles (Clustering K-Means):** Agrupación de especialistas según tarifas, calificaciones, tiempos de espera y experiencia.
3. **Ranking Multicriterio de Decisión (MCDA):** Función de utilidad adaptativa que pondera calidad ($R \in [1, 5]$ estrellas), tarifa con seguro (copago EPS/SIS/EsSalud), distancia en km (fórmula de Haversine) y disponibilidad inmediata.
4. **Explicabilidad de IA (XAI - Explainable AI):** Cada sugerencia incluye insignias dinámicas (*"🏆 Opción Más Recomendada"*, *"⚡ Cita Inmediata"*, *"⭐ Excelente Calificación"*, *"🛡️ Cobertura con tu seguro"*) y la explicación detallada de por qué se recomienda esa alternativa.

---

## 📁 Estructura del Módulo

```
ai_backend/
├── data/
│   ├── sintomas_especialidades_dataset.csv  # Corpus de síntomas y taxonomía clínica
│   └── medicos_evaluacion_dataset.csv       # Dataset de médicos, clínicas en Ica y calificaciones
├── models/
│   └── recommender_system.joblib           # Pipeline del recomendador serializado
├── notebooks/
│   └── Kaggle_Recomendacion_Inteligente_Citas.ipynb # Notebook documentado para Kaggle
├── recommender_engine.py                   # Clases del motor de recomendación y distancias
├── train_recommender.py                    # Script de entrenamiento, benchmarking y exportación
├── main.py                                 # API REST con FastAPI (Swagger UI en /docs)
├── requirements.txt                        # Dependencias de Python
└── README.md
```

---

## 🚀 Cómo Ejecutar

### 1. Instalar dependencias
```bash
cd ai_backend
pip install -r requirements.txt
```

### 2. Entrenar y generar el modelo recomendador
```bash
python train_recommender.py
```

### 3. Iniciar la API REST de IA
```bash
uvicorn main:app --reload --port 8000
```
- **Documentación Swagger interactiva:** `http://localhost:8000/docs`
- **Endpoint de recomendación:** `POST http://localhost:8000/api/recommend/citas`
- **Endpoint de síntomas sugeridos:** `GET http://localhost:8000/api/recommend/sintomas-comunes`

---

## 🌐 Integración con el Frontend (React 18 + Vite)

El frontend se conecta mediante `src/services/aiService.js` y la interfaz de usuario se encuentra en:
- Ruta: `http://localhost:5173/recomendacion-inteligente`
- Acceso en Navbar: **✨ Recomendación IA**

Cuenta con **motor de inferencia local de contingencia**, asegurando funcionamiento 100% offline durante presentaciones o evaluaciones.
