"""
API REST con FastAPI — Microservicio de Inteligencia Artificial para MediCitas
Módulo: "Recomendación Inteligente de Citas" (Qué opción conviene recomendar)
"""

import os
from typing import Optional, List
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Importar la clase del recomendador para deserialización con joblib
from train_recommender import SistemaRecomendadorCitas, calcular_distancia_haversine

app = FastAPI(
    title="MediCitas AI — Recomendación Inteligente de Citas",
    description="Microservicio de Machine Learning y NLP para responder a: '¿Qué opción de cita médica conviene recomendar?'",
    version="2.0.0"
)

# Configurar CORS para permitir comunicación con Vite/React
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.join(BASE_DIR, "models")
recommender_model_path = os.path.join(MODELS_DIR, "recommender_system.joblib")

recomendador_ia = None

def cargar_modelo():
    global recomendador_ia
    try:
        if os.path.exists(recommender_model_path):
            recomendador_ia = joblib.load(recommender_model_path)
            print("[+] Sistema Recomendador Inteligente cargado exitosamente.")
    except Exception as e:
        print(f"[-] Error al cargar modelo de recomendación: {e}")

# Cargar inmediatamente
cargar_modelo()

@app.on_event("startup")
def startup_event():
    cargar_modelo()

# --- Esquemas Pydantic ---

class ConsultaRecomendacionRequest(BaseModel):
    consulta_sintomas: str = Field(..., example="Siento dolor en el pecho, presión alta y palpitaciones rápidas")
    especialidad_forzada: Optional[str] = Field("Todas", example="Todas")
    seguro_usuario: str = Field("Particular", example="Seguro Privado (EPS)")
    presupuesto_max: float = Field(200.0, ge=10.0, le=1000.0, example=150.0)
    modalidad_preferida: str = Field("Cualquiera", example="Presencial")
    lat_usuario: float = Field(-14.0678, example=-14.0678)
    lon_usuario: float = Field(-75.7286, example=-75.7286)
    prioridad: str = Field("balanceado", example="balanceado") # balanceado, precio, cercania, calidad, rapidez
    top_k: int = Field(6, ge=1, le=10, example=5)

class MedicoRecomendadoItem(BaseModel):
    id_medico: int
    nombre: str
    especialidad: str
    clinica: str
    direccion: str
    telefono: str
    distancia_km: float
    tarifa_base_soles: float
    tarifa_con_seguro_soles: float
    calificacion_estrellas: float
    total_resenas: int
    experiencia_anos: int
    tiempo_espera_promedio_min: int
    modalidad: str
    disponibilidad_inmediata: bool
    seguros_aceptados: str
    descripcion_experiencia: str
    match_score: int
    estrellas_compatibilidad: float
    insignias: List[str]
    por_que_conviene: str

class RecomendacionResponse(BaseModel):
    especialidad_sugerida: str
    urgencia_detectada: str
    criterio_priorizado: str
    total_opciones_evaluadas: int
    recomendaciones: List[MedicoRecomendadoItem]
    fuente: str

# --- Endpoints REST ---

@app.get("/api/health")
def health_check():
    return {
        "status": "online",
        "modulo": "Recomendación Inteligente de Citas",
        "descripcion": "Qué opción conviene recomendar (Machine Learning & NLP)",
        "model_loaded": recomendador_ia is not None,
        "version": "2.0.0"
    }

@app.get("/api/recommend/sintomas-comunes")
def obtener_sintomas_comunes():
    """Retorna síntomas y motivos frecuentes para sugerencias rápidas en la interfaz."""
    return [
        {"etiqueta": "❤️ Dolor de pecho o palpitaciones", "texto": "dolor en el pecho fatiga palpitaciones presion alta", "esp": "Cardiología"},
        {"etiqueta": "🔬 Manchas rojas, acné o picazón", "texto": "erupcion cutanea picazon manchas rojas acne severo", "esp": "Dermatología"},
        {"etiqueta": "👶 Fiebre, tos o malestar en niño", "texto": "fiebre alta tos vomitos resfriado en niño", "esp": "Pediatría"},
        {"etiqueta": "🦴 Dolor articular, rodilla o lesión", "texto": "dolor en rodilla fractura esguince tobillo columna", "esp": "Traumatología"},
        {"etiqueta": "👁️ Visión borrosa o ardor ocular", "texto": "vision borrosa ojo seco enrojecimiento ocular", "esp": "Oftalmología"},
        {"etiqueta": "🦷 Dolor de muela o encías", "texto": "dolor de muela caries encia inflamada extraccion", "esp": "Odontología"},
        {"etiqueta": "🌸 Control prenatal o ginecológico", "texto": "control ginecologico papanicolaou retraso colicos", "esp": "Ginecología"},
        {"etiqueta": "🩺 Chequeo general o dolor estomacal", "texto": "chequeo general malestar estomago gastritis dolor de cabeza", "esp": "Medicina General"}
    ]

@app.post("/api/recommend/citas", response_model=RecomendacionResponse)
def recomendar_citas(req: ConsultaRecomendacionRequest):
    """
    Endpoint de Inferencia de Recomendación Inteligente:
    Determina qué médico y opción de cita médica conviene recomendar según los criterios del paciente.
    """
    if recomendador_ia is not None:
        try:
            res = recomendador_ia.recomendar(
                consulta_sintomas=req.consulta_sintomas,
                especialidad_forzada=req.especialidad_forzada,
                seguro_usuario=req.seguro_usuario,
                presupuesto_max=req.presupuesto_max,
                modalidad_preferida=req.modalidad_preferida,
                lat_usuario=req.lat_usuario,
                lon_usuario=req.lon_usuario,
                prioridad=req.prioridad,
                top_k=req.top_k
            )
            return {**res, "fuente": "Inferencia en Vivo (FastAPI + TF-IDF + MCDA Ranking)"}
        except Exception as e:
            print(f"[-] Error en recomendador: {e}")

    # En caso de contingencia
    raise HTTPException(status_code=500, detail="El modelo recomendador no está listo.")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
