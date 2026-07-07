# -*- coding: utf-8 -*-
# Este archivo centraliza la configuración de las cámaras Amcrest disponibles.

#  Autor:  Sara Hernández
#  Colaboración técnica: ChatGPT (GPT-5)

CAMERAS = {
    "1": {  # ID lógico que usará el frontend (cámara 1)
        "ip": "192.168.50.211",                                   # IP de la cámara
        "user": "admin",                                          # Usuario de la cámara
        "password": "UVG12345678",                                # Contraseña de la cámara
        "rtsp": "rtsp://admin:UVG12345678@192.168.50.211:554/cam/realmonitor?channel=1&subtype=1",  # RTSP (substream)
    },
    "2": {  # ID lógico que usará el frontend (cámara 2)
        "ip": "192.168.50.212",                                    # IP de la cámara
        #"ip": "192.168.1.36",
        "user": "admin",                                          # Usuario de la cámara
        "password": "12345678UVG",                                # Contraseña de la cámara
        "rtsp": "rtsp://admin:12345678UVG@192.168.50.212:554/cam/realmonitor?channel=1&subtype=1",  # RTSP (substream)


    },
    # Si luego se agregan más, copiar y pegar con IDs "3"..."6"
}

