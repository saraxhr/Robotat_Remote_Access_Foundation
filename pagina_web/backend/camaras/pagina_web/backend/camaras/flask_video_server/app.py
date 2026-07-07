# ============================================================
# app.py — Servidor Flask optimizado para transmisión MJPEG de cámaras IP
# ============================================================
#  Descripción general:
# Este script implementa un microservidor Flask encargado de entregar video en vivo
# desde múltiples cámaras Amcrest, utilizando el protocolo MJPEG.
#
# - Flask actúa como servidor HTTP que gestiona las rutas de video y control.
# - Cada cámara es manejada por una instancia de la clase VideoCamera (definida en video_stream.py),
#   la cual se encarga de abrir el flujo RTSP, capturar los frames y mantener la conexión activa.
# - El servidor usa un mecanismo de threading (multihilos) para poder manejar múltiples
#   cámaras simultáneamente sin bloquear el backend principal (Django).
# - Se utiliza Waitress como servidor WSGI en producción, ya que Flask por sí solo
#   corta las conexiones MJPEG tras ~1 segundo
# ============================================================
#  Autor:  Sara Hernández
#  Colaboración técnica: ChatGPT (GPT-5)

# ------------------------------------------------------------
# Importación de librerías
# ------------------------------------------------------------

from flask import Flask, Response, jsonify # Flask: framework web liviano para crear el microservidor
from video_stream import VideoCamera   # Clase que gestiona el flujo RTSP de cada cámara
from config import CAMERAS  # Diccionario con la configuración de cámaras (IP, usuario, RTSP, etc.)
import threading  # Permite crear hilos independientes por cámara
import time  # Se usa para controlar la tasa de refresh y pausas breves

# ------------------------------------------------------------
# Inicializa la aplicación Flask
# ------------------------------------------------------------
app = Flask(__name__)   # Crea la instancia principal de la aplicación Flask

# Diccionarios globales con las cámaras activas y sus locks
cameras = {}  # Almacena los objetos VideoCamera activos por ID de cámara
camera_locks = {}  # Almacena Locks por cámara para acceso seguro a frames

# ============================================================
# Función: generate_stream(cam_id)
# ============================================================
# Esta función se encarga de generar un flujo MJPEG continuo
# que envía imágenes JPEG una tras otra (multipart/x-mixed-replace)
# para ser mostradas en un navegador o interfaz que soporte streaming.
# ============================================================
def generate_stream(cam_id):
    """Genera un flujo MJPEG estable (~30 FPS) para la cámara solicitada."""
     # Obtiene el objeto VideoCamera correspondiente al ID solicitado
    cam = cameras.get(cam_id)
    # Obtiene el Lock asociado a esa cámara (para acceso seguro)
    lock = camera_locks.get(cam_id)

    print(f"Iniciando stream MJPEG estable para cámara {cam_id}")

    try:
        # Bucle infinito mientras el cliente mantenga la conexión abierta
        while True:
            # ------------------------------------------------------------
            # Captura el frame actual de manera segura usando el Lock
            # (esto evita que otro hilo modifique el frame mientras se lee)
            # ------------------------------------------------------------
            with lock:
                frame = cam.get_jpeg_frame()  # Obtiene el frame actual codificado en JPEG

            # Si todavía no hay frame disponible (la cámara acaba de iniciar)
            if frame is None:
                # Si aún no hay frame, espera breve y continúa
                time.sleep(0.03)
                continue

            # ------------------------------------------------------------
            # Construye la respuesta HTTP tipo multipart/x-mixed-replace
            # Cada bloque representa un frame JPEG independiente
            # ------------------------------------------------------------
            yield (
                b"--frame\r\n"  # Separador entre frames
                b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n" # Especifica tipo de contenido
            )

            # Control de tasa de actualización (~30 FPS)
            time.sleep(0.03)

    except GeneratorExit:
        # Este bloque se ejecuta automáticamente cuando el cliente (por ejemplo, un navegador)
        # cierra la conexión o cambia de página. Es útil para liberar recursos.
        print(f"Cliente cerró conexión MJPEG de cámara {cam_id}")
        return


# ============================================================
# Ruta: /camera/<id>
# ============================================================
# Endpoint principal del servidor Flask.
# Cuando un cliente accede a /camera/<id>, se inicia (si es necesario)
# el hilo de lectura RTSP de esa cámara y se devuelve su flujo MJPEG.
# ============================================================

