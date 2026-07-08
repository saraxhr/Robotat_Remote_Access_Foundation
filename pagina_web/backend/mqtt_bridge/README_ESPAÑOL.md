# 🔗 MQTT Bridge – Robotat UVG

## 📘 Descripción general

La carpeta **`mqtt_bridge`** implementa el **puente de comunicación MQTT-WebSocket** del sistema Robotat UVG.  
Su función principal es enlazar el **broker Mosquitto** con el **servidor Django (ASGI con Daphne)** y el **frontend web**, permitiendo transmitir datos en tiempo real desde los robots y el sistema de captura de movimiento.

El módulo opera en dos direcciones:
- **Recepción:** escucha mensajes MQTT (por ejemplo, telemetría o datos del MoCap) y los reenvía al frontend mediante WebSockets.
- **Emisión:** recibe comandos desde el backend Django y los publica hacia los robots (por ejemplo, Pololu o Crazyflie).

---

## ⚙️ Dependencias necesarias

Asegúrate de instalar las siguientes librerías antes de ejecutar el proyecto con **Daphne**:

```bash
pip install django djangorestframework channels channels_redis paho-mqtt daphne
```

> 💡 *`channels_redis` es necesaria si utilizas Redis como backend del Channel Layer para Django Channels.*

---

## 📂 Estructura de archivos

```
mqtt_bridge/
│
├── __init__.py        # Marca el paquete y enlaza la configuración MqttBridgeConfig.
├── apps.py            # Inicia automáticamente el cliente MQTT al arrancar el servidor Django.
├── mqtt_client.py     # Cliente MQTT principal (conexión, publicación y escucha de tópicos).
├── consumers.py       # Consumer asíncrono para reenviar mensajes a través de WebSockets.
├── routing.py         # Define las rutas WebSocket (por ejemplo, ws://<servidor>/ws/mqtt/).
└── ...
```

---

## 🧠 Funcionamiento general

### 🔹 1. Inicialización automática
Cuando el servidor Django se inicia con **Daphne**, la clase `MqttBridgeConfig` (definida en `apps.py`) ejecuta la función `start_mqtt_client()`, que:
- Conecta al broker Mosquitto.
- Se suscribe a los tópicos definidos (`mocap/#`, `pololu01/tel`, etc.).
- Lanza un hilo paralelo con `loop_forever()` para mantener la escucha activa.

### 🔹 2. Comunicación interna (MQTT → Channels)
Cada mensaje MQTT recibido se envía al *channel layer* de Django mediante:

```python
async_to_sync(channel_layer.group_send)(
    "mqtt_logs",
    {"type": "mqtt_message", "topic": msg.topic, "payload": payload}
)
```

Luego, el **consumer** `MqttConsumer` escucha estos eventos y los transmite a los clientes WebSocket conectados.

### 🔹 3. Comunicación inversa (Django → MQTT)
Desde el backend (por ejemplo, el endpoint `/api/enviar-comando/`), los comandos se publican hacia los robots usando:

```python
from mqtt_bridge.mqtt_client import publish_command
publish_command(packet)
```

---

## 🔧 Ejecución del servidor

El proyecto usa **Daphne** como servidor ASGI, compatible con Django Channels y WebSockets.

Ejecuta el backend desde la raíz del proyecto:

```bash
daphne -p 8000 robotat_web.asgi:application
```

> 📌 Reemplaza `robotat_web` por el nombre del módulo raíz del proyecto que contenga `asgi.py`.

El servidor se levantará por defecto en  
👉 `http://127.0.0.1:8000/`

---

## 🌐 Rutas WebSocket

| Ruta | Descripción |
|------|--------------|
| `/ws/mqtt/` | Canal WebSocket que recibe en tiempo real los mensajes reenviados por el cliente MQTT. |

Ejemplo de conexión desde el frontend (JavaScript):

```javascript
const socket = new WebSocket("ws://127.0.0.1:8000/ws/mqtt/");

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log("Mensaje MQTT recibido:", data);
};
```

---

## 🛰️ Parámetros del cliente MQTT

| Parámetro | Descripción | Valor por defecto |
|------------|--------------|------------------|
| `BROKER` | IP del broker Mosquitto | `Insertar IP` |
| `PORT` | Puerto MQTT | `1880` |
| `TOPIC` | Suscripción general (MoCap) | `"mocap/#"` |
| `COMMAND_TOPIC` | Tópico de comandos al Pololu | `"pololu01/cmd"` |
| `TELEMETRY_TOPIC` | Tópico de telemetría del Pololu | `"pololu01/tel"` |

---

## 📤 Ejemplo de publicación MQTT

```python
packet = {
    "src": 1,
    "pts": 5,
    "ptp": 10,
    "pid": 3,
    "cks": "a1b2c3",
    "pld": {"v_l": 0.2, "v_r": 0.2}
}

from mqtt_bridge.mqtt_client import publish_command
publish_command(packet)
```

---

## 🧩 Integración con Channels

El archivo `routing.py` define las rutas WebSocket para esta app, mientras que el `asgi.py` principal las integra con el enrutador global del proyecto:

```python
from channels.routing import ProtocolTypeRouter, URLRouter
from mqtt_bridge.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    "websocket": URLRouter(websocket_urlpatterns),
})
```

---
