# 🧩 Proyecto Django – robotat_web

## 📘 Descripción general

Este directorio contiene la **configuración principal del proyecto Django** del sistema Robotat UVG.  
El proyecto fue creado con el comando estándar:

```bash
django-admin startproject robotat_web
```

El sistema se ejecuta bajo **ASGI** utilizando **Daphne**, lo que permite manejar tanto solicitudes HTTP como conexiones WebSocket (para comunicación en tiempo real con MQTT).

---

## ⚙️ Dependencias principales

```bash
pip install django daphne channels channels_redis djangorestframework paho-mqtt
```

---

## 📂 Estructura de archivos

```
robotat_web/
│
├── asgi.py      # Configura la interfaz ASGI para manejar HTTP y WebSockets.
├── settings.py  # Define toda la configuración global del proyecto Django.
├── urls.py      # Rutas principales (autenticación, API, cámaras, MQTT, etc.).
└── wsgi.py      # Punto de entrada WSGI para compatibilidad con servidores tradicionales.
```

---

## 🚀 Ejecución del servidor con Daphne

Ejecuta el backend desde la raíz del proyecto:

```bash
daphne -p 8000 robotat_web.asgi:application
```

El servidor se levantará por defecto en  
👉 `http://127.0.0.1:8000/`

---

## 🔌 Componentes principales

- **ASGI + Channels:** Permiten manejar WebSockets y tareas asíncronas.  
- **MQTT Bridge:** Gestiona la comunicación con el broker Mosquitto.  
- **Interfaz:** Controla la autenticación, sesiones y usuarios.  
- **Cámaras:** Permite transmisión y control PTZ en tiempo real.

---

## 🧩 Integración general

Este módulo actúa como el núcleo del backend, conectando todas las aplicaciones del sistema:
- `interfaz/` → Autenticación y gestión de usuarios.
- `mqtt_bridge/` → Comunicación en tiempo real con el broker Mosquitto.
- `camaras/` → Visualización y control de cámaras IP.
