# 🤖 Robotat UVG Project — Software Infrastructure for Future Synchronous Remote Access to the Robotat Laboratory

## 📘 Overview

This repository contains a public, non-sensitive version of the software infrastructure developed for the Robotat laboratory at Universidad del Valle de Guatemala (UVG).

The main objective of the system is to support local control and monitoring of the laboratory robots and cameras, while establishing a software foundation for future synchronous remote access. The architecture integrates the following components:

* Django backend with ASGI and Daphne
* React, Vite, and Tailwind CSS frontend
* MQTT broker using Mosquitto
* Flask microserver for MJPEG video streaming
* Integration with Amcrest IP cameras
* Role-based authentication for administrators, instructors, students, and researchers

The system is designed to run within the local Robotat network, consolidating services on a dedicated server. In a later stage, this infrastructure can serve as the basis for a secure synchronous remote connection to the laboratory.

> **Security note:** This repository is a public, non-sensitive version of the local Robotat service-layer implementation. Credentials, private IP addresses, camera URLs, authentication secrets, certificates, database files, and deployment-specific configuration values have been removed or replaced with placeholders.

---

## ⚙️ Backend Configuration — Django + Daphne

### 🔧 Creating the Django Project

```bash
# Install Django and the required backend dependencies for REST APIs, JWT authentication, MQTT communication, and HTTP requests.
pip install django djangorestframework djangorestframework-simplejwt paho-mqtt requests

# Create a new Django project that will contain the backend configuration files.
django-admin startproject robotat_web

# Create a new Django application inside the backend to manage users and authentication logic.
python manage.py startapp users
```

📘 Official Django documentation:
https://docs.djangoproject.com/en/5.0/intro/tutorial01/

🎥 Recommended video:
Django project creation tutorial — Corey Schafer, YouTube

---

## 🚀 Running the Server with Daphne — ASGI

This project uses Daphne to support WebSockets and asynchronous communication.

```bash
# Install Daphne, the ASGI server used to run the Django backend with asynchronous support.
pip install daphne

# Run the Django ASGI application on port 8000 using Daphne.
daphne -p 8000 robotat_web.asgi:application
```

📘 Official Daphne repository:
https://github.com/django/daphne

---

## 💻 Frontend Configuration — React + Vite + Tailwind CSS

### 🧠 Creating the Project with Vite + React

```bash
# Create a new React frontend project using Vite as the build tool.
npm create vite@latest frontend -- --template react

# Move into the frontend project directory.
cd frontend

# Install all frontend dependencies defined by the Vite project.
npm install
```

📘 Vite documentation:
https://vitejs.dev/guide/

🎥 Recommended video:
Vite guide — YouTube

---

## 🎨 Integrating Tailwind CSS

```bash
# Install Tailwind CSS and the required PostCSS and Autoprefixer plugins as development dependencies.
npm install -D tailwindcss postcss autoprefixer

# Generate the Tailwind CSS and PostCSS configuration files.
npx tailwindcss init -p
```

Then, in `tailwind.config.js`, add:

```javascript
// Define the files that Tailwind should scan to generate the required CSS classes.
content: [
  // Include the main HTML file used by the Vite application.
  "./index.html",

  // Include all JavaScript, TypeScript, JSX, and TSX files inside the source directory.
  "./src/**/*.{js,ts,jsx,tsx}",
],
```

In `src/index.css`, add:

```css
/* Include Tailwind's base styles and CSS reset. */
@tailwind base;

/* Include Tailwind's reusable component classes. */
@tailwind components;

/* Include Tailwind's utility classes used throughout the frontend. */
@tailwind utilities;
```

📘 Official Tailwind CSS guide for Vite:
https://tailwindcss.com/docs/guides/vite

---

## 🖥️ Running the Frontend

```bash
# Run the React development server using Vite.
npm run dev
```

By default, the frontend will run at:

```text
http://localhost:5173/
```

---

## 🛰️ MQTT Communication — Mosquitto

The system uses Mosquitto as the MQTT broker for lightweight communication between the backend, service layer, robots, and camera-related modules.

```bash
# Install the Mosquitto MQTT broker and client utilities on the local server.
sudo apt install mosquitto mosquitto-clients
```

