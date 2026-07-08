# 📸 Django Application — IP Camera Control (Robotat UVG)

## 📘 Overview

The **`camaras/`** folder is part of the **Robotat UVG** project backend and is developed using **Django**.
Its purpose is to provide **basic monitoring and control of Amcrest IP cameras** through HTTP endpoints that allow the system to:

* Check whether a camera is **online or offline**.
* Send **PTZ commands** such as Pan, Tilt, Zoom, and Home through HTTP requests.
* Prepare the infrastructure for live video streaming, which is handled separately by `flask_video_server/`.

---

## ⚙️ Folder Structure

```text
camaras/
│
├── apps.py        → Configures the "camaras" app inside the Django project.
├── config.py      → Defines placeholder IPs, usernames, passwords, and RTSP URLs for the Amcrest cameras.
├── urls.py        → Declares the HTTP endpoints exposed by the application.
└── views.py       → Implements the logic for PTZ control and connection status verification.
```

---

## 📦 Dependency Installation

Before running this application, make sure **Python 3.9 or higher** is installed.
Then install the required dependencies:

```bash
# Installs Django for backend routing, views, and HTTP responses.
pip install django

# Installs Requests to send HTTP requests to the Amcrest cameras.
pip install requests
```

| Library      | Description                                                                      |
| ------------ | -------------------------------------------------------------------------------- |
| **Django**   | Main backend framework used to manage routes, views, and HTTP responses.         |
| **Requests** | Used to send HTTP requests to the Amcrest cameras through Digest Authentication. |

---

## 🧩 Libraries Required by `views.py`

The **`views.py`** file uses the following libraries and modules.

### 🔹 Standard Python Libraries

These are included with Python and do **not** require additional installation:

| Library | Main Use                                                  |
| ------- | --------------------------------------------------------- |
| `time`  | Adds short pauses between PTZ commands when needed.       |
| `json`  | Encodes and decodes JSON data for requests and responses. |

### 🔹 External Libraries

These libraries must be installed before running the server:

```bash
# Installs Django and Requests, which are required by the camera-control backend.
pip install django requests
```

---

## 🧱 Creating the Django Project and Registering the App

If the base project has not been configured yet, it can be created with the following commands:

```bash
# Creates the main Django project named robotat_web.
django-admin startproject robotat_web

# Enters the main Django project folder.
cd robotat_web

# Creates the camera-control Django application.
python manage.py startapp camaras
```

Then, open `robotat_web/settings.py` and add the app to `INSTALLED_APPS`:

```python
# Registers the camaras application inside the Django project.
INSTALLED_APPS = [
    # Keeps the default Django applications.
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",

    # Enables the camera-control application.
    "camaras",
]
```

This creates the base Django project structure and enables the `camaras` application.

---

## 🧩 Detailed File Description

### 📄 `apps.py`

Defines the `CamarasConfig` class, which registers the **`camaras`** application inside the Django project.
This allows Django to load and initialize the app when the server starts.

---

### ⚙️ `config.py`

Contains the `CAMERAS` dictionary, where the available Amcrest cameras are defined.
Each entry includes the camera IP address, username, password, and RTSP URL.

For the public repository, use placeholder values instead of real credentials:

```python
# Defines the available camera configurations using non-sensitive placeholder values.
CAMERAS = {
    # Defines the configuration for camera 1.
    "1": {
        # Placeholder for the first camera IP address.
        "ip": "<CAMERA_1_IP_ADDRESS>",

        # Placeholder for the first camera username.
        "user": "<CAMERA_1_USERNAME>",

        # Placeholder for the first camera password.
        "password": "<CAMERA_1_PASSWORD>",

        # Placeholder for the first camera RTSP stream URL.
        "rtsp": "rtsp://<CAMERA_1_USERNAME>:<CAMERA_1_PASSWORD>@<CAMERA_1_IP_ADDRESS>:554/cam/realmonitor?channel=1&subtype=1",
    },

    # Defines the configuration for camera 2.
    "2": {
        # Placeholder for the second camera IP address.
        "ip": "<CAMERA_2_IP_ADDRESS>",

        # Placeholder for the second camera username.
        "user": "<CAMERA_2_USERNAME>",

        # Placeholder for the second camera password.
        "password": "<CAMERA_2_PASSWORD>",

        # Placeholder for the second camera RTSP stream URL.
        "rtsp": "rtsp://<CAMERA_2_USERNAME>:<CAMERA_2_PASSWORD>@<CAMERA_2_IP_ADDRESS>:554/cam/realmonitor?channel=1&subtype=1",
    },
}
```

