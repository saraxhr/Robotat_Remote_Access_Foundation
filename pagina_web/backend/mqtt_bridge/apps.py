"""
===========================================================
Archivo: apps.py
Ubicación: mqtt_bridge/

Descripción general:
--------------------
Este archivo define la configuración principal de la aplicación `mqtt_bridge` 
utilizando la clase `MqttBridgeConfig`, que hereda de `AppConfig` de Django.

Su propósito principal es inicializar el cliente MQTT automáticamente cuando 
Django arranca el servidor. De esta manera, no es necesario ejecutar manualmente 
el cliente MQTT, ya que se levanta junto con el backend.

El método `ready()` se ejecuta automáticamente cuando Django termina de cargar 
todas las aplicaciones instaladas, por lo que es el lugar ideal para iniciar 
procesos secundarios o tareas que deben correr en segundo plano, como un 
cliente MQTT, un hilo de escucha o un servicio continuo.

===========================================================
"""
#  Autor:  Sara Hernández

# -----------------------------------------------------------
# Importación del módulo base de configuración de aplicaciones en Django.
# `AppConfig` permite definir el comportamiento de una aplicación específica.
# -----------------------------------------------------------
from django.apps import AppConfig


# -----------------------------------------------------------
# Clase de configuración personalizada para la app `mqtt_bridge`.
# -----------------------------------------------------------
    # Define el tipo de campo automático por defecto para los modelos de base de datos.
    # Aunque esta app no define modelos, esta línea es una buena práctica estándar.
class MqttBridgeConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'mqtt_bridge'


    # -------------------------------------------------------
    # Método `ready()`:
    # Este método se ejecuta automáticamente cuando Django termina de inicializar
    # todas las aplicaciones instaladas. Aquí se inicia el cliente MQTT.
    # -------------------------------------------------------

    def ready(self):
        # Importación local para evitar errores de carga circular
        # (es decir, evitar que Django intente importar mqtt_client antes de tiempo).
        from .mqtt_client import start_mqtt_client


        # Llamada a la función que inicia el cliente MQTT.
        # Esta función típicamente establece conexión con el broker,
        # define los callbacks de suscripción y comienza el bucle de escucha (loop_start()).
        start_mqtt_client()


