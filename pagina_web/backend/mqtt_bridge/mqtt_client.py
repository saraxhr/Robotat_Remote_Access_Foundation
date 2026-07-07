"""
=====================================================================
Archivo: mqtt_client.py
Ubicación: mqtt_bridge/

Descripción general:
--------------------
Este módulo implementa el cliente MQTT que sirve como puente entre el 
broker Mosquitto y el servidor Django. Su función es bidireccional:

1. **Escuchar mensajes**:
   - Se suscribe a los tópicos del sistema de captura de movimiento (MoCap).
   - Escucha la telemetría publicada por los robots (por ejemplo, Pololu).
   - Cada mensaje recibido se reenvía al grupo WebSocket `mqtt_logs` 
     mediante Django Channels para ser mostrado en tiempo real en el frontend.

2. **Publicar comandos**:
   - Permite que el backend (por ejemplo, una vista API o el panel web)
     envíe comandos al robot a través del tópico `pololu01/cmd`.

El cliente MQTT se ejecuta en un **hilo separado** para no bloquear la ejecución 
normal del servidor Django.
=====================================================================
"""

#  Autor:  Sara Hernández
#  Colaboración técnica: ChatGPT (GPT-5)

# ================================================================
# Importaciones necesarias
# ================================================================
import json    # Para codificar y decodificar mensajes en formato JSON
import threading  # Permite ejecutar el cliente MQTT en un hilo separado
import time       # Usado para pequeños retrasos de control
import paho.mqtt.client as mqtt  # Biblioteca principal para conexión con el broker MQTT
from asgiref.sync import async_to_sync  # Convierte funciones async en llamadas síncronas (para Channels)
from channels.layers import get_channel_layer  # Acceso al canal interno de Django Channels

# ---------------------------------------------------------------
# Parámetros del broker
# ---------------------------------------------------------------
BROKER = "192.168.50.200"   # Dirección IP del broker Mosquitto
PORT   = 1880               # Puerto del broker MQTT
TOPIC  = "mocap/#"          # Mantiene compatibilidad con la versión original
QOS    = 0                  # Nivel de servicio (QoS = 0; sin confirmación)

# ---------------------------------------------------------------
# Tópicos específicos del robot Pololu
# ---------------------------------------------------------------
COMMAND_TOPIC   = "pololu01/cmd"   # Tópico donde se publican comandos al robot
TELEMETRY_TOPIC = "pololu01/tel"   # Tópico donde el robot publica telemetría

# ================================================================
# Variables globales
# ===============================================================
detected_topics = set()  # Conjunto que almacena los tópicos detectados dinámicamente

mqtt_client_instance = None  # Variable que contendrá la instancia del cliente MQTT activo



# ---------------------------------------------------------------
# Callback al conectarse exitosamente al broker
# ---------------------------------------------------------------
def on_connect(client, userdata, flags, rc):
    """
    Se ejecuta automáticamente cuando el cliente logra conectarse al broker.
    Aquí se configuran las suscripciones iniciales a los diferentes tópicos.
    
    Parámetros:
      - client: instancia del cliente MQTT.
      - userdata: datos adicionales del usuario (no se usa aquí).
      - flags: información de sesión.
      - rc: código de resultado (0 = conexión exitosa).
    """
    
    if rc == 0:
        print(f"[MQTT]  Conectado exitosamente al broker {BROKER}:{PORT}")

        # Suscribirse al sistema de captura de movimiento (MoCap)
        client.subscribe(TOPIC, qos=QOS)

        # Suscribirse al canal de telemetría del Pololu
        client.subscribe(TELEMETRY_TOPIC, qos=QOS)

        print(f"[MQTT]  Suscrito a:")
        print(f"   - MOCAP (TOPIC): {TOPIC}")
        print(f"   - Telemetría Pololu:          {TELEMETRY_TOPIC}")
    else:
        print(f"[MQTT]  Error de conexión con código {rc}")


