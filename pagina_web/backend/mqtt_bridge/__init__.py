"""
===========================================================
Archivo: __init__.py
Ubicación: mqtt_bridge/

Descripción general:
--------------------
Este archivo marca el directorio `mqtt_bridge` como un paquete de Python, 
permitiendo que Django lo reconozca como una aplicación válida dentro del proyecto. 

Además, aquí se define la configuración predeterminada de la aplicación mediante 
la variable `default_app_config`. Esta variable le indica a Django cuál clase 
de configuración (AppConfig) debe usarse cuando la aplicación se carga.

En este caso, estamos enlazando el módulo `mqtt_bridge` con la clase 
`MqttBridgeConfig` definida en el archivo `apps.py`, la cual se encarga de 
inicializar el cliente MQTT al arrancar el servidor Django.
===========================================================
"""
#  Autor:  Sara Hernández

# Indica a Django que use la configuración definida en la clase `MqttBridgeConfig`
# del archivo `apps.py` como la configuración principal de esta aplicación.

default_app_config = 'mqtt_bridge.apps.MqttBridgeConfig'

