# 🧩 Django Project — `robotat_web`

## 📘 Overview

This directory contains the **main Django project configuration** for the Robotat UVG system.
The project was created using the standard Django command:

```bash id="epjgtc"
# Creates the main Django project named robotat_web.
django-admin startproject robotat_web
```

The system runs under **ASGI** using **Daphne**, which allows the backend to handle both HTTP requests and WebSocket connections for real-time MQTT communication.

---

## ⚙️ Main Dependencies

```bash id="pre3vc"
# Installs Django as the main backend framework.
pip install django

# Installs Daphne as the ASGI server used to run HTTP and WebSocket connections.
pip install daphne

# Installs Django Channels to enable WebSocket support.
pip install channels

# Installs the Redis backend for Django Channels, if Redis is used as the channel layer.
pip install channels_redis

# Installs Django REST Framework for API endpoint development.
pip install djangorestframework

# Installs the MQTT client library used to communicate with the Mosquitto broker.
pip install paho-mqtt
```

---

## 📂 File Structure

```text id="l3f24q"
robotat_web/
│
├── asgi.py      # Configures the ASGI interface to handle HTTP and WebSocket connections.
├── settings.py  # Defines the global Django project configuration.
├── urls.py      # Defines the main routes for authentication, APIs, cameras, MQTT, and other modules.
└── wsgi.py      # Provides the WSGI entry point for compatibility with traditional web servers.
```

---

## 🚀 Running the Server with Daphne

Run the backend from the project root:

```bash id="wkjoak"
# Runs the Django ASGI application on port 8000 using Daphne.
daphne -p 8000 robotat_web.asgi:application
```

By default, the server will be available at:

```text id="b741jt"
http://127.0.0.1:8000/
```

---

## 🔌 Main Components

* **ASGI + Channels:** Enable WebSocket communication and asynchronous tasks.
* **MQTT Bridge:** Manages communication with the Mosquitto broker.
* **Interface Module:** Handles authentication, sessions, and user management.
* **Camera Module:** Enables IP camera monitoring and PTZ control.

---

## 🧩 General Integration

This module acts as the core of the backend, connecting all system applications:

* `interfaz/`: Authentication and user management.
* `mqtt_bridge/`: Real-time communication with the Mosquitto broker.
* `camaras/`: IP camera visualization and PTZ control.

---

## ⚠️ Public Repository Notes

For a public repository, make sure that `settings.py` does not expose sensitive deployment values such as:

* Django `SECRET_KEY`
* Real database credentials
* Internal IP addresses
* MQTT broker credentials
* Camera credentials
* Allowed production hosts
* Private CORS origins
* Tokens, certificates, or API keys

Use placeholders or environment variables for deployment-specific values.
