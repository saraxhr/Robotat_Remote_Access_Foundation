"""
=====================================================================
Archivo: consumers.py
Ubicación: mqtt_bridge/

Descripción general:
--------------------
Este módulo define el WebSocket consumer responsable de enviar en tiempo real 
los datos provenientes del cliente MQTT al frontend. Forma parte de la 
arquitectura basada en Django Channels.

El flujo completo es el siguiente:
  1. El archivo `mqtt_client.py` escucha mensajes en el broker MQTT.
  2. Cada vez que llega un nuevo mensaje, `mqtt_client.py` lo envía al 
     "channel layer" (capa de comunicación interna de Django Channels).
  3. Este consumer (`MqttConsumer`) recibe esos mensajes desde el canal 
     interno y los reenvía a todos los clientes WebSocket conectados.
  4. El frontend (por ejemplo, React) recibe los datos en formato JSON y los 
     muestra en tiempo real (telemetría, estado de robots, etc.).

Además, este consumer también puede recibir peticiones desde el frontend, 
como por ejemplo la solicitud de la lista de tópicos MQTT activos.
=====================================================================
"""
#  Autor:  Sara Hernández
#  Colaboración técnica: ChatGPT (GPT-5)

# ================================================================
# Bibliotecas necesarias
# ================================================================

import json  # Para decodificar y codificar datos JSON
from datetime import datetime  # Para formatear timestamps legibles
from channels.generic.websocket import AsyncWebsocketConsumer  # Base para Consumers asíncronos de Django Channels
from .mqtt_client import detected_topics  # Conjunto global de tópicos detectados en tiempo real por mqtt_client.py


# ================================================================
# Mapeos de códigos numéricos a texto legible
# ---------------------------------------------------------------
# Estos diccionarios permiten traducir los códigos recibidos en los paquetes
# MQTT (por ejemplo, src=10) a nombres descriptivos (por ejemplo, "POLOLU_00").
# Esto facilita la interpretación en el frontend.
# ================================================================

SOURCE_MAP = {
    0:  "ROBOTAT_SERVER",
    1:  "USER_PC",
    **{i: f"POLOLU_{i-10:02d}" for i in range(10, 43)},  # Rango 10–42 → POLOLU_00 a POLOLU_32
    **{i: f"CRAZYFLIE_{i-50:02d}" for i in range(50, 71)},
    **{i: f"MAXARM_{i-80:02d}" for i in range(80, 101)},
}

# Tipo de paquete (DATA, COMMAND, MOCAP)
PACKET_TYPE_MAP = {0: "DATA", 1: "COMMAND", 2: "MOCAP"}


# Identificadores específicos de comandos o estados
PACKET_ID_MAP = {
    0: "STATE",
    1: "SENSOR",
    2: "MESSAGE",
    10: "FORCE_STOP",
    11: "FORWARD",
    12: "BACKWARD",
    13: "LEFT",
    14: "RIGHT",
}


