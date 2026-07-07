# 📦 Carpeta — `pagina_web`

La carpeta `pagina_web` contiene los archivos fundamentales para la configuración y ejecución del entorno de desarrollo y despliegue del sistema. En ella se incluyen:

- `manage.py`
- `package.json`
- `package-lock.json`
- `requirements.txt`

---

## 1) `manage.py` (Django)

### 🧠 Descripción
Archivo de utilidad de Django utilizado para la ejecución de tareas administrativas como migraciones, creación de superusuarios y administración general del proyecto.

### ⚙️ Generación
El archivo se crea automáticamente al iniciar un nuevo proyecto Django mediante el comando:

```bash
django-admin startproject robotat_web
```

Este proceso genera la siguiente estructura:

```txt
backend/
├─ manage.py
└─ robotat_web/
   ├─ settings.py
   ├─ urls.py
   ├─ asgi.py
   └─ wsgi.py
```

El archivo `manage.py` establece la variable de entorno `DJANGO_SETTINGS_MODULE` apuntando a `robotat_web.settings`.

### ▶️ Comandos principales
```bash
python manage.py migrate
python manage.py createsuperuser
python manage.py startapp nombre_app
python manage.py runserver
```

### 💡 Ejecución con Daphne
En este proyecto, el servidor se ejecuta con **Daphne**, que utiliza la interfaz ASGI:

```bash
daphne -p 8000 robotat_web.asgi:application
```

El archivo `manage.py` continúa siendo necesario para todas las operaciones administrativas del entorno Django.

---

## 2) `package.json` (Node.js / npm)

### 🧠 Descripción
Archivo de configuración que define el entorno JavaScript del proyecto. Contiene las dependencias, scripts y metadatos necesarios para el frontend implementado con React y Vite.

### ⚙️ Generación
Se genera al inicializar un proyecto con npm:

```bash
npm init -y
```

Para un entorno React con Vite y TypeScript, se utiliza el siguiente comando:

```bash
npm create vite@latest frontend -- --template react-ts
cd frontend
npm install
```

Esto produce un `package.json` dentro de la carpeta `frontend` con la configuración correspondiente.

### ➕ Instalación de dependencias
```bash
npm install react react-dom
npm install -D @types/node typescript vite
```

### ▶️ Scripts principales
```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

Comandos de ejecución:

```bash
npm run dev
npm run build
npm run preview
```

---

## 3) `package-lock.json` (npm lockfile)

### 🧠 Descripción
Archivo autogenerado por npm que registra las versiones exactas de las dependencias instaladas. Garantiza que las instalaciones sean reproducibles en diferentes entornos.

### ⚙️ Generación
Se crea o actualiza automáticamente al instalar dependencias:

```bash
npm install
```

### 🔁 Instalación reproducible
```bash
npm ci
```

El comando `npm ci` instala las dependencias utilizando exactamente las versiones registradas en el `package-lock.json`.

---

## 4) `requirements.txt` (Python)

### 🧠 Descripción
Lista de dependencias necesarias para la ejecución del backend en Django. Contiene los paquetes y versiones utilizados por el proyecto.

### ⚙️ Generación
Dentro del entorno virtual, después de instalar los paquetes requeridos:

```bash
pip install django djangorestframework djangorestframework-simplejwt daphne requests numpy opencv-python
pip freeze > requirements.txt
```

Para instalar las dependencias registradas:

```bash
pip install -r requirements.txt
```

### 📦 Paquetes principales
- `Django`, `djangorestframework`, `djangorestframework-simplejwt` (API y autenticación)
- `daphne` (servidor ASGI)
- `requests`, `numpy`, `opencv-python` (procesamiento de datos y comunicación)

---

## ✅ Resumen
- **`manage.py`**: generado por `startproject`; ejecuta tareas administrativas de Django.  
- **`package.json`**: generado por `npm init`; define dependencias y scripts del entorno JavaScript.  
- **`package-lock.json`**: creado por `npm install`; bloquea versiones exactas de dependencias.  
- **`requirements.txt`**: generado con `pip freeze`; contiene las dependencias de Python del proyecto.
