# -*- coding: utf-8 -*-
# ============================================================
# views.py — Vistas Django para el control y monitoreo de cámaras IP
# ============================================================
# Descripción general:
# Este archivo define las vistas HTTP (endpoints) que permiten al sistema Django
# comunicarse con las cámaras IP del Robotat. 
#
# Estas vistas cumplen tres funciones principales:
#   1. Consultar si una cámara está conectada (online/offline).
#   2. Enviar comandos de movimiento PTZ (Pan, Tilt, Zoom, Home).
#   3. (Opcional) Incluir transmisión MJPEG — reemplazada por Flask.
#
# Las vistas están protegidas mediante decoradores que restringen los métodos HTTP
# permitidos (GET o POST) y manejan el acceso CSRF cuando es necesario.
# También se utilizan solicitudes HTTP Digest Authentication para comunicarse 
# de forma segura con las cámaras Amcrest.
# ============================================================

#  Autor:  Sara Hernández
#  Colaboración técnica: ChatGPT (GPT-5)

# ------------------------------------------------------------
# Importación de librerías estándar
# ------------------------------------------------------------
import time  # Para pausas breves entre comandos PTZ
import json  # Para decodificar el cuerpo de las solicitudes POST (JSON)
import requests  # Librería para realizar peticiones HTTP a las cámaras
from requests.auth import HTTPDigestAuth  # Mecanismo de autenticación segura (Digest)

# ------------------------------------------------------------
# Importación de herramientas propias de Django
# ------------------------------------------------------------
from django.http import (
    StreamingHttpResponse, # Permitiría transmisión MJPEG (no usada actualmente)
    JsonResponse,  # Devuelve respuestas JSON (formato clave-valor)
    HttpResponseBadRequest  #Devuelve código 400 si la solicitud es inválida
)
from django.views.decorators.http import require_http_methods # Restringe los métodos HTTP permitidos (GET, POST)
from django.views.decorators.csrf import csrf_exempt # Desactiva verificación CSRF en endpoints específicos
from django.views.decorators.clickjacking import xframe_options_exempt # (No usada aquí, pero disponible)
from django.views.decorators.gzip import gzip_page # (No usada, útil si se quisiera comprimir respuestas)


# ------------------------------------------------------------
# Importación del archivo de configuración local (IPs y credenciales)
# ------------------------------------------------------------

from .config import CAMERAS


# ===========================================================
# Funciones auxiliares
# ===========================================================
def _get_cam(cam_id):
    """
    Busca y devuelve el diccionario de configuración correspondiente
    a una cámara específica, según su ID lógico.
    Ejemplo:
        _get_cam("1") -> devuelve CAMERAS["1"]

    """
    return CAMERAS.get(str(cam_id))  # Convierte el ID a string para evitar errores de tipo

# ============================================================
# VISTA 1: ESTADO ONLINE/OFFLINE
# ============================================================

@require_http_methods(["GET"]) # Solo permite solicitudes HTTP GET
def status_view(request, cam_id):
    """
     Endpoint: GET /api/cameras/<id>/status/
    ------------------------------------------------------------
    Función:
        Consulta si una cámara IP está activa (respondiendo a peticiones HTTP).
    Retorna:
        {"online": true}  si responde correctamente.
        {"online": false} si no hay conexión o falla la autenticación.
    """
     # Busca la cámara solicitada
    cam = _get_cam(cam_id)
    if not cam:
        # Si el ID no existe en config.py, devuelve error HTTP 400
        return HttpResponseBadRequest("Cámara no encontrada")

     # Extrae datos de conexión desde el diccionario de configuración
    ip = cam["ip"]
    user = cam["user"]
    pwd = cam["password"]

    # Endpoint interno de las cámaras Amcrest que devuelve información del sistema
    url = f"http://{ip}/cgi-bin/magicBox.cgi"
    # Parámetro que solicita información básica del dispositivo
    params = {"action": "getSystemInfo"}

    try:
         # Envía solicitud GET autenticada por Digest Auth
        r = requests.get(url, params=params, auth=HTTPDigestAuth(user, pwd), timeout=1.5)
        # Si la cámara responde con código 200, se considera "online"
        online = (r.status_code == 200)
    except Exception:
        # Si la cámara responde con código 200, se considera "online"
        online = False

    return JsonResponse({"online": online})


