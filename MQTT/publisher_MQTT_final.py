# ===============================================================
#  PUBLISHER MQTT 
# ===============================================================
# 
# Descripción general:
# --------------------
# Este script establece una conexión con el sistema de captura de movimiento 
# del laboratorio Robotat utilizando el protocolo NatNet. 
# Cada vez que se recibe la información de un "rigid body" (objeto rastreado 
# por las cámaras OptiTrack), el script genera un paquete estructurado 
# y lo publica en el broker MQTT.
#
# El propósito principal de este módulo es servir como *puente de comunicación*
# entre el sistema de MoCap y otros clientes.
#
# Este código fue desarrollado con base en funciones proporcionadas por 
# **MSc. Miguel Zea**, a quien pertenece parte del código base del sistema 
# NatNetClient y la estructura general de adquisición de datos. 
#
# A lo largo del desarrollo de este script, **ChatGPT (GPT-5)** me asistió
#  en la ampliación del código. 
#
# ===============================================================
#  Autor:  Sara Hernández
#  Colaboración técnica: ChatGPT (GPT-5)

# --- Importaciones estándar ---
import json  # Para serializar los paquetes a formato JSON
import hashlib  #Para calcular el checksum (verificar integridad)
from datetime import datetime #Para generar timestamps
from enum import Enum  #Para definir enumeraciones

# --- Cliente MQTT (paho-mqtt) ---
import paho.mqtt.client as mqtt  

# --- Importaciones NatNet / numpy ---
from NatNetClient import NatNetClient #Cliente NatNet (comunicación con Motive)
import numpy as np    #Librería para manejo de datos 

# === Tabla global de datos de MoCap ===
# Se almacena la información de hasta 100 cuerpos rígidos (cada uno con 7 parámetros)
mocap_data = np.empty([100, 7])  

# === Parámetros de conexión MQTT ===
BROKER = "192.168.50.200" #IP del broker MQTT (en este caso, el servidor del Robotat)
PORT   = 1880  #Puerto asignado para las comunicaciones MQTT
TOPIC  = "mocap/all"  #Topic en el cual se publicarán los datos del Mocap
QOS    = 0  #Calidad de servicio (QOS = 0 "at most once")

# ===============================================================
# ENUMERACIONES
# ===============================================================
#Las enumeraciones permiten identificar de manera estructurada el origen, 
#tipo e identificador del paquete que se está transmitiendo. 


# ---------------------------------------------------------------
# Fuente del paquete (src)
# ---------------------------------------------------------------
#Define el origen del paquete que se publica en MQTT. 
# Cada valor enum representa un nodo o dispositivo dentro de la red del Robotat. 

class Source(Enum):
    
    # Nodos principales
    ROBOTAT_SERVER = 0
    USER_PC = 1

    # Pololu (00–32)
    POLOLU_00 = 10
    POLOLU_01 = 11
    POLOLU_02 = 12
    POLOLU_03 = 13
    POLOLU_04 = 14
    POLOLU_05 = 15
    POLOLU_06 = 16
    POLOLU_07 = 17
    POLOLU_08 = 18
    POLOLU_09 = 19
    POLOLU_10 = 20
    POLOLU_11 = 21
    POLOLU_12 = 22
    POLOLU_13 = 23
    POLOLU_14 = 24
    POLOLU_15 = 25
    POLOLU_16 = 26
    POLOLU_17 = 27
    POLOLU_18 = 28
    POLOLU_19 = 29
    POLOLU_20 = 30
    POLOLU_21 = 31
    POLOLU_22 = 32
    POLOLU_23 = 33
    POLOLU_24 = 34
    POLOLU_25 = 35
    POLOLU_26 = 36
    POLOLU_27 = 37
    POLOLU_28 = 38
    POLOLU_29 = 39
    POLOLU_30 = 40
    POLOLU_31 = 41
    POLOLU_32 = 42

    # Crazyflie (00–20)
    CRAZYFLIE_00 = 50
    CRAZYFLIE_01 = 51
    CRAZYFLIE_02 = 52
    CRAZYFLIE_03 = 53
    CRAZYFLIE_04 = 54
    CRAZYFLIE_05 = 55
    CRAZYFLIE_06 = 56
    CRAZYFLIE_07 = 57
    CRAZYFLIE_08 = 58
    CRAZYFLIE_09 = 59
    CRAZYFLIE_10 = 60
    CRAZYFLIE_11 = 61
    CRAZYFLIE_12 = 62
    CRAZYFLIE_13 = 63
    CRAZYFLIE_14 = 64
    CRAZYFLIE_15 = 65
    CRAZYFLIE_16 = 66
    CRAZYFLIE_17 = 67
    CRAZYFLIE_18 = 68
    CRAZYFLIE_19 = 69
    CRAZYFLIE_20 = 70

    # MaxArm (00–20)
    MAXARM_00 = 80
    MAXARM_01 = 81
    MAXARM_02 = 82
    MAXARM_03 = 83
    MAXARM_04 = 84
    MAXARM_05 = 85
    MAXARM_06 = 86
    MAXARM_07 = 87
    MAXARM_08 = 88
    MAXARM_09 = 89
    MAXARM_10 = 90
    MAXARM_11 = 91
    MAXARM_12 = 92
    MAXARM_13 = 93
    MAXARM_14 = 94
    MAXARM_15 = 95
    MAXARM_16 = 96
    MAXARM_17 = 97
    MAXARM_18 = 98
    MAXARM_19 = 99
    MAXARM_20 = 100