# ---------------------------------------------------------------
# Callback al recibir un mensaje MQTT
# ---------------------------------------------------------------
def on_message(client, userdata, msg):
    """
    Se ejecuta cada vez que llega un nuevo mensaje desde el broker MQTT.

    - Decodifica el payload (mensaje).
    - Registra el tópico recibido en `detected_topics`.
    - Envía el mensaje al grupo WebSocket `mqtt_logs` para que los clientes
      conectados (frontend) lo reciban en tiempo real.

    Parámetros:
      - client: cliente MQTT activo.
      - userdata: datos de usuario.
      - msg: objeto con los campos `topic`, `payload`, `qos`, etc.
    """
    try:
        # Decodificar el payload (bytes → string legible1)
        payload = msg.payload.decode("utf-8")

        # Registrar el tópico detectado (para monitoreo)
        detected_topics.add(msg.topic)

         # ----------------------------------------------------------
        # Enviar el mensaje recibido al grupo WebSocket "mqtt_logs"
        # ----------------------------------------------------------
        #  - type: tipo de evento que manejará consumers.py (mqtt_message)
        #  - topic: tópico original del mensaje
        #  - payload: contenido del mensaje
        
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "mqtt_logs",
            {
                "type": "mqtt_message",  # Nombre del evento manejado por consumers.py
                "topic": msg.topic,
                "payload": payload,
            },
        )

        # Mostrar por consola según el tipo de mensaje
        if msg.topic.startswith("mocap/"):
            print(f"[MQTT] MoCap → {msg.topic}: {payload[:120]}...")
        elif msg.topic == TELEMETRY_TOPIC:
            print(f"[MQTT]  Telemetría Pololu → {payload[:120]}...")
    

        else:
            print(f"[MQTT]  Otro mensaje → {msg.topic}: {payload[:120]}")

        # Delay breve para evitar saturación del hilo
        time.sleep(0.1)

    except Exception as e:
        print(f"[ERROR MQTT] No se pudo procesar mensaje: {e}")


# ---------------------------------------------------------------
#  Publicar comandos hacia el robot Pololu
# ---------------------------------------------------------------
def publish_command(packet: dict):
    """
    Envía un paquete JSON de comando hacia el robot Pololu mediante MQTT.
    Se puede llamar desde cualquier vista Django (ej. POST /api/enviar-comando/).
    """
    global mqtt_client_instance

    # Verifica que el cliente esté activo
    if mqtt_client_instance is None:
        print("[ERROR MQTT]  Cliente MQTT no iniciado, no se puede publicar comando.")
        return

    try:
        # Convertir el diccionario Python a cadena JSON
        message = json.dumps(packet)

        # Publicar el comando en el tópico del Pololu
        mqtt_client_instance.publish(COMMAND_TOPIC, message, qos=0)

        print(f"[MQTT]  Comando publicado en {COMMAND_TOPIC}: {message}")

    except Exception as e:
        print(f"[ERROR MQTT] No se pudo publicar comando: {e}")


# ---------------------------------------------------------------
# Inicialización del cliente MQTT (se ejecuta al iniciar Django)
# ---------------------------------------------------------------
def start_mqtt_client():
    """
    Inicializa y ejecuta el cliente MQTT en un hilo independiente.
    - Crea la instancia del cliente.
    - Asigna los callbacks de conexión y mensaje.
    - Establece la conexión con el broker.
    - Lanza un hilo con `loop_forever()` para mantener la comunicación activa.
    """
    global mqtt_client_instance

    # Crear la instancia del cliente MQTT
    mqtt_client_instance = mqtt.Client()

    # Asignar las funciones de callback
    mqtt_client_instance.on_connect = on_connect
    mqtt_client_instance.on_message = on_message

    # Conectarse al broker
    mqtt_client_instance.connect(BROKER, PORT, keepalive=60)

    # Iniciar el loop MQTT en segundo plano (no bloquea el servidor Django)
    thread = threading.Thread(target=mqtt_client_instance.loop_forever, daemon=True)
    thread.start()

    print("[MQTT]  Cliente MQTT iniciado correctamente.")
    print(f"[MQTT]  Escuchando: {TOPIC} y {TELEMETRY_TOPIC}")
    print(f"[MQTT]  Listo para publicar en: {COMMAND_TOPIC}")

