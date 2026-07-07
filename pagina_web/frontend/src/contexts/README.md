
# 📁 Carpeta `contexts` — Contextos globales de la aplicación

Esta carpeta contiene los **contextos de React** que administran el estado global del frontend.  
Los contextos permiten compartir información (como autenticación o tema visual) entre todos los componentes sin necesidad de pasar props manualmente.

---

## 📄 Archivos principales

| Archivo | Descripción | ¿Se puede modificar? |
|----------|--------------|----------------------|
| `AuthContext.tsx` | Gestiona la autenticación del usuario: inicio y cierre de sesión, validación del token JWT, persistencia de sesión en `localStorage` y control de roles (`admin`, `student`, `researcher`). | ⚙️ Puede modificarse **solo si se actualiza la estructura del backend o las rutas de autenticación**. No eliminar la lógica de `login`, `logout` o `fetchUserProfile`. |
| `ThemeContext.tsx` | Controla el modo visual (claro/oscuro) de la aplicación. Sincroniza la preferencia del usuario con el sistema operativo y la almacena en `localStorage`. | ✅ Puede personalizarse (por ejemplo, añadir más temas o cambiar colores). Mantener la lógica principal de `toggleTheme`. |

---

## 🧠 Notas importantes

- Ambos contextos deben mantenerse **activos y sin eliminar**: son fundamentales para el correcto funcionamiento de la aplicación.  
- `AuthContext.tsx` depende de la comunicación con el backend (rutas `/api/token/` y `/api/mi-perfil/`). Si estas cambian, deben ajustarse las URLs.  
- `ThemeContext.tsx` no debe eliminar la línea `document.documentElement.classList.toggle('dark', theme === 'dark')`, ya que controla la clase global para TailwindCSS.  

---

## ⚙️ Uso en la aplicación

Estos contextos se inicializan en el archivo `App.tsx`:

```tsx
import { AuthProvider } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        {/* Resto de la aplicación */}
      </AuthProvider>
    </ThemeProvider>
  )
}
```

Los componentes pueden acceder a sus valores mediante los hooks personalizados:

```tsx
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'

const { user, login, logout } = useAuth()
const { theme, toggleTheme } = useTheme()
```

---

## 🚫 No modificar directamente
- La estructura del objeto `User` en `AuthContext.tsx`.
- La inicialización del contexto (`createContext(...)`).
- El orden de los `Providers` en `App.tsx`.

Modificar estas secciones puede provocar errores globales en la autenticación o renderizado.
