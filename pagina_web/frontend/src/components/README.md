
# 📁 Carpeta `components` — Componentes reutilizables

Esta carpeta contiene los **componentes visuales reutilizables** del frontend.  
En este caso, incluye la estructura general de la aplicación y el logotipo institucional del sistema Robotat.

---

## 📄 Archivos principales

| Archivo | Descripción | ¿Se puede modificar? |
|----------|--------------|----------------------|
| `Layout.tsx` | Define la estructura visual general (sidebar, topbar y área de contenido). Gestiona el tema (claro/oscuro), la navegación y los roles de usuario. | ⚙️ Puede modificarse con precaución. No eliminar llamadas a `useAuth`, `useTheme` ni `children`. |
| `Logo.tsx` | Muestra el logotipo del sistema con el ícono del robot y el texto “Robotat – Laboratorio UVG”. Permite definir tamaño (`sm`, `md`, `lg`) y animación opcional. | ✅ Puede personalizarse (colores, tamaños o texto), pero no eliminar la estructura principal del componente. |

---

## 🧠 Notas

- Ambos componentes son **centrales para la identidad visual del sistema**.  
- `Layout.tsx` controla la barra lateral, tema visual, logout y rutas activas; su lógica debe mantenerse intacta para evitar errores de navegación.  
- `Logo.tsx` puede adaptarse a nuevas variantes gráficas, manteniendo el ícono principal o reemplazándolo por una versión SVG personalizada.  

---

## ⚙️ Uso en el proyecto

Estos componentes se importan en el nivel superior del frontend:

```tsx
// En App.tsx
import { Layout } from './components/Layout'
import { Logo } from './components/Logo'
```

Ambos se renderizan en toda la aplicación, asegurando consistencia visual entre secciones.
