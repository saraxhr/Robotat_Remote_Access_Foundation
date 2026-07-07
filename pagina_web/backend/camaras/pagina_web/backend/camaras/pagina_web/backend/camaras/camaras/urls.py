# -*- coding: utf-8 -*-
# ============================================================
# urls.py — Rutas públicas de la aplicación Django "camaras"
# ============================================================
# Descripción general:
# Este archivo define las rutas (endpoints HTTP) específicas de la aplicación 
# encargada de gestionar las cámaras IP del sistema Robotat.
#
# Django utiliza el sistema de enrutamiento (URL dispatcher) para vincular
# cada URL con una función de vista (view) que ejecuta la lógica asociada.
#
# En este módulo:
#   - Se definen rutas que permiten:
#          1. Consultar si una cámara está conectada (online/offline).
#          2. Enviar comandos PTZ (pan, tilt, zoom, home).
#   - También se deja comentada una posible ruta para transmitir video MJPEG, 
#     la cual fue reemplazada por el microservidor Flask para evitar sobrecargar Django.
# ============================================================

#  Autor:  Sara Hernández
#  Colaboración técnica: ChatGPT (GPT-5)


# ------------------------------------------------------------
# Importación de funciones y módulos necesarios
# ------------------------------------------------------------
from django.urls import path                  # 'path' se usa para declarar rutas dentro del framework Django
from . import views                          # Importa el archivo 'views.py' local, donde se definen las funciones asociadas a cada ruta


# ------------------------------------------------------------
# Lista principal de patrones de URL (rutas de la aplicación)
# ------------------------------------------------------------
urlpatterns = [
     # --------------------------------------------------------
    # Ruta (comentada): transmisión MJPEG desde Django.
    # Fue deshabilitada porque el streaming ahora se maneja 
    # desde Flask, el cual permite conexiones persistentes.
    # --------------------------------------------------------
    # path("api/cameras/<cam_id>/stream/", views.stream_view, name="camera_stream"), # Stream MJPEG
    
    
    # --------------------------------------------------------
    # Ruta: /api/cameras/<id>/status/
    # --------------------------------------------------------
    # Método HTTP permitido: GET
    # Función asociada: views.status_view
    # Descripción:
    #   Devuelve un JSON con el estado actual de la cámara solicitada:
    #       {"online": true} o {"online": false}
    # Parámetros:
    #   <cam_id> → ID lógico de la cámara (según config.py)
    # --------------------------------------------------------
    path("api/cameras/<cam_id>/status/", views.status_view, name="camera_status"),   # Estado online/offline

    # --------------------------------------------------------
    # Ruta: /api/cameras/<id>/ptz/
    # --------------------------------------------------------
    # Método HTTP permitido: POST
    # Función asociada: views.ptz_view
    # Descripción:
    #   Permite enviar comandos de movimiento PTZ (Pan, Tilt, Zoom)
    #   hacia la cámara seleccionada mediante solicitudes JSON.
    # Ejemplo de cuerpo de solicitud:
    #   {"cmd": "up", "speed": 4}
    # Respuesta:
    #   {"ok": true} si la cámara respondió correctamente.
    # --------------------------------------------------------
    path("api/cameras/<cam_id>/ptz/",    views.ptz_view,    name="camera_ptz"),      # Control PTZ
]

