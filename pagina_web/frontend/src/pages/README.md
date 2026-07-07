
# 📁 Carpeta `pages` — Páginas principales del sistema Robotat

Esta carpeta contiene las páginas completas que conforman las vistas principales del sistema.  
Cada archivo define una sección funcional dentro del flujo de navegación del frontend.

---

## 📄 Archivos principales

| Archivo | Descripción | ¿Se puede modificar? |
|----------|--------------|----------------------|
| `HomePage.tsx` | Página pública principal. Presenta la introducción general del laboratorio, características del sistema, equipos disponibles y pie institucional. | ✅ Puede personalizarse libremente (textos, secciones o estilo). Mantener el componente `<Logo />` y los enlaces de navegación principales (`/login`, `/explorar`). |
| `LoginPage.tsx` | Página de inicio de sesión institucional. Incluye validación del dominio `@uvg.edu.gt`, persistencia opcional, manejo de errores y modal de cambio de contraseña con validaciones. | ⚙️ Puede modificarse con precaución. No eliminar llamadas a `useAuth()` ni la validación del correo institucional. |
| `Dashboard.tsx` | Panel principal del sistema. Muestra estadísticas, estado del laboratorio, actividad reciente y accesos rápidos según el rol del usuario (`admin`, `student`, `researcher`). | ⚙️ Puede ampliarse con nuevas métricas o componentes, pero **no eliminar la lógica que obtiene datos del backend (fetch)**. |
| `VisitorExploration.tsx` | Página pública de exploración del laboratorio. Permite visualizar transmisiones en vivo (Flask MJPEG) y demos pregrabados. | ⚙️ Puede personalizarse el contenido multimedia o agregar nuevos demos. Mantener la estructura principal del componente y los estados de cámara. |

---

## 🧭 Estructura de subcarpetas

```
pages/
├── admin/         # Secciones exclusivas para administradores
├── student/       # Secciones del estudiante (sesiones, prácticas, reportes)
└── researcher/    # Secciones del investigador (experimentos, resultados)
```

Estas subcarpetas se usan para agrupar las vistas según el rol del usuario autenticado.

---

## ⚙️ Ejecución

Para probar las páginas en modo desarrollo:

```bash
npm install
npm run dev
```

Luego abre [http://localhost:5173](http://localhost:5173) para navegar entre las rutas principales (`/`, `/login`, `/dashboard`, `/explorar`).

---

## 🧠 Notas

- Las rutas y roles se gestionan en `App.tsx` mediante React Router.  
- Las llamadas a `fetch` en `Dashboard.tsx` y `LoginPage.tsx` dependen del backend (Django REST Framework y microservidor Flask).  
- Evita modificar los `useEffect` o los estados que almacenan datos de usuario y autenticación.  
- `VisitorExploration.tsx` se conecta a Flask a través de las variables de entorno `VITE_FLASK_BASE` y `VITE_API_BASE`.
