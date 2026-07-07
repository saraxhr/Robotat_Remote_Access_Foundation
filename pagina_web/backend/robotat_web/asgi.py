"""
ASGI config for robotat_web project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

# ======================================================================================
# Archivo: asgi.py
# Ubicación: backend/robotat_web/
#
# Descripción general:
# --------------------------------------------------------------------------------------
# Este archivo configura la interfaz ASGI (Asynchronous Server Gateway Interface)
# para el proyecto Django "robotat_web".
#
# ASGI es la versión asíncrona de WSGI y permite manejar protocolos más allá de HTTP,
# como WebSockets. En este proyecto se utiliza principalmente para permitir
# comunicación en tiempo real con el sistema MQTT y el frontend mediante Channels.
#
# La configuración combina la aplicación HTTP estándar de Django con un manejador
# de WebSockets autenticados usando el enrutamiento definido en mqtt_bridge.routing.
#
# Autora: Sara Hernández 
# Colaborador: ChatGPT 
# ======================================================================================


# Importa el módulo del sistema operativo para gestionar variables de entorno
import os

# Importa Django para inicializar el entorno y sus dependencias
import django  

# Importa los componentes de Channels necesarios para manejar diferentes tipos de conexión
from channels.routing import ProtocolTypeRouter, URLRouter  # Enrutamiento de protocolos (HTTP, WebSocket)
from django.core.asgi import get_asgi_application            # Obtiene la aplicación ASGI base de Django
from channels.auth import AuthMiddlewareStack                # Middleware que agrega autenticación a los WebSockets

# Importa el archivo de enrutamiento del módulo mqtt_bridge (donde se definen las rutas WebSocket)
import mqtt_bridge.routing


# Define la variable de entorno que indica el archivo de configuración principal de Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'robotat_web.settings')

# Inicializa Django y carga su configuración (necesario antes de crear la aplicación ASGI)
django.setup()  


# ======================================================================================
# Configuración de la aplicación ASGI principal
# --------------------------------------------------------------------------------------
# Se crea un enrutador de protocolos (ProtocolTypeRouter) que distingue entre:
# - "http": maneja las peticiones HTTP normales a través de Django.
# - "websocket": maneja las conexiones WebSocket con autenticación y enrutamiento.
# ======================================================================================
application = ProtocolTypeRouter({
    "http": get_asgi_application(),                # Maneja solicitudes HTTP estándar
    "websocket": AuthMiddlewareStack(              # Habilita conexiones WebSocket autenticadas
        URLRouter(mqtt_bridge.routing.websocket_urlpatterns)  # Define las rutas WebSocket del proyecto
    ),
})
