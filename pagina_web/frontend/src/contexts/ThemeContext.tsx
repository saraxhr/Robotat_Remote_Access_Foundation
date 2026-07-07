// ============================================================================
// Archivo: ThemeContext.tsx
// Descripción: Contexto global para la gestión del tema visual (claro/oscuro)
//              del frontend. Permite alternar entre modos, almacenar la
//              preferencia del usuario y sincronizar con la configuración
//              del sistema operativo.
// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ============================================================================

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Definición del tipo Theme con las opciones disponibles
// ---------------------------------------------------------------------------
type Theme = 'light' | 'dark'

// ---------------------------------------------------------------------------
// Estructura del contexto de tema expuesto a la aplicación
// ---------------------------------------------------------------------------
interface ThemeContextType {
  theme: Theme                    // Tema actual (claro u oscuro)
  toggleTheme: () => void         // Función para alternar entre temas
}

// ---------------------------------------------------------------------------
// Creación del contexto con tipo definido
// ---------------------------------------------------------------------------
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

// ============================================================================
// ThemeProvider — Proveedor global del contexto de tema
// ============================================================================
// Este componente encapsula toda la aplicación y administra el estado del
// tema visual, sincronizando la preferencia entre sesiones y con el sistema.
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light') // Estado inicial: modo claro

  // -------------------------------------------------------------------------
  // Efecto: al montar, carga el tema guardado o detecta la preferencia del SO
  // -------------------------------------------------------------------------
  useEffect(() => {
    const savedTheme = localStorage.getItem('robotat_theme') as Theme
    if (savedTheme) {
      setTheme(savedTheme)
    } else {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      setTheme(systemTheme)
    }
  }, [])

  // -------------------------------------------------------------------------
  // Efecto: actualiza la clase del <html> y guarda el tema actual en storage
  // -------------------------------------------------------------------------
  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('robotat_theme', theme)
  }, [theme])

  // -------------------------------------------------------------------------
  // Función para alternar entre los modos claro y oscuro
  // -------------------------------------------------------------------------
  const toggleTheme = () => {
    setTheme(prev => (prev === 'light' ? 'dark' : 'light'))
  }

  // -------------------------------------------------------------------------
  // Renderiza el proveedor del contexto con el valor actual del tema
  // -------------------------------------------------------------------------
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

// ============================================================================
// Hook personalizado: useTheme
// Permite consumir el contexto de tema desde cualquier componente.
// ============================================================================
export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
