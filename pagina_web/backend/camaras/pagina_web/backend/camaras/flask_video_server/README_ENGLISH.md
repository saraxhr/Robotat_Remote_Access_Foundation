# 🎥 Flask Microserver — MJPEG Video Streaming (Robotat UVG)

## 📘 Overview

The **`flask_video_server/`** folder implements a **Flask microserver** responsible for streaming live video from multiple Amcrest IP cameras using the **MJPEG** protocol.

Its main purpose is to enable **real-time visualization** from browsers or web interfaces, independently from the Django backend. This separation improves performance and stability by using threads and the **Waitress** server.

---

## ⚙️ Folder Structure

```text
flask_video_server/
│
├── app.py              → Flask server that handles streaming and control endpoints.
├── config.py           → Camera configuration file using placeholders for IPs, usernames, passwords, and RTSP URLs.
└── video_stream.py     → Main VideoCamera class that handles capture, reconnection, and JPEG encoding.
```

---

## 🧩 Required Libraries

Before running the server, install the following dependencies:

```bash
# Installs Flask for creating the HTTP video-streaming server.
pip install flask waitress opencv-python numpy
```

| Library            | Main Use                                                                                  |
| ------------------ | ----------------------------------------------------------------------------------------- |
| **Flask**          | Lightweight framework used to create the HTTP server that transmits the video streams.    |
| **Waitress**       | Production-ready WSGI server used to keep MJPEG connections stable.                       |
| **OpenCV (`cv2`)** | Captures RTSP frames from the cameras and encodes them as JPEG images.                    |
| **NumPy**          | Required by OpenCV for handling pixel matrices.                                           |
| **Threading**      | Standard Python module used to create threads and handle multiple cameras simultaneously. |
| **Time**           | Controls frame reading frequency and reconnection timing.                                 |

---

## 🧱 Files and Their Purpose

### 📄 `app.py`

This is the main file of the Flask microserver.
It starts the server, handles HTTP endpoints, and controls the MJPEG video streams.

#### 📦 Main Functions

* **`generate_stream(cam_id)`**: Generates a stable MJPEG stream of approximately 30 FPS for a specific camera.
* **`/camera/<id>`**: Provides the real-time MJPEG video stream.
* **`/status`**: Returns a JSON response with the status of all active cameras.
* **`/stop/<id>`**: Manually stops a camera and releases memory resources.

#### 🚀 Running the Flask Server

To start the server, run the following command inside the `flask_video_server` folder:

```bash
# Runs the Flask video microserver.
python app.py
```

This starts the server using **Waitress** on port **5000**, available on all network interfaces:

```text
Flask video server started with Waitress at http://0.0.0.0:5000
```

The stream can be accessed from a browser using:

```text
http://localhost:5000/camera/1
```

Replace `1` with the logical camera ID defined in `config.py`.

---

### ⚙️ `config.py`

This file contains the configuration for the available Amcrest cameras, including placeholder credentials and RTSP URLs.

Example:

```python
# Defines the available camera configurations using non-sensitive placeholder values.
CAMERAS = {
    # Defines the configuration for camera 1.
    "1": {
        # Placeholder for the camera IP address.
        "ip": "<CAMERA_1_IP_ADDRESS>",

        # Placeholder for the camera username.
        "user": "<CAMERA_1_USERNAME>",

        # Placeholder for the camera password.
        "password": "<CAMERA_1_PASSWORD>",

        # Placeholder for the RTSP stream URL.
        "rtsp": "rtsp://<CAMERA_1_USERNAME>:<CAMERA_1_PASSWORD>@<CAMERA_1_IP_ADDRESS>:554/cam/realmonitor?channel=1&subtype=1",
    },

    # Defines the configuration for camera 2.
    "2": {
        # Placeholder for the camera IP address.
        "ip": "<CAMERA_2_IP_ADDRESS>",

        # Placeholder for the camera username.
        "user": "<CAMERA_2_USERNAME>",

        # Placeholder for the camera password.
        "password": "<CAMERA_2_PASSWORD>",

        # Placeholder for the RTSP stream URL.
        "rtsp": "rtsp://<CAMERA_2_USERNAME>:<CAMERA_2_PASSWORD>@<CAMERA_2_IP_ADDRESS>:554/cam/realmonitor?channel=1&subtype=1",
    },
}
```