📌 **Important Notes:**

* Additional cameras can be added by duplicating the same structure and changing the camera ID to `"3"`, `"4"`, etc.
* `subtype=1` uses the **substream**, which provides lower resolution and is useful for smooth, low-latency video transmission.
* This file is the only file that should be modified if camera IPs or credentials change.
* Real IP addresses, usernames, passwords, and RTSP URLs should not be uploaded to the public repository.

---

### 🌐 `urls.py`

Defines the HTTP routes used to interact with the cameras.
Each endpoint is linked to a function inside `views.py`.

| Endpoint                    | Method | Associated Function | Description                                         |
| --------------------------- | ------ | ------------------- | --------------------------------------------------- |
| `/api/cameras/<id>/status/` | `GET`  | `status_view`       | Checks whether a camera is online or offline.       |
| `/api/cameras/<id>/ptz/`    | `POST` | `ptz_view`          | Sends PTZ movement commands to the selected camera. |

To enable these routes inside the main project, open `robotat_web/urls.py` and add:

```python
# Imports path and include to define and include URL routes.
from django.urls import path, include

# Defines the main URL patterns for the Django project.
urlpatterns = [
    # Enables the routes defined by the camaras application.
    path("", include("camaras.urls")),
]
```

---

### 🧠 `views.py`

Contains the main logic of the application.
It implements the functions that handle incoming requests and communicate with the Amcrest cameras using HTTP Digest Authentication.

#### 🔹 1. `status_view(request, cam_id)`

* **Route:** `/api/cameras/<id>/status/`
* **Method:** `GET`
* **Purpose:** Checks whether the camera responds correctly.

Expected JSON response:

```json
{
  "online": true
}
```

Example usage from a browser or Postman:

```text
http://127.0.0.1:8000/api/cameras/1/status/
```

---

#### 🔹 2. `ptz_view(request, cam_id)`

* **Route:** `/api/cameras/<id>/ptz/`
* **Method:** `POST`
* **Purpose:** Sends PTZ movement commands to an IP camera.

Expected JSON input:

```json
{
  "cmd": "up",
  "speed": 5
}
```

Valid commands:

```text
up, down, left, right, home, center, reset
```

Example using the terminal:

```bash
# Sends a PTZ command to move camera 1 to the left with speed 4.
curl -X POST http://127.0.0.1:8000/api/cameras/1/ptz/ \
     -H "Content-Type: application/json" \
     -d '{"cmd": "left", "speed": 4}'
```

Expected response:

```json
{
  "ok": true
}
```

---

## 🧰 System Requirements

| Component    | Recommended Version |
| ------------ | ------------------- |
| **Python**   | 3.9 or higher       |
| **Django**   | 5.0+                |
| **Requests** | 2.31+               |

---

## ⚠️ Important Notes

* This application does **not** transmit video. Its purpose is camera **control and basic monitoring**.
* MJPEG video streaming is handled separately by the `flask_video_server/` folder.
* If the cameras do not respond:

  * Verify that the camera IPs are reachable from the local network.
  * Confirm that the credentials in `config.py` are correct.
  * Make sure the **CGI service** is enabled on the Amcrest cameras.
* PTZ commands are sent using **HTTP Digest Authentication**.
* Deployment-specific information such as camera IP addresses, credentials, and RTSP URLs must be stored locally and excluded from the public repository.

---

**Author:** Sara Hernández
