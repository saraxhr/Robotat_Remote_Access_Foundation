
# 📁 Carpeta `admin` — Panel administrativo del sistema Robotat

Esta carpeta contiene las vistas y componentes exclusivos del rol **Administrador** dentro del sistema Robotat.  
Desde estas páginas se gestionan usuarios, dispositivos, cámaras, robots, logs y análisis de datos del laboratorio.

---

## 📄 Archivos principales

| Archivo | Descripción | ¿Se puede modificar? |
|----------|--------------|----------------------|
| `UserManagement.tsx` | Permite administrar las cuentas de usuario: creación, edición, eliminación y asignación de roles (`admin`, `student`, `researcher`). Incluye validación de correos institucionales. | ⚙️ Puede modificarse en diseño o validaciones, pero no eliminar las llamadas a la API (`fetchUsers`, `updateUser`, `deleteUser`). |
| `PololuControl.tsx` | Interfaz de control remoto para los robots **Pololu 3Pi+**. Permite enviar comandos MQTT, visualizar estado y telemetría. | ⚙️ Puede modificarse en interfaz, pero mantener la lógica MQTT (`publishPololuCommand`) y los tópicos definidos. |
| `CameraMonitoring.tsx` | Página de visualización de cámaras IP (Amcrest). Muestra transmisiones RTSP/MJPEG, control PTZ (pan, tilt, zoom) y grabación local. | ⚙️ Se puede cambiar el diseño, pero no modificar las rutas RTSP ni la estructura de control PTZ. |
| `LabControl.tsx` | Panel principal de control de dispositivos del laboratorio (robots, cámaras, sensores). Permite monitorear estado, reiniciar y probar conectividad. | ⚠️ No eliminar funciones `toggleDevice()` ni `restartDevice()` ya que controlan los estados dinámicos de dispositivos. |
| `MQTTLogs.tsx` | Muestra el registro de mensajes publicados y suscritos en el broker MQTT. Incluye filtros por tópico, fecha y tipo de mensaje. | ⚙️ Se puede ampliar con nuevas columnas o filtros, pero mantener la suscripción base al tópico `robotat/logs/#`. |
| `DataAnalysis.tsx` | Página de análisis de datos capturados del laboratorio (trayectorias, tiempos, errores, rendimiento). Visualiza resultados con gráficos. | ✅ Se puede personalizar libremente para agregar visualizaciones nuevas o integraciones con librerías externas. |
| `AdminHistory.tsx` | Historial completo de eventos administrativos: logins, cambios de rol, y modificaciones en la red local. | ⚙️ Puede modificarse en formato o filtros, pero mantener la llamada a `fetchHistoryData()`. |

---

## ⚙️ Estructura del panel administrativo

```
pages/admin/
│
├── UserManagement.tsx      # Gestión de usuarios y roles
├── PololuControl.tsx       # Control remoto de robots Pololu 3Pi+
├── CameraMonitoring.tsx    # Monitoreo y control de cámaras IP
├── LabControl.tsx          # Administración general del laboratorio
├── MQTTLogs.tsx            # Registro de tópicos MQTT
├── DataAnalysis.tsx        # Análisis de datos y métricas
└── AdminHistory.tsx        # Historial de eventos administrativos
```

---

## 🧠 Notas importantes

- Estas páginas están protegidas por autenticación (`AuthContext`) y solo accesibles para usuarios con rol **Administrador**.  
- No eliminar los hooks `useAuth` ni `useEffect` que realizan llamadas al backend o al broker MQTT.  
- Los íconos utilizados (`lucide-react`) y los estilos (`TailwindCSS`) pueden personalizarse libremente.  
- Si se agregan nuevas funciones administrativas, deben registrarse en `App.tsx` dentro del grupo de rutas del rol *admin*.

---

## 🧰 Comandos de ejecución

Para ejecutar el panel administrativo localmente:

```bash
npm install
npm run dev
```

Accede luego a:  
👉 [http://localhost:5173/dashboard/admin](http://localhost:5173/dashboard/admin)
