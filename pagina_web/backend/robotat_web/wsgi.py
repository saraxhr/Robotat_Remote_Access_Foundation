"""
WSGI config for robotat_web project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/wsgi/
"""

# ======================================================================================
# Archivo: wsgi.py
# Ubicación: backend/robotat_web/
#
# Descripción general:
# --------------------------------------------------------------------------------------
# Este archivo define la configuración WSGI (Web Server Gateway Interface) para el
# proyecto Django "robotat_web". 
#
# WSGI es el estándar que permite la comunicación entre los servidores web (como
# Gunicorn o Apache) y las aplicaciones Django en entornos de producción.
#
# Aquí se crea la instancia "application", que será usada por el servidor web
# para servir el sitio Django en modo síncrono (HTTP tradicional).
#
# Autora: Sara Hernández 
# Colaborador: ChatGPT 
# ======================================================================================


# Importa el módulo os para manipular variables de entorno del sistema operativo
import os

# Importa la función que construye la aplicación WSGI de Django
from django.core.wsgi import get_wsgi_application

# Define la variable de entorno que indica dónde están las configuraciones del proyecto
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'robotat_web.settings')

# Crea la aplicación WSGI principal que será utilizada por el servidor web
application = get_wsgi_application()
