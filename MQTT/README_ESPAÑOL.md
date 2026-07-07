#  Publisher MQTT - Robotat UVG


## Descripción general 

Este repositorio contiene los scripts utilizados para la publicación de datos hacia un **broker MQTT**.  

El código principal —`publisher_MQTT_final.py`— se desarrolló utilizando como base las funciones y estructuras implementadas por **MSc. Miguel Zea**, adaptándolas para integrarse a la arquitectura MQTT.

---


## ⚙️ Requisitos e instalación

Para ejecutar correctamente el publicador MQTT (`publisher_MQTT_final.py`) es necesario instalar las siguientes librerías, herramientas y configuraciones del entorno.

---

###  1. Librerías de Python requeridas

El código utiliza las siguientes librerías:

| Librería | Propósito | Instalación |
|-----------|------------|-------------|
| `json` | Serializa los datos a formato JSON para transmitirlos por MQTT. | Incluida en Python. |
| `hashlib` | Calcula el **checksum** para validar integridad de los paquetes. | Incluida en Python. |
| `datetime` | Genera los *timestamps* (marcas de tiempo) de cada paquete. | Incluida en Python. |
| `enum` | Define enumeraciones para los tipos de paquetes y fuentes. | Incluida en Python. |
| `paho-mqtt` | Cliente MQTT usado para conectarse y publicar mensajes en el broker. | `pip install paho-mqtt` |
| `numpy` | Manejo de arreglos numéricos para almacenar posiciones y rotaciones. | `pip install numpy` |
| `NatNetClient`, `MoCapData`, `DataDescriptions` | Módulos desarrollados por **MSc. Miguel Zea** para recibir datos del sistema **OptiTrack Motive** usando el protocolo **NatNet**. | Se incluyen en este repositorio. |

> Asegúrate de que los archivos `NatNetClient.py`, `MoCapData.py` y `DataDescriptions.py` estén en el mismo directorio que `publisher_MQTT_final.py`.

---

### 🧱 2. Instalación del broker Mosquitto

El sistema requiere el **broker MQTT Mosquitto**, que actúa como intermediario entre los publicadores (como este script) y los suscriptores (robots, página web).

#### 🔧 Instalación en Windows

1. Descarga Mosquitto desde:  
   👉 [https://mosquitto.org/download/](https://mosquitto.org/download/)
2. Durante la instalación, marca las opciones:  
   - *Service installation*  
   - *Start with Windows*
3. Verifica que el servicio **Mosquitto Broker** esté activo en el *Administrador de tareas → Servicios*.

---

### 🧾 3. Configuración del archivo `mosquitto.conf`

El archivo `mosquitto.conf` incluido en este repositorio define la configuración básica del broker para el entorno local del Robotat:

```bash
<MQTT_BROKER_IP>
<MQTT_USERNAME>
<MQTT_PASSWORD>
<MOSQUITTO_DATA_PATH>
<MOSQUITTO_LOG_PATH>
<CERTIFICATE_PATH>




