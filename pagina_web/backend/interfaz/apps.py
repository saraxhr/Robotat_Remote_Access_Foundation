# ======================================================================================
# Archivo: apps.py
# Ubicación: backend/interfaz/
#
# Descripción general:
# --------------------------------------------------------------------------------------
# Este módulo define la configuración principal de la aplicación Django llamada 
# "interfaz". 
#
# Su objetivo es registrar la aplicación dentro del proyecto general de Django 
# y controlar comportamientos específicos durante la inicialización, como 
# la configuración de señales, tareas automáticas o servicios de fondo.
#
# Django utiliza esta clase (AppConfig) para reconocer la aplicación como 
# un módulo instalado y para ejecutar cualquier código de configuración 
# necesario cuando el servidor arranca.
#
# Autora: Sara Hernández  
# ======================================================================================


# --------------------------------------------------------------------------------------
# Importación de la clase base AppConfig, que permite definir la configuración 
# personalizada de una aplicación Django.
# --------------------------------------------------------------------------------------
from django.apps import AppConfig


# --------------------------------------------------------------------------------------
# Clase principal de configuración de la app "interfaz".
# Hereda de AppConfig, lo cual permite especificar parámetros de configuración 
# y comportamientos al inicializar la aplicación.
# --------------------------------------------------------------------------------------
class InterfazConfig(AppConfig):
    # --------------------------------------------------------------------------
    # Define el tipo de campo automático predeterminado para las claves primarias
    # de los modelos dentro de esta aplicación. 
    # En este caso, 'BigAutoField' crea enteros grandes (64 bits), adecuados 
    # para bases de datos con muchos registros.
    # --------------------------------------------------------------------------
    default_auto_field = 'django.db.models.BigAutoField'

    # --------------------------------------------------------------------------
    # Nombre de la aplicación tal como está definida dentro del proyecto Django.
    # Este nombre debe coincidir con el que aparece en INSTALLED_APPS 
    # dentro del archivo settings.py del proyecto.
    # --------------------------------------------------------------------------
    name = 'interfaz'
