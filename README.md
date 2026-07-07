# 🤖 Proyecto Robotat UVG — Infraestructura de software para la conexión remota sincrónica con el laboratorio Robotat de la Universidad del Valle de Guatemala

## 📘 Descripción General

Este repositorio contiene toda la infraestructura de software desarrollada para el **Robotat** de la **Universidad del Valle de Guatemala (UVG)**.  
El objetivo principal del sistema es **permitir el control y monitoreo local (y futuro remoto)** de los robots y cámaras del laboratorio mediante una arquitectura moderna basada en:

- **Backend Django (ASGI + Daphne)**
- **Frontend React + Vite + Tailwind CSS**
- **Broker MQTT (Mosquitto)**
- **Microservidor Flask para video MJPEG**
- **Integración con cámaras IP Amcrest**
- **Autenticación por roles (Administrador, Docente, Estudiante, Investigador)**

El sistema está diseñado para ejecutarse **en la red local del Robotat**, consolidando los servicios en un servidor dedicado.  
En una etapa posterior, esta infraestructura servirá como base para la **conexión remota sincrónica** con el laboratorio.



---

## ⚙️ Configuración del Backend (Django + Daphne)

### 🔧 Crear el proyecto Django

```bash
# Instalar Django y dependencias
pip install django djangorestframework djangorestframework-simplejwt paho-mqtt requests

# Crear un nuevo proyecto
django-admin startproject robotat_web

# Crear una nueva aplicación dentro del backend
python manage.py startapp usuarios
```

📘 **Referencia oficial Django:**  
🔗 [https://docs.djangoproject.com/en/5.0/intro/tutorial01/](https://docs.djangoproject.com/en/5.0/intro/tutorial01/)  
🎥 **Video recomendado:**  
[Creación de proyecto Django (Corey Schafer - YouTube)](https://www.youtube.com/watch?v=UmljXZIypDc)

---

### 🚀 Ejecutar el servidor con Daphne (ASGI)
Este proyecto usa **Daphne** para manejar WebSockets y comunicación asíncrona:

```bash
# Instalar Daphne
pip install daphne

# Ejecutar el servidor
daphne -p 8000 robotat_web.asgi:application
```

📘 **Referencia oficial Daphne:**  
🔗 [https://github.com/django/daphne](https://github.com/django/daphne)

---

## 💻 Configuración del Frontend (React + Vite + Tailwind CSS)

### 🧠 Crear el proyecto con Vite + React
```bash
# Instalar Vite y crear el proyecto
npm create vite@latest frontend -- --template react

# Entrar al proyecto
cd frontend

# Instalar dependencias
npm install
```

📘 **Documentación Vite:**  
🔗 [https://vitejs.dev/guide/](https://vitejs.dev/guide/)

🎥 **Video guía:**  
 [Video Vite(YouTube)](https://www.youtube.com/watch?v=KCrXgy8qtjM)


---

### 🎨 Integrar Tailwind CSS
```bash
# Instalar Tailwind y sus plugins
npm install -D tailwindcss postcss autoprefixer

# Inicializar configuración
npx tailwindcss init -p
```

Luego, en `tailwind.config.js`, agrega:
```js
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
],
```

Y en `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

📘 **Guía oficial Tailwind CSS:**  
🔗 [https://tailwindcss.com/docs/guides/vite](https://tailwindcss.com/docs/guides/vite)

---

### 🖥️ Ejecutar el frontend
```bash
# Correr la aplicación React
npm run dev
```
Por defecto se ejecutará en `http://localhost:5173/`.

---

## 🛰️ Comunicación MQTT (Mosquitto)

El sistema utiliza **Mosquitto** como broker MQTT para la comunicación entre el backend, los robots y las cámaras.

```bash
# Instalar Mosquitto
sudo apt install mosquitto mosquitto-clients
```

En el servidor local se incluye un archivo `mosquitto.conf` con las siguientes configuraciones:

- Certificados SSL/TLS (`certs/`)
- Puertos seguros 1883 (local) y 8883 (TLS)
- Rutas para logs y políticas de persistencia

📘 **Documentación Mosquitto:**  
🔗 [https://mosquitto.org/man/mosquitto-conf-5.html](https://mosquitto.org/man/mosquitto-conf-5.html)

---

## 📹 Servidor de Video Flask

El microservidor Flask permite el **streaming MJPEG** desde las cámaras IP.

```bash
# Instalar dependencias
pip install flask opencv-python requests

# Ejecutar el servidor Flask
python app.py
```

📘 **Documentación Flask:**  
🔗 [https://flask.palletsprojects.com/](https://flask.palletsprojects.com/)

---

## 🧠 Roles y Funcionalidades

| Rol | Funcionalidades principales |
|-----|------------------------------|
| 🛠️ Administrador | Gestión de usuarios, monitoreo global del sistema |
| 🎓 Estudiante | Control básico de robots, visualización de video |
| 🧑‍🏫 Docente | Supervisión de sesiones, análisis de logs |
| 🔬 Investigador | Control avanzado, grabación y descarga de datos |

---

## 📁 Requisitos Generales

- **Python ≥ 3.10**
- **Node.js ≥ 18**
- **Mosquitto MQTT Broker**
- **Django + Daphne**
- **React + Vite + Tailwind**
- **Flask + OpenCV (para video)**

---

## 🧾 Créditos

Proyecto desarrollado por **Sara Hernández**  
Facultad de Ingeniería — **Universidad del Valle de Guatemala (UVG)**  
📚 Proyecto de graduación: *Diseño e implementación de infraestructura de software para la conexión remota sincrónica con el laboratorio Robotat de la Universidad del Valle de Guatemala.*
