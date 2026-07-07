"""
=====================================================================
Archivo: routing.py
Ubicación: mqtt_bridge/

Descripción general:
--------------------
Este archivo define las rutas WebSocket específicas para la aplicación 
`mqtt_bridge`, utilizando el sistema de Django Channels.

Django Channels amplía el funcionamiento normal de Django (basado en HTTP)
para permitir **conexiones persistentes** como WebSockets.  
Mientras las rutas HTTP se definen en `urls.py`, las rutas WebSocket se 
definen aquí, en `routing.py`.

En este caso, cada vez que un cliente se conecta a la ruta:
    ws://<servidor>/ws/mqtt/
el sistema crea una instancia del consumer `MqttConsumer`, que se encargará 
de enviarle mensajes en tiempo real (telemetría MQTT, mocap, etc.).

Este archivo se integra luego en el `asgi.py` del proyecto principal, 
donde se combinan las rutas WebSocket de todas las apps registradas.
=====================================================================
"""

#  Autor:  Sara Hernández
# ================================================================
# Importaciones necesarias
# ===============================================================
from django.urls import path   # Permite definir rutas WebSocket al estilo Django
from . import consumers        # Importa el módulo que contiene los Consumers (controladores WebSocket)


# ================================================================
# Lista de rutas WebSocket disponibles en la app mqtt_bridge
# ---------------------------------------------------------------
# Cada elemento de esta lista asocia una URL con un Consumer.
# Django Channels utiliza esta lista para enrutar las conexiones entrantes.
# ================================================================
websocket_urlpatterns = [
    # ------------------------------------------------------------
    # Ruta: /ws/mqtt/
    # ------------------------------------------------------------
    # Esta ruta define el endpoint WebSocket al que se conectará el frontend.
    # Cuando el navegador o cliente se conecta a esta URL, Django Channels
    # crea una nueva instancia de `MqttConsumer` y la asocia a esa conexión.
    # ------------------------------------------------------------
    path("ws/mqtt/", consumers.MqttConsumer.as_asgi()),
]

