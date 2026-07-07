# ============================================================
# video_stream.py — Módulo para manejar el flujo RTSP de cámaras IP
# ============================================================
# Descripción general:
# Este módulo implementa la clase VideoCamera y un generador MJPEG
# para transmitir video en tiempo real desde cámaras Amcrest
# utilizando el protocolo RTSP. 
#
# Su función principal es mantener la conexión RTSP abierta, capturar los
# fotogramas de video en un hilo separado (thread) y codificarlos en formato JPEG.
# Los frames codificados se envían a través de Flask en un flujo MJPEG
# continuo (multipart/x-mixed-replace), compatible con navegadores web.
#
# Incluye mecanismos de:
# - Reconexión automática si se pierde la señal.
# - Control de frecuencia (FPS).
# - Reducción de latencia mediante buffer mínimo.
# - Acceso concurrente seguro con locks.
# ============================================================

#  Autor:  Sara Hernández
#  Colaboración técnica: ChatGPT (GPT-5)

# ------------------------------------------------------------
# Importación de bibliotecas necesarias
# ------------------------------------------------------------
import cv2  # Biblioteca OpenCV: permite capturar y procesar video
import threading  # Para ejecutar la captura en un hilo independiente
import time      # Para manejar pausas, tiempos y reconexiones

# ============================================================
# Clase principal: VideoCamera
# ============================================================
class VideoCamera:
    """
    Clase encargada de mantener activo el stream RTSP de una cámara.
    Permite reconexión automática y acceso seguro al frame más reciente.
    """

    def __init__(self, rtsp_url):
        self.rtsp_url = rtsp_url       # Guarda la URL RTSP (dirección de flujo de la cámara)       
        self.frame = None                     # Almacena último frame recibido
        self.running = False                  # Bandera que indica si el hilo de captura está activo o no
        self.lock = threading.Lock()          # Lock para para evitar conflictos entre hilos al acceder al frame
        self.thread = None                    # Referencia al hilo que ejecuta la captura
        self.cap = None                       # Objeto VideoCapture de OpenCV encargado de leer el flujo RTSP
        self.last_frame_time = 0              # Tiempo del último frame válido

    # ------------------------------------------------------------
    def start(self):
        """Inicia el hilo de lectura continua de la cámara."""
        # Si ya hay un hilo en ejecución, evita duplicar
        if self.running:
            print(f"Cámara {self.rtsp_url} ya está en ejecución.")
            return

        print(f" Iniciando hilo de cámara: {self.rtsp_url}")
        self.running = True  # Activa la bandera de ejecución
        # Crea e inicia un nuevo hilo que ejecuta la función _update()
        # El parámetro daemon=True permite que el hilo termine al cerrar el programa
        self.thread = threading.Thread(target=self._update, daemon=True)
        self.thread.start()

    # ------------------------------------------------------------
    def _open_stream(self):
        """Intenta abrir la conexión RTSP y configurar el buffer."""
        # Abre la transmisión RTSP usando el backend FFMPEG de OpenCV
        cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)

        # Si la conexión se abre correctamente:
        if cap.isOpened():
            # Reduce el tamaño del buffer a 1 frame (evita retrasos en transmisión)
            cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)
        return cap # Retorna el objeto VideoCapture (activo o no)

    # ------------------------------------------------------------
    def _update(self):
        """Hilo principal que mantiene el flujo RTSP activo."""
        reconnect_attempts = 0 # Contador de intentos de reconexión
        
        # Bucle principal de captura, activo mientras self.running sea True
        while self.running:
            self.cap = self._open_stream()  # Intenta abrir la conexión RTSP


             # Si no logra conectarse, espera 2 segundos y reintenta
            if not self.cap or not self.cap.isOpened():
                reconnect_attempts += 1
                print(f"No se pudo abrir cámara: {self.rtsp_url}. Reintentando ({reconnect_attempts})...")
                time.sleep(2)
                continue

            print(f" Conectado a {self.rtsp_url}")
             # Si la conexión se logra, reinicia el contador
            reconnect_attempts = 0

            # Bucle interno que lee frames mientras la cámara esté abierta
            while self.running and self.cap.isOpened():
                # Lee un frame del flujo RTSP
                ret, frame = self.cap.read()

                # Si no se recibe frame válido:
                if not ret:
                    # Si pasan más de 3s sin frame válido → reconecta
                    if time.time() - self.last_frame_time > 3:
                        print(f"Pérdida de señal en {self.rtsp_url}, intentando reconectar...")
                        break
                    # Espera corta y sigue intentando leer
                    time.sleep(0.05)
                    continue

                # Guarda el timestamp del último frame válido
                self.last_frame_time = time.time()

                # Redimensiona para transmisión más ligera 
                frame = cv2.resize(frame, (960, 540))

                # Guarda el frame de forma segura
                with self.lock:
                    self.frame = frame

                # Controla la frecuencia (~20 fps)
                time.sleep(0.05)

            # Fin del bucle interno → cerrar y reconectar
            self.cap.release()
            print(f" Reconectando a {self.rtsp_url}...")
            time.sleep(1)

        print(f"Hilo de cámara detenido: {self.rtsp_url}")

    # ------------------------------------------------------------
    def get_jpeg_frame(self):
        """Devuelve el último frame codificado como JPEG o None."""
        # Acceso protegido con lock (otro hilo podría estar escribiendo el frame)
        with self.lock:
            if self.frame is None:
                return None

             # Codifica el frame (matriz de OpenCV) a formato JPEG
            ret, jpeg = cv2.imencode(".jpg", self.frame, [cv2.IMWRITE_JPEG_QUALITY, 75])
            if not ret:
                return None
            # Devuelve el frame como secuencia de bytes
            return jpeg.tobytes()

    # ------------------------------------------------------------
    def stop(self):
        """Detiene la lectura de la cámara y libera recursos."""
        print(f" Deteniendo cámara: {self.rtsp_url}")
        self.running = False # Desactiva la bandera de ejecución
        # Libera la conexión con la cámara si está abierta
        if self.cap:
            self.cap.release()
        time.sleep(0.5) # Espera breve para garantizar cierre limpio

    # ------------------------------------------------------------
    def reconnect(self):
        """Fuerza una reconexión manual."""
        print(f"Reintentando conexión manual con {self.rtsp_url}")
        # Detiene la cámara y vuelve a iniciar tras una breve pausa
        self.stop()
        time.sleep(1)
        self.start()

    # ------------------------------------------------------------
    def ensure_alive(self):
        """Verifica que el RTSP siga activo; si no, reabre conexión."""
        # Intenta abrir una conexión temporal para comprobar estado
        test_cap = cv2.VideoCapture(self.rtsp_url, cv2.CAP_FFMPEG)
         # Si no logra abrir, significa que el RTSP cayó → reconecta
        if not test_cap.isOpened():
            print(f" RTSP inactivo en {self.rtsp_url}, reconectando...")
            self.reconnect()
        test_cap.release()


# ============================================================
# Generador MJPEG — estable y compatible con Waitress
# ============================================================
def mjpeg_generator(camera: VideoCamera):
    """
    Genera un flujo MJPEG continuo y estable a partir de un objeto VideoCamera.
    Convierte los frames JPEG en un stream HTTP tipo multipart/x-mixed-replace,
    usado comúnmente por navegadores para mostrar video en vivo.
    
    """
    print(f"Iniciando generador MJPEG para {camera.rtsp_url}")
    time.sleep(0.5)

    # Bucle que continúa mientras la cámara siga activa
    while camera.running:
        # Obtiene el frame actual codificado en JPEG
        frame = camera.get_jpeg_frame()

        # Si aún no hay frame disponible, espera y repite
        if frame is None:
            time.sleep(0.05)
            continue

        # Construye el bloque de bytes multipart/x-mixed-replace con el frame JPEG
        yield (
            b"--frame\r\n"
            b"Content-Type: image/jpeg\r\n\r\n" +
            frame + b"\r\n"
        )

        # Control de tasa de actualización 
        time.sleep(0.05)

    print(f" Finalizando MJPEG para {camera.rtsp_url}")