📌 **Notes:**

* `subtype=1` corresponds to the **substream**, which uses lower resolution and is ideal for smoother streaming with lower bandwidth.
* Additional cameras can be added by copying the same structure and using IDs such as `"3"`, `"4"`, etc.
* The values defined here are imported automatically by `app.py`.
* Real IP addresses, usernames, passwords, and RTSP URLs should not be uploaded to the public repository.

---

### 🎞️ `video_stream.py`

This file defines the **`VideoCamera`** class, which handles RTSP connections and JPEG encoding.
Each active camera runs in an independent thread.

#### 🔹 Main Functions

* **`start()`**: Starts the thread that keeps the RTSP stream open.
* **`_update()`**: Continuously captures frames, handles automatic reconnections, and controls the frame rate at approximately 20 FPS.
* **`get_jpeg_frame()`**: Returns the latest frame in JPEG format, ready to be sent through HTTP.
* **`stop()`**: Stops the thread and releases resources.
* **`reconnect()`**: Manually retries the camera connection.
* **`ensure_alive()`**: Checks the RTSP stream status and forces reconnection if needed.

It also includes an independent **`mjpeg_generator(camera)`** function that transforms frames into an MJPEG stream compatible with browsers.

---

## 🧩 Libraries Used in the Files

### 📜 `app.py`

```python
# Imports Flask to create the web server and define HTTP endpoints.
from flask import Flask, Response, jsonify

# Imports the VideoCamera class that manages camera streaming.
from video_stream import VideoCamera

# Imports the camera configuration dictionary.
from config import CAMERAS

# Imports threading to manage multiple camera streams concurrently.
import threading

# Imports time to control delays and timing behavior.
import time

# Imports Waitress to serve the Flask application with a production-ready WSGI server.
from waitress import serve
```

### 📜 `video_stream.py`

```python
# Imports OpenCV to capture RTSP frames and encode them as JPEG images.
import cv2

# Imports threading to run each camera stream in an independent thread.
import threading

# Imports time to control frame timing and reconnection delays.
import time

# Imports NumPy because OpenCV uses NumPy arrays to represent image frames.
import numpy as np
```

These libraries make it possible to:

* Create the server using `Flask` and `Waitress`.
* Capture video using `OpenCV`.
* Run multiple cameras in parallel using `threading`.
* Control refresh and reconnection timing using `time`.

---

## 🚀 Running the Server

To start the Flask microserver and enable MJPEG streaming, run the following command from the `flask_video_server` folder:

```bash
# Starts the Flask video microserver.
python app.py
```

---

## 📡 Available Endpoints

| Endpoint       | Method | Description                                                      |
| -------------- | ------ | ---------------------------------------------------------------- |
| `/camera/<id>` | `GET`  | Returns the MJPEG video stream of the selected camera.           |
| `/status`      | `GET`  | Shows the status of all active cameras and their configured IPs. |
| `/stop/<id>`   | `GET`  | Stops a camera and releases its resources.                       |

**Usage examples:**

```bash
# Opens the video stream for camera 1 in a browser.
http://localhost:5000/camera/1

# Checks the status of all active cameras.
http://localhost:5000/status

# Stops camera 1 and releases its resources.
http://localhost:5000/stop/1
```

---

## 🧰 System Requirements

| Component    | Recommended Version |
| ------------ | ------------------- |
| **Python**   | 3.9 or higher       |
| **Flask**    | 3.0+                |
| **Waitress** | 3.0+                |
| **OpenCV**   | 4.9+                |
| **NumPy**    | 1.25+               |

---

## ⚙️ Technical Notes

* Each camera runs in an independent thread, preventing the server from blocking.
* If a camera loses connection, the system attempts to reconnect automatically.
* The MJPEG output is sent using the MIME type `multipart/x-mixed-replace`, which is compatible with browsers and `<img>` tags.
* `Waitress` prevents the server from closing video connections too quickly, which can happen with the default Flask development server.
* Moderate resolutions, such as `960x540`, are recommended to reduce bandwidth usage.
* Deployment-specific data such as camera IP addresses, credentials, RTSP URLs, and internal network details should be stored locally and excluded from the public repository.

---