# ---------------------------------------------------------------
# Tipo de paquete (ptp)
# ---------------------------------------------------------------
# Clasifica el propósito del paquete MQTT: 
#   - DATA: datos en general 
#   - COMMAND: comandos enviados a robots 
#   - MOCAP: datos provenientes del MOCAP
 
class PacketType(Enum):
    DATA = 0
    COMMAND = 1
    MOCAP = 2


# ---------------------------------------------------------------
# Identificador del paquete (pid)
# ---------------------------------------------------------------
# Identifica de manera específica el tipo de paquete dentro de cada categoría. 
# Incluye IDs para comandos, datos y futuros paquetes de MoCap. 

class PacketID(Enum):
    # --- Para paquetes DATA ---
    STATE = 0
    SENSOR = 1
    MESSAGE = 2

    # --- Para paquetes COMMAND ---
    FORCE_STOP = 100
    FWD_PRESS = 101
    FWD_RELEASE = 102
    BWD_PRESS = 103
    BWD_RELEASE = 104
    LFT_PRESS = 105
    LFT_RELEASE = 106
    RGT_PRESS = 107
    RGT_RELEASE = 108

    # --- Para paquetes MOCAP ---
    # En lugar de escribir los 99 manualmente, se generan dinámicamente:
    # Esto crea atributos MARKER_01 a MARKER_99 con valores consecutivos
    pass



# === Estado global del cliente MQTT ===
_mqtt = None   #Instancia global del clilente MQTT
CURRENT_SOURCE = Source.ROBOTAT_SERVER  # Valor por defecto

# ===============================================================
# FUNCIÓN: Inicialización del cliente MQTT
# ===============================================================

def _init_mqtt(node_source: Source = Source.ROBOTAT_SERVER):
    """
    Inicializa el cliente MQTT e indica la fuente de los paquetes. 
    Si el cliente ya estaba inicializado, evita duplicar la conexión. 
    Por defecto, se asume que es el servidor del Robotat.
    """
    global _mqtt, CURRENT_SOURCE

    # Si ya está inicializado, no volver a crear el cliente
    if _mqtt is not None:
        return  #ya existe una instancia activa

    # Guarda el source actual para los paquetes
    CURRENT_SOURCE = node_source

    # Crea y conecta el cliente MQTT
    client = mqtt.Client()
    client.connect(BROKER, PORT, keepalive=60)
    client.loop_start()  #Inicial el loop en segundo plano

    _mqtt = client


# ===============================================================
# FUNCIÓN: Calcular Checksum
# ===============================================================

def _calculate_checksum(packet_dict: dict) -> str:
    """Calcula el checksum del paquete (excluyendo el propio campo 'cks')."""
    
    #Se crea una copia del paquete sin incluir el checksum 
    temp_packet = {k: v for k, v in packet_dict.items() if k != "cks"}
    # Se convierte el diccionario a bytes JSON ordenados
    json_bytes = json.dumps(temp_packet, separators=(',', ':'), ensure_ascii=False).encode("utf-8")
    # Se retorna el hash en formato hexadecimal
    return hashlib.sha256(json_bytes).hexdigest()

# ===============================================================
# FUNCIÓN: Publicar paquete en MQTT
# ===============================================================
#Serializa el paquete en formato JSON y lo publica en el topic MQTT

