
# 📁 Carpeta `researcher` — Panel de investigación del sistema Robotat

Esta carpeta contiene las vistas dedicadas al **rol Investigador**, enfocadas en la observación, registro y análisis de datos experimentales dentro del laboratorio Robotat.

---

## 📄 Archivos principales

| Archivo | Descripción | ¿Se puede modificar? |
|----------|--------------|----------------------|
| `Experimentation.tsx` | Interfaz para ejecutar y supervisar experimentos. Permite iniciar, pausar y detener pruebas, así como monitorear variables en tiempo real. | ⚙️ Puede modificarse en diseño, pero no eliminar la lógica de control de experimentos ni las conexiones a MQTT. |
| `DataDownload.tsx` | Módulo para descargar datos de experimentos completados. Permite seleccionar registros, generar reportes y exportar archivos en formato CSV o JSON. | ✅ Puede personalizarse completamente (formatos, filtros o botones). Mantener la ruta de descarga configurada hacia el backend. |
| `TestRegistry.tsx` | Registro digital de experimentos realizados. Permite crear, visualizar y filtrar registros según estado, fecha, investigador o publicación. | ⚙️ Puede modificarse libremente en interfaz o filtros, pero mantener los estados y validaciones principales. |
| `MQTTLogs.tsx` | Monitoreo en tiempo real de mensajes MQTT relacionados con los experimentos. Muestra tópicos, agentes, tipo de mensaje y permite exportar logs. | ⚠️ No modificar la lógica WebSocket ni el manejo de `subscriptionsRef` y `isPausedRef`. Se pueden ajustar estilos o filtros. |
| `CameraMonitoring.tsx` | Permite observar transmisiones en vivo desde las cámaras PTZ y gestionar ángulos, zoom y grabaciones de sesiones experimentales. | ⚙️ Puede modificarse el diseño o agregar nuevas cámaras, pero mantener los comandos PTZ y rutas RTSP. |

---

## 🧭 Estructura general

```
pages/researcher/
│
├── Experimentation.tsx    # Ejecución y monitoreo de experimentos
├── DataDownload.tsx       # Descarga de datos experimentales
├── TestRegistry.tsx       # Registro de pruebas y publicaciones
├── MQTTLogs.tsx           # Monitoreo de mensajes MQTT
└── CameraMonitoring.tsx   # Visualización de cámaras PTZ
```

---

## 🧠 Notas importantes

- Estas vistas están **protegidas por autenticación** y solo son accesibles para usuarios con rol *researcher*.  
- No eliminar los hooks `useAuth` ni las conexiones WebSocket que reciben datos del backend.  
- Los íconos de `lucide-react` y estilos de TailwindCSS pueden personalizarse libremente.  
- Si se agregan nuevos módulos de investigación, deben registrarse en el grupo de rutas de investigadores en `App.tsx`.

---

## ⚙️ Ejecución local

Para ejecutar el entorno del investigador:

```bash
npm install
npm run dev
```

Luego acceder a:  
👉 [http://localhost:5173/dashboard/researcher](http://localhost:5173/dashboard/researcher)