For security reasons, the public repository should only include an example Mosquitto configuration file, such as:

```text
mosquitto.example.conf
```

Deployment-specific values should be replaced with placeholders, including:

* SSL/TLS certificate paths
* broker usernames and passwords
* internal IP addresses
* private ports
* log paths
* persistence paths

Example placeholders:

```text
<MQTT_BROKER_IP>
<MQTT_USERNAME>
<MQTT_PASSWORD>
<CERTIFICATE_PATH>
<LOG_PATH>
```

📘 Mosquitto configuration documentation:
https://mosquitto.org/man/mosquitto-conf-5.html

---

## 📹 Flask Video Server

The Flask microserver enables MJPEG video streaming from the IP cameras. In the local Robotat infrastructure, RTSP camera streams are converted into browser-compatible MJPEG feeds.

```bash
# Install Flask, OpenCV, and Requests for video streaming and HTTP communication.
pip install flask opencv-python requests

# Run the Flask video microserver.
python app.py
```

Camera URLs, usernames, passwords, and internal IP addresses should not be included in the public repository. Use placeholders instead:

```text
CAMERA_RTSP_URL=<camera_rtsp_url>
CAMERA_USERNAME=<camera_username>
CAMERA_PASSWORD=<camera_password>
CAMERA_IP=<camera_ip>
```

📘 Flask documentation:
https://flask.palletsprojects.com/

---

## 🧠 Roles and Functionalities

| Role              | Main Functionalities                                |
| ----------------- | --------------------------------------------------- |
| 🛠️ Administrator | User management and global system monitoring        |
| 🎓 Student        | Basic robot control and video visualization         |
| 🧑‍🏫 Instructor  | Session supervision and log analysis                |
| 🔬 Researcher     | Advanced control, data recording, and data download |

---

## 📁 General Requirements

* Python ≥ 3.10
* Node.js ≥ 18
* Mosquitto MQTT broker
* Django + Daphne
* React + Vite + Tailwind CSS
* Flask + OpenCV for video streaming

---

## 🔐 Recommended Public Repository Structure

The public version of this repository should avoid exposing sensitive deployment details. A recommended structure is:

```text
robotat-software-infrastructure/
├── backend/
├── frontend/
├── mqtt/
│   └── mosquitto.example.conf
├── video_server/
├── .env.example
├── .gitignore
└── README.md
```

The `.env.example` file should contain placeholders only:

```env
# Placeholder for the Django secret key used in local deployment.
DJANGO_SECRET_KEY=<replace_with_local_secret>

# Placeholder for enabling or disabling Django debug mode.
DEBUG=False

# Placeholder for the local MQTT broker address.
MQTT_BROKER_HOST=<local_broker_ip>

# Placeholder for the MQTT broker port used in local testing.
MQTT_BROKER_PORT=1883

# Placeholder for the RTSP camera stream URL.
CAMERA_RTSP_URL=<camera_rtsp_url>

# Placeholder for the camera username.
CAMERA_USERNAME=<camera_username>

# Placeholder for the camera password.
CAMERA_PASSWORD=<camera_password>
```

The `.gitignore` file should exclude local files that may contain sensitive information:

```gitignore
# Ignore local environment files that may contain credentials or private configuration values.
.env

# Ignore local Django database files that may contain users, sessions, or test data.
db.sqlite3

# Ignore Python cache folders generated during execution.
__pycache__/

# Ignore frontend dependency folders installed locally.
node_modules/

# Ignore certificate folders that may contain private keys or deployment certificates.
certs/

# Ignore private key files used for TLS, authentication, or local services.
*.key

# Ignore certificate files associated with local deployments.
*.crt

# Ignore PEM files that may contain certificates or private keys.
*.pem

# Ignore runtime logs that may contain internal IP addresses or system activity.
*.log
```

---

## 🧾 Credits

Project developed by Sara Hernández
Faculty of Engineering — Universidad del Valle de Guatemala (UVG)

Graduation project:
*Design and Implementation of Software Infrastructure for Synchronous Remote Connection with the Robotat Laboratory at Universidad del Valle de Guatemala.*