def _publish_packet(packet: dict):
    payload_out = json.dumps(packet, separators=(',', ':'), ensure_ascii=False)
    _mqtt.publish(TOPIC, payload_out, qos=QOS, retain=False)

# ===============================================================
# FUNCIONES CALLBACK DEL SISTEMA MOCAP
# ===============================================================
def receive_new_frame(data_dict):
    pass
    # order_list=[ "frameNumber", "markerSetCount", "unlabeledMarkersCount", "rigidBodyCount", "skeletonCount",
    #              "labeledMarkerCount", "timecode", "timecodeSub", "timestamp", "isRecording", "trackedModelsChanged" ]
    # dump_args = False
    # if dump_args == True:
    #     out_string = "    "
    #     for key in data_dict:
    #         out_string += key + "="
    #         if key in data_dict :
    #             out_string += data_dict[key] + " "
    #         out_string+="/"
    #     print(out_string)


def receive_rigid_body_frame(id, position, rotation):
    #print("ID: " + str(id) + " position: [" + str(position[0]) + ", " + str(position[1]) + ", " + str(position[2]) + "]")
    mocap_data[id, 0] = position[0];
    mocap_data[id, 1] = position[1];
    mocap_data[id, 2] = position[2];
    mocap_data[id, 3] = rotation[3];
    mocap_data[id, 4] = rotation[0];
    mocap_data[id, 5] = rotation[1];
    mocap_data[id, 6] = rotation[2];
   


# ===============================================================
#  PUBLICA LA POSE DE UN CUERPO RÍGIDO
# ===============================================================
def on_rigid_body(id, position, rotation):
    """
    Esta función se llama automáticamente al detectar un cuerpo rígido.
    Toma los datos de posición y orientación (cuaterniones), construye un paquete
    estructurado y lo publica por MQTT con el formato definido por Robotat.
    """

    #Inicializa el cliente MQTT (solo si no estaba activo ya)
    _init_mqtt()

    #Procesa la información cruda recibida desde NatNet
    receive_rigid_body_frame(id, position, rotation)

    # ---- Construcción de pose_payload ----
    pose_payload = {}
    pose_payload["pose"] = {}
    pose_payload["pose"]["position"] = {}
    pose_payload["pose"]["position"]["x"] = float(position[0])
    pose_payload["pose"]["position"]["y"] = float(position[1])
    pose_payload["pose"]["position"]["z"] = float(position[2])
    pose_payload["pose"]["rotation"] = {}
    pose_payload["pose"]["rotation"]["qx"] = float(rotation[0])
    pose_payload["pose"]["rotation"]["qy"] = float(rotation[1])
    pose_payload["pose"]["rotation"]["qz"] = float(rotation[2])
    pose_payload["pose"]["rotation"]["qw"] = float(rotation[3])

    # ---- Cálculo tamaño del payload ----
    payload_json = json.dumps(pose_payload, separators=(',', ':'), ensure_ascii=False)
    payload_size_bytes = len(payload_json.encode("utf-8"))

    # ---- Paquete final ----
    packet = {
        "src": CURRENT_SOURCE.value,                         # Fuente (Enum)
        #"src": Source.POLOLU_03.value,
        #"src": Source.USER_PC.value, 
        "pts": datetime.utcnow().timestamp(),                      # Timestamp UNIX
        "ptp": PacketType.MOCAP.value,                              # Tipo de paquete (Enum)
        "pid": int(id),  # ID
        "psb": payload_size_bytes,                                 # Tamaño del payload
        "pld": pose_payload,                                       # Payload (pose)
        "cks": None                                                # Checksum 
    }

    # ---- Calcular y asignar checksum ----
    packet["cks"] = _calculate_checksum(packet)

    # ---- Publicar en MQTT ----
    _publish_packet(packet)


# ===============================================================
# MAIN PROGRAM
# ===============================================================
# Inicializa el cliente MQTT indicando el source del nodo
_init_mqtt(Source.ROBOTAT_SERVER)

#Inicializa cliente NatNet
streaming_client = NatNetClient()  #Crea una instancia del cliente NatNet
streaming_client.set_print_level(0)   #Controla cuánto texto se muestra en la consola mientras el cliente está corriendo
streaming_client.new_frame_listener = receive_new_frame  #Callback general
streaming_client.rigid_body_listener = on_rigid_body #Callback principal

# Inicia la recepción de datos de MoCap
streaming_client.run()