# ================================================================
# Clase principal del consumer — comunicación WebSocket asíncrona
# ================================================================
class MqttConsumer(AsyncWebsocketConsumer):
    """
    Consumer asíncrono de Django Channels que maneja la comunicación
    WebSocket entre el servidor Django y el frontend.
    
    - Recibe mensajes MQTT reenviados por mqtt_client.py.
    - Envía esos mensajes al navegador de cada cliente conectado.
    - También recibe solicitudes desde el frontend (por ejemplo, "list_topics").
    """

    # ------------------------------------------------------------
    # Método que se ejecuta al establecer la conexión WebSocket
    # ------------------------------------------------------------
    async def connect(self):
        """Se ejecuta cuando un cliente WebSocket se conecta al servidor."""
        # Nombre del grupo de comunicación interno en el que todos los clientes
        # recibirán los mensajes MQTT (broadcast group).
        self.group_name = "mqtt_logs"

        # Agrega este cliente al grupo
        await self.channel_layer.group_add(self.group_name, self.channel_name)

        # Acepta la conexión WebSocket entrante
        await self.accept()

        # Mensaje de depuración en consola
        print("[WS] Cliente conectado al canal MQTT.")


    # ------------------------------------------------------------
    # Método que se ejecuta al desconectarse un cliente
    # ---------------------------------------------------------

    async def disconnect(self, close_code):
        """Se ejecuta cuando el cliente WebSocket se desconecta."""
        # Elimina este cliente del grupo de broadcast
        await self.channel_layer.group_discard(self.group_name, self.channel_name)


         # Elimina este cliente del grupo de broadcast
        print("[WS] Cliente desconectado del canal MQTT.")
    
    # ------------------------------------------------------------
    # Método que procesa los mensajes enviados desde el frontend
    # ------------------------------------------------------------

    async def receive(self, text_data):
        """Procesa los mensajes entrantes desde el frontend (formato JSON)."""
        data = json.loads(text_data)

        # --- Si el frontend pide la lista de tópicos activos ---
        if data.get("action") == "list_topics":
            # Convierte el set global a lista ordenada
            topics = sorted(list(detected_topics))

            # Envía la lista al cliente en formato JSON
            await self.send(text_data=json.dumps({
                "type": "topics_list",
                "topics": topics
            }))
            return

        # --- Si el mensaje no coincide con ninguna acción conocida ---
        else:
            print(f"[WS] Acción desconocida recibida: {data}")

    # ------------------------------------------------------------
    # Método llamado automáticamente cuando mqtt_client.py publica 
    # un mensaje en el grupo de canales (event type = 'mqtt_message').
    # ------------------------------------------------------------
    async def mqtt_message(self, event):
        """Procesa los mensajes MQTT y los envía al frontend."""
        # Extrae el tópico y el payload del evento
        topic = event.get("topic", "")  
        payload_raw = event.get("payload", "")

        # --------------------------------------------------------
        # Decodificación segura del mensaje JSON
        # --------------------------------------------------------

        try:
            payload_decoded = json.loads(payload_raw)
        except Exception:
            # Si no se puede decodificar, se guarda el contenido crudo
            payload_decoded = {"raw": payload_raw}

        # --------------------------------------------------------
        # Extracción de campos del paquete
        # --------------------------------------------------------
        src = payload_decoded.get("src") #Fuente
        ptp = payload_decoded.get("ptp") #Tipo de paquete
        pid = payload_decoded.get("pid") #ID de mensaje o comando 
        pts = payload_decoded.get("pts") # Timestamp
        cks = payload_decoded.get("cks", "") #Checksum

        # --------------------------------------------------------
        # Traducción de códigos numéricos a texto descriptivo
        # --------------------------------------------------------
        if src in SOURCE_MAP:
            payload_decoded["src"] = SOURCE_MAP[src]
        if ptp in PACKET_TYPE_MAP:
            payload_decoded["ptp"] = PACKET_TYPE_MAP[ptp]
        if pid in PACKET_ID_MAP:
            payload_decoded["pid"] = PACKET_ID_MAP[pid]

        # === Timestamp ===
        try:
            payload_decoded["pts"] = datetime.utcfromtimestamp(pts).strftime("%Y-%m-%d %H:%M:%S")
        except Exception:
            payload_decoded["pts"] = str(pts)

        # --------------------------------------------------------
        # Reducción del tamaño del checksum (si es demasiado largo)
        # -------------------------------------------------------
        if isinstance(cks, str) and len(cks) > 12:
            payload_decoded["cks"] = f"{cks[:8]}…{cks[-4:]}" # Muestra los primeros 8 y últimos 4 caracteres


        # --------------------------------------------------------
        # Construcción del mensaje final a enviar al frontend
        # --------------------------------------------------------
        data = {
            "type": "mqtt_message", # Tipo de evento (para el frontend)
            "topic": topic,  # Tópico MQTT original
            "packet": payload_decoded,  #Datos decodificados y formateados
        }

        # Envía el mensaje JSON al cliente WebSocket correspondiente
        await self.send(text_data=json.dumps(data, ensure_ascii=False, separators=(',', ':')))

