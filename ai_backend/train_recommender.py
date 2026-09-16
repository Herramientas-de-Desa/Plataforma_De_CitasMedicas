"""
Script de Entrenamiento y Serialización del Sistema de Recomendación Inteligente de Citas Médicas
MediCitas — Módulo de Inteligencia Artificial: "Recomendación Inteligente de Citas" (Qué opción conviene recomendar)
"""

import os
import pandas as pd
import joblib

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.cluster import KMeans
from sklearn.preprocessing import MinMaxScaler

from recommender_engine import SistemaRecomendadorCitas, calcular_distancia_haversine

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
os.makedirs(DATA_DIR, exist_ok=True)
os.makedirs(MODELS_DIR, exist_ok=True)

def entrenar_y_exportar():
    print("=" * 65)
    print("   MEDICITAS AI — SISTEMA DE RECOMENDACIÓN INTELIGENTE DE CITAS")
    print("=" * 65)

    df_sintomas = pd.read_csv(os.path.join(DATA_DIR, "sintomas_especialidades_dataset.csv"))
    df_medicos = pd.read_csv(os.path.join(DATA_DIR, "medicos_evaluacion_dataset.csv"))
    print(f"[+] Síntomas cargados: {len(df_sintomas)} registros")
    print(f"[+] Médicos y clínicas cargados: {len(df_medicos)} especialistas")

    # 1. Ajustar Vectorizador TF-IDF con stop words en español
    stop_words_es = [
        'de', 'la', 'que', 'el', 'en', 'y', 'a', 'los', 'del', 'se', 'las', 'por', 'un', 'para',
        'con', 'no', 'una', 'su', 'al', 'lo', 'como', 'mas', 'pero', 'sus', 'le', 'ya', 'o',
        'este', 'si', 'porque', 'esta', 'son', 'entre', 'esta', 'cuando', 'muy', 'sin', 'sobre'
    ]
    
    corpus_textos = list(df_sintomas['sintomas_texto'] + " " + df_sintomas['palabras_clave']) + \
                    list(df_medicos['especialidad'] + " " + df_medicos['descripcion_experiencia'])
                    
    tfidf = TfidfVectorizer(ngram_range=(1, 2), stop_words=stop_words_es, min_df=1)
    tfidf.fit(corpus_textos)
    print(f"[+] Vocabulario TF-IDF generado: {len(tfidf.vocabulary_)} términos únicos")

    # 2. Clustering K-Means sobre Perfiles de Atención Médica
    features_medicos = df_medicos[['tarifa_base_soles', 'calificacion_estrellas', 'experiencia_anos', 'tiempo_espera_promedio_min']].copy()
    scaler = MinMaxScaler()
    X_scaled = scaler.fit_transform(features_medicos)
    
    kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
    kmeans.fit(X_scaled)
    df_medicos['cluster_perfil'] = kmeans.labels_
    print(f"[+] Clustering K-Means ajustado (3 clusters de segmentación médica)")

    # 3. Construcción del Sistema Recomendador
    recomendador = SistemaRecomendadorCitas(
        df_sintomas=df_sintomas,
        df_medicos=df_medicos,
        tfidf_vectorizer=tfidf,
        kmeans_model=kmeans,
        scaler=scaler
    )

    # 4. Evaluación y Benchmark con Consultas de Prueba
    casos_prueba = [
        ("Siento fuerte dolor en el pecho, presión alta y palpitaciones rápidas", "Cardiología"),
        ("Tengo manchas rojas que pican mucho y acné en el rostro", "Dermatología"),
        ("Mi hijo pequeño tiene fiebre alta y tos seca persistente", "Pediatría"),
        ("Dolor agudo en la rodilla y tobillo tras una caída al jugar fútbol", "Traumatología"),
        ("Molestia en una muela al comer cosas frías y sangrado de encías", "Odontología")
    ]

    print("\n--- Benchmark de Acierto de Afinidad y Recomendación ---")
    aciertos = 0
    for texto, esp_esperada in casos_prueba:
        esp_pred, urg, sim = recomendador.predecir_especialidad(texto)
        acierto = (esp_pred.lower() == esp_esperada.lower())
        if acierto:
            aciertos += 1
        print(f"Consulta: '{texto[:45]}...'")
        print(f"-> Predicción IA: {esp_pred} (Similitud Coseno: {sim:.3f}) | Esperada: {esp_esperada} [{'OK' if acierto else 'FAIL'}]")

    precision = (aciertos / len(casos_prueba)) * 100
    print(f"\n[*] Precisión en clasificación de síntomas: {precision:.1f}%")

    # 5. Serialización del Modelo
    modelo_path = os.path.join(MODELS_DIR, "recommender_system.joblib")
    joblib.dump(recomendador, modelo_path)
    print(f"\n[+] Modelo serializado exitosamente en: {modelo_path}")
    print("=" * 65)

if __name__ == "__main__":
    entrenar_y_exportar()
