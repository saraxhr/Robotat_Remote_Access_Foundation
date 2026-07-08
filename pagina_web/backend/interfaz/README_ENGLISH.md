# 🧩 Backend — Interface Module (Robotat UVG)

## 📘 Overview

This folder contains the **`interfaz`** module, a Django application that manages **authentication, user administration, and activity logging** within the Robotat UVG system.

It integrates the following functionalities:

* Login and logout with and without JWT.
* Role-based access control for administrators, students, and researchers.
* Password changes using secure validation policies.
* Session, login, and usage-statistics logging.
* Communication with the MQTT broker for Pololu robot control.

---

## 📂 File Structure

```text
interfaz/
│
├── admin.py                # Configures the user view in the Django admin panel.
├── apps.py                 # Defines the main application configuration class.
├── models.py               # Contains database models for users, sessions, and statistics.
├── serializers.py          # DRF serializers for users, passwords, and records.
├── serializers_jwt.py      # Custom JWT serializer for email-based login and additional claims.
└── views.py                # Main endpoints for authentication, CRUD operations, and MQTT communication.
```

---

## ⚙️ Required Dependencies

Before running the Django server, make sure the following libraries are installed:

```bash
# Installs Django as the main backend framework.
pip install django

# Installs Django REST Framework for API endpoint development.
pip install djangorestframework

# Installs SimpleJWT for JWT-based authentication.
pip install djangorestframework-simplejwt

# Installs the MQTT client library used to communicate with the MQTT broker.
pip install paho-mqtt

# Installs Daphne as the ASGI server used to run the Django application.
pip install daphne
```

---

## 🔐 Important Configuration

### 1. Register the application in `settings.py`

In the main project `settings.py` file, include the required applications:

```python
# Defines the Django applications enabled in the project.
INSTALLED_APPS = [
    # Keeps the default Django applications and any other installed apps.
    ...,

    # Enables Django REST Framework for API development.
    "rest_framework",

    # Enables JWT authentication through SimpleJWT.
    "rest_framework_simplejwt",

    # Enables the Robotat interface application.
    "interfaz",
]
```

### 2. Configure Django REST Framework and JWT

In `settings.py`, configure Django REST Framework to use JWT authentication:

```python
# Defines the default authentication and permission settings for the API.
REST_FRAMEWORK = {
    # Sets JWT authentication as the default authentication mechanism.
    "DEFAULT_AUTHENTICATION_CLASSES": (
        # Uses SimpleJWT to authenticate users through access tokens.
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),

    # Requires authenticated users by default for protected API endpoints.
    "DEFAULT_PERMISSION_CLASSES": (
        # Restricts access to authenticated users.
        "rest_framework.permissions.IsAuthenticated",
    ),
}
```

### 3. Configure the MQTT broker

Make sure the local or remote MQTT broker is configured correctly.
The MQTT integration depends on the `mqtt_bridge` module.

For a public repository, deployment-specific values such as broker IP addresses, usernames, passwords, or ports should be stored locally and replaced with placeholders or environment variables.

---

## 🔧 Running the Server

To run the backend using **Daphne** as the ASGI server:

```bash
# Runs the Django ASGI application on port 8000 using Daphne.
daphne -p 8000 robotat_web.asgi:application
```

---

## 🚀 Main Endpoints

| Method | Endpoint                            | Description                                               |
| ------ | ----------------------------------- | --------------------------------------------------------- |
| `POST` | `/api/login/`                       | Performs login using a custom JWT flow.                   |
| `POST` | `/api/login-simple/`                | Performs basic login without token generation.            |
| `POST` | `/api/logout/`                      | Logs out the user and calculates usage time.              |
| `POST` | `/api/auth/password/change/`        | Changes the password for an active authenticated session. |
| `POST` | `/api/auth/password/change-direct/` | Changes the password using user credentials.              |
| `GET`  | `/api/mi-perfil/`                   | Returns information about the authenticated user.         |
| `GET`  | `/api/logins/`                      | Lists the day’s login records. Admin-only endpoint.       |
| `GET`  | `/api/statistics/`                  | Displays daily usage statistics.                          |
| `POST` | `/api/enviar-comando/`              | Sends MQTT commands to the Pololu robot.                  |

---

## 💾 Defined Models

* **`UsuarioPersonalizado`**: Main custom user model based on `AbstractBaseUser`.
* **`LoginRecord`**: Records each login event.
* **`UserStatistic`**: Stores accumulated daily usage time.
* **`UserSession`**: Calculates the duration of active user sessions.

---

## 🧠 Additional Notes

* The main authentication field is **`email`**, not `username`.
* The custom JWT serializer includes the following fields in the token:

  * `email`
  * `nombre`
  * `role`
* API endpoints are protected using JWT authentication.
* The system automatically records user sessions and updates usage metrics when a session is closed.

---

## 🧩 MQTT Integration

The `/api/enviar-comando/` endpoint sends structured MQTT packets to the Pololu robot.

It depends on the `mqtt_bridge.mqtt_client` module located in:

```text
backend/mqtt_bridge/
```

Example JSON payload:

```json
{
  "src": 1,
  "pts": 5,
  "ptp": 10,
  "pid": 3,
  "cks": "a1b2c3",
  "pld": {
    "v_l": 0.2,
    "v_r": 0.2
  }
}
```

For the public repository, this example should remain generic and should not include real robot identifiers, internal IP addresses, credentials, tokens, or deployment-specific values.

---