@app.route("/camera/<cam_id>")
def stream_camera(cam_id):
    """Entrega el stream MJPEG para la cámara indicada."""
    # ----------------------------------------------------------------
    # Validación: comprobar que el ID solicitado exista en config.py
    # ----------------------------------------------------------------
    
    if cam_id not in CAMERAS:          # Si la cámara no está registrada en config.py → error 404
        return jsonify({"error": "Cámara no encontrada"}), 404

    # Si la cámara aún no tiene hilo activo → se inicializa
    if cam_id not in cameras:
        rtsp_url = CAMERAS[cam_id]["rtsp"] # Obtiene la URL RTSP desde el archivo config.py
        print(f" Conectando cámara {cam_id}: {rtsp_url}") 
        cam = VideoCamera(rtsp_url)  # Crea el objeto VideoCamera asociado al flujo RTSP
        cam.start()  # Inicia el hilo interno que mantiene la conexión RTSP

        # Guarda la instancia activa y su Lock asociado en los diccionarios globales
        cameras[cam_id] = cam
        camera_locks[cam_id] = threading.Lock()

    # ----------------------------------------------------------------
    # Devuelve la respuesta HTTP en formato de streaming MJPEG
    # ----------------------------------------------------------------
    return Response(
         # Llama al generador de frames MJPEG correspondiente
        generate_stream(cam_id),
         # Especifica el tipo MIME que indica flujo continuo de imágenes
        mimetype="multipart/x-mixed-replace; boundary=frame",
        # Cabeceras adicionales para evitar cacheo y permitir acceso CORS
        headers={
    "Cache-Control": "no-cache, no-transform",
    "Pragma": "no-cache",
    "Access-Control-Allow-Origin": "*",
},

    )


# ============================================================
# Ruta: /status
# ============================================================
# Devuelve un resumen JSON con el estado de todas las cámaras activas:
# - Si están corriendo
# - Su dirección IP configurada
# Este endpoint es útil para paneles de monitoreo o diagnósticos.
# ============================================================


@app.route("/status")
def status():
    """Devuelve un resumen JSON de las cámaras activas y su IP."""
     # Crea un diccionario con datos resumidos de cada cámara activa
    return jsonify({
        cid: {"active": cam.running, "url": CAMERAS[cid]["ip"]} 
        for cid, cam in cameras.items()  # Recorre todas las cámaras activas
    })


# ============================================================
# Ruta: /stop/<id>
# ============================================================
# Permite detener manualmente una cámara y liberar sus recursos.
# Este endpoint es opcional y útil para pruebas o administración manual.
# ============================================================


@app.route("/stop/<cam_id>")
def stop_camera(cam_id):
    """Detiene la cámara indicada y libera recursos."""
    # Si la cámara existe en el diccionario global de cámaras activas
    # Llama al método stop() de VideoCamera → cierra RTSP y libera memoria
    if cam_id in cameras:
        cameras[cam_id].stop()
         # Elimina sus referencias de los diccionarios globales
        del cameras[cam_id]
        del camera_locks[cam_id]
        # Devuelve una respuesta JSON confirmando la acción
        return jsonify({"status": f"Cámara {cam_id} detenida"}), 200
    
    # Si no se encuentra la cámara, devuelve un error 404
    return jsonify({"error": "Cámara no encontrada"}), 404


# ============================================================
# Bloque principal — Inicio del servidor Flask con Waitress
# ============================================================
# Este bloque solo se ejecuta si el archivo se ejecuta directamente
# (por ejemplo, con `python app.py`). Si se importa como módulo, no se ejecuta.
# Waitress se usa en lugar del servidor de desarrollo de Flask para
# mantener las conexiones HTTP abiertas indefinidamente, ya que
# Flask DevServer cierra streams MJPEG tras 1 segundo.
# ============================================================

if __name__ == "__main__":
    # IMPORTANTE:
    # Flask en modo desarrollo corta las conexiones MJPEG después de 1s.
    # Waitress mantiene conexiones HTTP persistentes y es ideal para producción.
    from waitress import serve
    print("Servidor Flask de video iniciado con Waitress en http://0.0.0.0:5000")

    # Inicia el servidor en todas las interfaces de red (0.0.0.0)
    # Esto permite que otros dispositivos dentro de la red local accedan al stream.
    # Puerto configurado en 5000 (puede modificarse si se necesita)
    serve(app, host="0.0.0.0", port=5000)

