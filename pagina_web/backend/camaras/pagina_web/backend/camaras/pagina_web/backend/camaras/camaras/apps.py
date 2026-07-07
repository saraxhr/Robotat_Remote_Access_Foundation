# ============================================================
# apps.py — Configuración de la aplicación Django "camaras"
# ============================================================
# Descripción general:
# Este archivo define la configuración interna de la aplicación Django
# encargada del control y monitoreo de cámaras  dentro del proyecto.
#
# Django utiliza clases derivadas de `AppConfig` para registrar e inicializar
# cada aplicación que forma parte del proyecto. 
# Aquí se establece el nombre del módulo ("camaras") y se define el tipo
# de campo automático por defecto que se usará en modelos de base de datos
# (aunque en este caso la app no tiene modelos, es buena práctica mantenerlo).
# ============================================================

#  Autor:  Sara Hernández
#  Colaboración técnica: ChatGPT (GPT-5)

# ------------------------------------------------------------
# Importación del módulo base de configuración de apps en Django
# ------------------------------------------------------------
from django.apps import AppConfig

# ============================================================
# Clase principal de configuración de la app
# ============================================================
class CamarasConfig(AppConfig):
    """
    Clase que configura la aplicación Django llamada 'camaras'.
    Esta clase se carga automáticamente cuando Django inicia el servidor.
    """
    # --------------------------------------------------------
    # Define el tipo de campo automático por defecto para
    # los modelos (en caso de que se creen en el futuro).
    # 'BigAutoField' crea claves primarias (id).
    # --------------------------------------------------------
    default_auto_field = 'django.db.models.BigAutoField'

    # --------------------------------------------------------
    # Nombre interno de la aplicación (debe coincidir con el
    # nombre de la carpeta donde se encuentra este archivo).
    # Django utiliza este nombre para identificar el paquete
    # dentro de INSTALLED_APPS en settings.py.
    # -------------------------------------------------------
    name = 'camaras'

