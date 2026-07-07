
# 📁 Carpeta `student` — Panel del estudiante del sistema Robotat

Esta carpeta contiene las vistas diseñadas para el **rol Estudiante**, centradas en la interacción con el laboratorio Robotat, revisión de resultados, materiales de apoyo y monitoreo de sesiones en tiempo real.

---

## 📄 Archivos principales

| Archivo | Descripción | ¿Se puede modificar? |
|----------|--------------|----------------------|
| `StudentSession.tsx` | Permite a los estudiantes conectarse a una sesión activa del laboratorio. Muestra el estado del robot asignado, instrucciones y conexión MQTT. | ⚠️ No eliminar la lógica de conexión MQTT ni los hooks `useEffect` relacionados con la suscripción de datos. Se puede modificar la interfaz o el texto. |
| `StudyMaterials.tsx` | Página con recursos de aprendizaje, guías de prácticas, videos y documentación sobre los robots del laboratorio. | ✅ Puede modificarse libremente (contenido y formato). Mantener el manejo de rutas si se agregan enlaces externos. |
| `StudentResults.tsx` | Muestra los resultados de las sesiones realizadas (trayectorias, errores, tiempos, desempeño). Permite filtrar y exportar datos. | ⚙️ Puede personalizarse en diseño o agregar nuevos filtros. No eliminar las funciones de carga de datos (`fetchResults`). |
| `MQTTLogs.tsx` | Permite a los estudiantes visualizar los mensajes MQTT relevantes de su sesión (por ejemplo, estado de conexión o comandos ejecutados). | ⚠️ No modificar la lógica MQTT ni la suscripción al tópico correspondiente (`student/logs/#`). Se pueden ajustar los estilos o formato de tabla. |

---

## 🧭 Estructura de la carpeta

```
pages/student/
│
├── StudentSession.tsx     # Conexión y control de la sesión activa
├── StudyMaterials.tsx     # Materiales de apoyo y guías del laboratorio
├── StudentResults.tsx     # Visualización y análisis de resultados
└── MQTTLogs.tsx           # Registro de mensajes MQTT del estudiante
```

---

## 🧠 Notas importantes

- Todas las páginas de esta carpeta están **protegidas por autenticación** (`AuthContext`) y accesibles solo a usuarios con rol *student*.
- No eliminar los hooks `useAuth` ni los efectos (`useEffect`) que realizan la comunicación con el broker MQTT o con el backend Django.
- Los íconos (`lucide-react`) y estilos (`TailwindCSS`) pueden modificarse libremente.
- Si se agregan nuevas páginas para los estudiantes, deben registrarse dentro del grupo de rutas de *student* en `App.tsx`.

---

## ⚙️ Ejecución local

Para ejecutar la sección del estudiante:

```bash
npm install
npm run dev
```

Luego acceder a:  
👉 [http://localhost:5173/dashboard/student](http://localhost:5173/dashboard/student)
