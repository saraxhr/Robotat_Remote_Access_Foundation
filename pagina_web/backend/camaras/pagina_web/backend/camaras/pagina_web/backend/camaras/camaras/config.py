# -*- coding: utf-8 -*-
# Este archivo centraliza la configuración de las cámaras Amcrest disponibles.
#  Autor:  Sara Hernández
#  Colaboración técnica: ChatGPT (GPT-5)

CAMERAS = {
    "1": {  # ID lógico que usará el frontend (cámara 1)
        "ip": "",                                   # IP de la cámara
        "user": "",                                          # Usuario de la cámara
        "password": "",                                # Contraseña de la cámara
        "rtsp": "rtsp://user:password@IP:554/cam/realmonitor?channel=1&subtype=1",  # RTSP (substream)
    },
    "2": {  # ID lógico que usará el frontend (cámara 2)
        "ip": "",                                   # IP de la cámara
        "user": "",                                          # Usuario de la cámara
        "password": "",                                # Contraseña de la cámara
        "rtsp": "rtsp://user:password@IP:554/cam/realmonitor?channel=1&subtype=1",  # RTSP (substream)
    },
    # Si luego se agregan más, copiar y pegar con IDs "3"..."6"
}