# ============================================================
# VISTA 2: CONTROL PTZ (PAN, TILT, ZOOM, HOME)
# ============================================================
@csrf_exempt  # Desactiva CSRF porque este endpoint recibe comandos externos
@require_http_methods(["POST"])  # Solo permite solicitudes HTTP POST

def ptz_view(request, cam_id):
    """
    Endpoint: POST /api/cameras/<id>/ptz/
    ------------------------------------------------------------
    Función:
        Envía comandos PTZ (movimiento de cámara) hacia una cámara IP Amcrest.
    Entrada esperada (JSON):
        { "cmd": "up|down|left|right|home", "speed": 1..7 }
    Retorna:
        {"ok": true} si el comando fue ejecutado correctamente.
        {"ok": false, "error": "..."} si hubo error de conexión o autenticación.
    """
      # Verifica que el ID de cámara exista
    cam = _get_cam(cam_id)
    if not cam:
        return HttpResponseBadRequest("Cámara no encontrada")
    
     # ------------------------------------------------------------
    # Decodificación del cuerpo JSON recibido en la solicitud
    # -----------------------------------------------------------

    try:
        data = json.loads(request.body or "{}") # Convierte JSON en diccionario Python
        cmd = str(data.get("cmd", "")).lower()  # Convierte el comando a minúsculas
        speed = int(data.get("speed", 4))       #Velocidad por defecto 4
    except Exception:
        # Si ocurre un error en el formato JSON, devuelve error 400
        return HttpResponseBadRequest("JSON inválido")
    
    # ------------------------------------------------------------
    # Mapeo de comandos lógicos → comandos reales Amcrest
    # ------------------------------------------------------------
    mapping = {
        "up": "Up",
        "down": "Down",
        "left": "Left",
        "right": "Right",
        "home": "Home",
        "center": "Home",
        "reset": "Home",
    }

    # Busca el comando real
    code = mapping.get(cmd)
    if not code:
        # Si el comando no está en el mapeo, devuelve error
        return HttpResponseBadRequest("Comando PTZ no soportado")

    # ------------------------------------------------------------
    # Construcción de la solicitud HTTP hacia la cámara Amcrest
    # ------------------------------------------------------------
    ip = cam["ip"]
    user = cam["user"]
    pwd = cam["password"]
    # URL del endpoint PTZ propio de las cámaras Amcrest
    url = f"http://{ip}/cgi-bin/ptz.cgi"

    # Comando de inicio ("start"): indica dirección, canal y velocidad
    start = {"action": "start", "channel": 0, "code": code, "arg1": 0, "arg2": speed, "arg3": 0}

    # Comando de parada ("stop"): detiene el movimiento
    stop  = {"action": "stop",  "channel": 0, "code": code, "arg1": 0, "arg2": speed, "arg3": 0} 

    # ------------------------------------------------------------
    # Ejecución de los comandos en la cámara
    # ------------------------------------------------------------
    try:
        # Envía el comando "start" para comenzar el movimiento PTZ 
        requests.get(url, params=start, auth=HTTPDigestAuth(user, pwd), timeout=1.5)

         # Si el comando no es "Home", espera 0.25s y 
         # luego detiene el movimiento (no aplica para estas cámaras
         #ya que no tienen zoom ni home, pero está esta funcionalidad
         # por si se cambia de cámaras en el futuro y se desea agregar)
        if code != "Home":
            time.sleep(0.25)
            requests.get(url, params=stop, auth=HTTPDigestAuth(user, pwd), timeout=1.5)
        return JsonResponse({"ok": True})
    # Envía comando "stop" para detener el movimiento
    except Exception as e:
        return JsonResponse({"ok": False, "error": str(e)}, status=500)

