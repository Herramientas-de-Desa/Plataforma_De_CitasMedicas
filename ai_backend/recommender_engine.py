"""
Motor de Recomendación Inteligente de Citas Médicas
MediCitas — Clases y Utilidades de Recomendación
"""

import math
import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity

def calcular_distancia_haversine(lat1, lon1, lat2, lon2):
    """Calcula la distancia en kilómetros entre dos coordenadas geográficas."""
    R = 6371.0 # Radio de la Tierra en km
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return round(R * c, 2)

class SistemaRecomendadorCitas:
    def __init__(self, df_sintomas, df_medicos, tfidf_vectorizer, kmeans_model, scaler):
        self.df_sintomas = df_sintomas
        self.df_medicos = df_medicos
        self.tfidf_vectorizer = tfidf_vectorizer
        self.kmeans_model = kmeans_model
        self.scaler = scaler
        
        # Precomputar matriz TF-IDF de los síntomas clínicos
        self.tfidf_matrix_sintomas = self.tfidf_vectorizer.transform(df_sintomas['sintomas_texto'] + " " + df_sintomas['palabras_clave'])
        
        # Precomputar matriz TF-IDF de los médicos
        textos_medicos = (
            df_medicos['especialidad'] + " " +
            df_medicos['descripcion_experiencia'] + " " +
            df_medicos['modalidad']
        )
        self.tfidf_matrix_medicos = self.tfidf_vectorizer.transform(textos_medicos)

    def predecir_especialidad(self, consulta_usuario_texto):
        """
        Calcula la afinidad semántica de la consulta con la base de síntomas
        usando Similitud de Coseno sobre vectores TF-IDF.
        """
        vec_usuario = self.tfidf_vectorizer.transform([consulta_usuario_texto])
        similitudes = cosine_similarity(vec_usuario, self.tfidf_matrix_sintomas)[0]
        
        mejor_idx = int(np.argmax(similitudes))
        mejor_similitud = float(similitudes[mejor_idx])
        
        if mejor_similitud > 0.05:
            especialidad = self.df_sintomas.iloc[mejor_idx]['especialidad_sugerida']
            urgencia = self.df_sintomas.iloc[mejor_idx]['categoria_urgencia']
        else:
            especialidad = 'Medicina General'
            urgencia = 'Baja'
            
        return especialidad, urgencia, mejor_similitud

    def recomendar(self, 
                   consulta_sintomas="", 
                   especialidad_forzada=None, 
                   seguro_usuario="Particular", 
                   presupuesto_max=500.0, 
                   modalidad_preferida="Cualquiera", 
                   lat_usuario=-14.0678, 
                   lon_usuario=-75.7286, 
                   prioridad="balanceado",
                   top_k=6):
        """
        Motor de Recomendación Multicriterio que responde a: 'Qué opción conviene recomendar'.
        """
        # 1. Identificar especialidad sugerida por IA
        if especialidad_forzada and especialidad_forzada != "Todas":
            esp_objetivo = especialidad_forzada
            urgencia_detectada = "Media"
            afinidad_base = 0.95
        else:
            esp_objetivo, urgencia_detectada, afinidad_base = self.predecir_especialidad(consulta_sintomas)

        # 2. Vectorizar consulta contra médicos
        vec_usuario = self.tfidf_vectorizer.transform([consulta_sintomas if consulta_sintomas else esp_objetivo])
        sims_medicos = cosine_similarity(vec_usuario, self.tfidf_matrix_medicos)[0]

        # 3. Ponderaciones según la prioridad del usuario
        pesos_map = {
            "balanceado": {"afinidad": 0.35, "calidad": 0.25, "precio": 0.15, "distancia": 0.15, "tiempo": 0.10},
            "precio":     {"afinidad": 0.25, "calidad": 0.15, "precio": 0.40, "distancia": 0.10, "tiempo": 0.10},
            "cercania":   {"afinidad": 0.25, "calidad": 0.15, "precio": 0.10, "distancia": 0.40, "tiempo": 0.10},
            "calidad":    {"afinidad": 0.25, "calidad": 0.45, "precio": 0.10, "distancia": 0.10, "tiempo": 0.10},
            "rapidez":    {"afinidad": 0.25, "calidad": 0.15, "precio": 0.10, "distancia": 0.15, "tiempo": 0.35},
        }
        w = pesos_map.get(prioridad, pesos_map["balanceado"])

        candidatos = []
        for idx, row in self.df_medicos.iterrows():
            distancia_km = calcular_distancia_haversine(lat_usuario, lon_usuario, row['latitud'], row['longitud'])
            
            # Coincidencia de especialidad
            es_misma_especialidad = (row['especialidad'].lower() == esp_objetivo.lower())
            
            # Subscore de afinidad clínica
            sim_semantica = float(sims_medicos[idx])
            subscore_afinidad = (1.0 if es_misma_especialidad else 0.2) * 0.7 + (sim_semantica * 0.3)
            
            # Subscore de calidad (estrellas normalizadas de 0 a 1)
            subscore_calidad = (row['calificacion_estrellas'] - 3.0) / 2.0
            
            # Subscore de precio con seguro
            tarifa_efectiva = row['tarifa_base_soles']
            seguro_valido = False
            for s in str(row['seguros_aceptados']).split(','):
                if s.strip().lower() in seguro_usuario.lower():
                    seguro_valido = True
                    break

            if seguro_valido:
                if "EPS" in seguro_usuario:
                    tarifa_efectiva *= 0.30
                elif "EsSalud" in seguro_usuario:
                    tarifa_efectiva *= 0.15
                elif "SIS" in seguro_usuario:
                    tarifa_efectiva *= 0.05
            tarifa_efectiva = round(tarifa_efectiva, 2)
            
            subscore_precio = max(0.0, min(1.0, 1.0 - (tarifa_efectiva / max(presupuesto_max, 150.0))))
            subscore_distancia = max(0.0, min(1.0, 1.0 - (distancia_km / 8.0)))
            
            subscore_tiempo = 1.0 if row['disponibilidad_inmediata'] == 1 else 0.5
            subscore_tiempo -= (row['tiempo_espera_promedio_min'] / 60.0) * 0.3
            subscore_tiempo = max(0.0, min(1.0, subscore_tiempo))

            # Score global ponderado
            score_global = (
                w["afinidad"] * subscore_afinidad +
                w["calidad"] * subscore_calidad +
                w["precio"] * subscore_precio +
                w["distancia"] * subscore_distancia +
                w["tiempo"] * subscore_tiempo
            )

            match_porcentaje = int(np.clip(round(score_global * 100), 45, 99))
            estrellas_compatibilidad = round(score_global * 5, 1)

            # Explicabilidad (XAI)
            insignias = []
            razones = []
            
            if es_misma_especialidad:
                razones.append(f"Especialista idóneo en {row['especialidad']}")
            if row['calificacion_estrellas'] >= 4.8:
                insignias.append("⭐ Excelente Calificación")
                razones.append(f"{row['calificacion_estrellas']}★ ({row['total_resenas']} reseñas)")
            if row['disponibilidad_inmediata'] == 1:
                insignias.append("⚡ Cita Inmediata")
                razones.append("Turnos libres hoy")
            if distancia_km <= 1.5:
                insignias.append(f"📍 Muy Cerca ({distancia_km} km)")
                razones.append(f"A {distancia_km} km")
            if seguro_valido and "Particular" not in seguro_usuario:
                insignias.append(f"🛡️ Acepta tu seguro")
                razones.append(f"Copago con seguro: S/. {tarifa_efectiva:.2f}")
            elif tarifa_efectiva <= 55:
                insignias.append("💰 Tarifa Económica")
                razones.append(f"Tarifa accesible: S/. {tarifa_efectiva:.2f}")

            candidatos.append({
                "id_medico": int(row['id_medico']),
                "nombre": row['nombre'],
                "especialidad": row['especialidad'],
                "clinica": row['clinica'],
                "direccion": row['direccion'],
                "telefono": row['telefono'],
                "distancia_km": distancia_km,
                "tarifa_base_soles": float(row['tarifa_base_soles']),
                "tarifa_con_seguro_soles": tarifa_efectiva,
                "calificacion_estrellas": float(row['calificacion_estrellas']),
                "total_resenas": int(row['total_resenas']),
                "experiencia_anos": int(row['experiencia_anos']),
                "tiempo_espera_promedio_min": int(row['tiempo_espera_promedio_min']),
                "modalidad": row['modalidad'],
                "disponibilidad_inmediata": bool(row['disponibilidad_inmediata']),
                "seguros_aceptados": str(row['seguros_aceptados']),
                "descripcion_experiencia": row['descripcion_experiencia'],
                "match_score": match_porcentaje,
                "estrellas_compatibilidad": estrellas_compatibilidad,
                "insignias": insignias[:3],
                "por_que_conviene": " • ".join(razones[:3]),
                "score_global_raw": float(score_global)
            })

        candidatos.sort(key=lambda x: x["score_global_raw"], reverse=True)
        
        if candidatos:
            candidatos[0]["insignias"].insert(0, "🏆 Opción Más Recomendada")

        return {
            "especialidad_sugerida": esp_objetivo,
            "urgencia_detectada": urgencia_detectada,
            "criterio_priorizado": prioridad,
            "total_opciones_evaluadas": len(candidatos),
            "recomendaciones": candidatos[:top_k]
        }
