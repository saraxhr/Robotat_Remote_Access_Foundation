# 🎥 Microservidor Flask — Transmisión de Video MJPEG (Robotat UVG)

## 📘 Descripción general
La carpeta **`flask_video_server/`** implementa un **microservidor Flask** encargado de transmitir video en vivo desde múltiples cámaras IP Amcrest mediante el protocolo **MJPEG**.

Su función principal es permitir la **visualización en tiempo real** desde navegadores o interfaces web, de forma **independiente al backend Django**, optimizando rendimiento y estabilidad mediante hilos y el servidor **Waitress**.

---

## ⚙️ Estructura de la carpeta

```
flask_video_server/
│
├── app.py              → Servidor Flask que maneja los endpoints de streaming y control.
├── config.py           → Archivo con la configuración (IP, usuario, contraseña y RTSP) de las cámaras.
└── video_stream.py     → Clase principal `VideoCamera` que gestiona la captura, reconexión y codificación JPEG.
```

---

## 🧩 Librerías necesarias

Antes de ejecutar el servidor, instala las siguientes dependencias:

```bash
pip install flask waitress opencv-python numpy
```

| Librería | Uso principal |
|-----------|----------------|
| **Flask** | Framework liviano usado para crear el servidor HTTP que transmite los flujos de video. |
| **Waitress** | Servidor WSGI de producción; mantiene las conexiones MJPEG activas de forma estable. |
| **OpenCV (`cv2`)** | Captura los fotogramas RTSP desde las cámaras y los codifica en formato JPEG. |
| **NumPy** | Biblioteca requerida por OpenCV para manejar matrices de píxeles. |
| **Threading** | Módulo estándar de Python para crear hilos y manejar múltiples cámaras simultáneamente. |
| **Time** | Controla la frecuencia de lectura de frames y tiempos de reconexión. |

---

## 🧱 Archivos y su función

### 📄 `app.py`
Es el archivo principal del microservidor Flask.  
Permite iniciar el servidor, manejar los endpoints HTTP y controlar los flujos de video MJPEG.

#### 📦 Funciones principales:
- **`generate_stream(cam_id)`**: Genera el flujo MJPEG estable (30 FPS aprox.) de una cámara específica.
- **`/camera/<id>`**: Entrega el video MJPEG en tiempo real.
- **`/status`**: Devuelve un JSON con el estado de todas las cámaras activas.
- **`/stop/<id>`**: Permite detener manualmente una cámara y liberar memoria.

#### 🚀 Ejecución del servidor Flask
Para iniciar el servidor, ejecuta el siguiente comando dentro de la carpeta `flask_video_server`:

```bash
python app.py
```

Esto iniciará el servidor con **Waitress** en el puerto **5000** y disponible en todas las interfaces de red:

```
Servidor Flask de video iniciado con Waitress en http://0.0.0.0:5000
```

Puedes acceder al stream desde un navegador con la URL:
```
http://localhost:5000/camera/1
```

*(Reemplaza `1` por el ID lógico de la cámara definido en `config.py`.)*

---

### ⚙️ `config.py`
Contiene la configuración de las cámaras Amcrest disponibles, incluyendo credenciales y URLs RTSP.

Ejemplo:

```python
CAMERAS = {
    "1": {
        "ip": "192.168.50.211",
        "user": "admin",
        "password": "UVG12345678",
        "rtsp": "rtsp://admin:UVG12345678@192.168.50.211:554/cam/realmonitor?channel=1&subtype=1",
    },
    "2": {
        "ip": "192.168.50.212",
        "user": "admin",
        "password": "12345678UVG",
        "rtsp": "rtsp://admin:12345678UVG@192.168.50.212:554/cam/realmonitor?channel=1&subtype=1",
    },
}
```

📌 **Notas:**
- `subtype=1` corresponde al **substream** (flujo de menor resolución), ideal para transmisión fluida con bajo ancho de banda.  
- Puedes agregar más cámaras copiando y pegando la estructura con IDs `"3"`, `"4"`, etc.  
- Los datos aquí definidos son importados automáticamente en `app.py`.

---

### 🎞️ `video_stream.py`
Define la clase **`VideoCamera`**, encargada de manejar las conexiones RTSP y la codificación JPEG.  
Se ejecuta en hilos independientes para cada cámara activa.

#### 🔹 Funciones principales:
- **`start()`** → Inicia el hilo que mantiene el flujo RTSP abierto.  
- **`_update()`** → Captura frames continuamente, maneja reconexiones automáticas y controla la frecuencia (20 FPS aprox.).  
- **`get_jpeg_frame()`** → Devuelve el último frame en formato JPEG listo para enviar por HTTP.  
- **`stop()`** → Detiene el hilo y libera recursos.  
- **`reconnect()`** → Reintenta conexión manualmente.  
- **`ensure_alive()`** → Verifica el estado del stream RTSP y fuerza reconexión si es necesario.

También incluye un generador independiente **`mjpeg_generator(camera)`** que transforma los frames en un flujo MJPEG compatible con navegadores.

---

## 🧩 Librerías utilizadas en los archivos

### 📜 `app.py`
```python
from flask import Flask, Response, jsonify
from video_stream import VideoCamera
from config import CAMERAS
import threading
import time
from waitress import serve  # Se usa al ejecutar el servidor
```

### 📜 `video_stream.py`
```python
import cv2
import threading
import time
import numpy as np  # Importada de manera implícita por OpenCV
```

Estas librerías permiten:
- Crear el servidor (`Flask` y `Waitress`).
- Capturar video (`OpenCV`).
- Ejecutar múltiples cámaras en paralelo (`threading`).
- Controlar la tasa de refresco y reconexión (`time`).

---
## 🚀 Ejecución del servidor

Para iniciar el microservidor Flask y habilitar la transmisión MJPEG, ejecuta en la terminal desde la carpeta `flask_video_server`:

```bash
python app.py

```

---
## 📡 Endpoints disponibles

| Endpoint | Método | Descripción |
|-----------|---------|--------------|
| `/camera/<id>` | `GET` | Devuelve el video MJPEG de la cámara seleccionada. |
| `/status` | `GET` | Muestra el estado de todas las cámaras activas y sus IPs. |
| `/stop/<id>` | `GET` | Detiene una cámara y libera sus recursos. |

**Ejemplo de uso:**
```bash
# Ver transmisión en navegador
http://localhost:5000/camera/1

# Consultar estado
http://localhost:5000/status

# Detener cámara
http://localhost:5000/stop/1
```

---

## 🧰 Requisitos del sistema

| Componente | Versión recomendada |
|-------------|---------------------|
| **Python** | 3.9 o superior |
| **Flask** | 3.0+ |
| **Waitress** | 3.0+ |
| **OpenCV** | 4.9+ |
| **NumPy** | 1.25+ |

---

## ⚙️ Notas técnicas

- Cada cámara corre en un hilo independiente, evitando bloqueos del servidor.  
- Si una cámara pierde conexión, el sistema intenta reconectarla automáticamente.  
- La salida MJPEG se envía con el tipo MIME `multipart/x-mixed-replace`, compatible con navegadores y etiquetas `<img>`.  
- `Waitress` evita que el servidor cierre las conexiones de video tras 1 segundo, como ocurre con el servidor de desarrollo de Flask.  
- Se recomienda usar resoluciones moderadas (por ejemplo, 960x540) para reducir el ancho de banda.

---



