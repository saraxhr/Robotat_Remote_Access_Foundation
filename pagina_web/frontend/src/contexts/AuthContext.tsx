// ============================================================================
// Archivo: AuthContext.tsx
// Descripción: Contexto global de autenticación. Gestiona sesión de usuario,
//              tokens JWT, validación de roles y persistencia en localStorage.
// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ============================================================================

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react'

// ---------------------------------------------------------------------------
// Tipos de rol válidos reconocidos por el frontend
// ---------------------------------------------------------------------------
export type UserRole = 'admin' | 'student' | 'researcher'

// ---------------------------------------------------------------------------
// Estructura del objeto de usuario manejado en el frontend
// ---------------------------------------------------------------------------
export interface User {
  id?: string
  name: string
  email: string
  role: UserRole
  avatar?: string
}

// ---------------------------------------------------------------------------
// Estructura del contexto de autenticación expuesto a los componentes
// ---------------------------------------------------------------------------
interface AuthContextType {
  user: User | null                          // Usuario actual o null si no hay sesión
  login: (email: string, password: string, remember: boolean) => Promise<boolean>
  logout: () => void                         // Limpia sesión y tokens
  isLoading: boolean                         // Bandera para indicar estado de carga global
}

// ---------------------------------------------------------------------------
// Creación del contexto tipado. Puede ser undefined hasta que se inicialice.
// ---------------------------------------------------------------------------
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ============================================================================
// AuthProvider — Proveedor principal del contexto de autenticación
// ============================================================================
// Este componente envuelve toda la aplicación, controlando la sesión,
// el almacenamiento de tokens y la comunicación con el backend.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null) // Estado del usuario autenticado
  const [isLoading, setIsLoading] = useState(true)    // Estado de carga inicial

  // -------------------------------------------------------------------------
  // Funciones auxiliares para manipular tokens y datos en localStorage
  // -------------------------------------------------------------------------
  const getStoredToken = (): string | null => {
    const tokenA = localStorage.getItem('robotat_token')
    const tokenB = localStorage.getItem('accessToken')
    return tokenA || tokenB
  }

  const persistToken = (token: string, remember: boolean) => {
    if (remember) {
      localStorage.setItem('robotat_token', token)
      localStorage.setItem('accessToken', token)
    } else {
      localStorage.setItem('robotat_token', token)
      localStorage.setItem('accessToken', token)
    }
  }

  const clearStoredAuth = () => {
    localStorage.removeItem('robotat_token')
    localStorage.removeItem('accessToken')
    localStorage.removeItem('robotat_user')
  }

  // -------------------------------------------------------------------------
  // useEffect: al montar el proveedor, intenta restaurar una sesión previa
  // -------------------------------------------------------------------------
  useEffect(() => {
    const storedUser = localStorage.getItem('robotat_user')
    const storedToken = getStoredToken()

    if (storedToken) {
      fetchUserProfile(storedToken, !!storedUser).finally(() => setIsLoading(false))
    } else {
      setIsLoading(false)
    }
  }, [])

  // -------------------------------------------------------------------------
  // login: realiza la autenticación contra el backend y obtiene el perfil
  // -------------------------------------------------------------------------
  const login = async (email: string, password: string, remember: boolean): Promise<boolean> => {
    setIsLoading(true)

    // Validación rápida del dominio institucional
    if (!email.endsWith('@uvg.edu.gt')) {
      setIsLoading(false)
      return false
    }

    try {
      const tokenResponse = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!tokenResponse.ok) {
        setIsLoading(false)
        return false
      }

      const tokenData = await tokenResponse.json()
      const accessToken = tokenData.access as string

      persistToken(accessToken, remember)
      return await fetchUserProfile(accessToken, true)
    } catch (error) {
      console.error('Error en login:', error)
      setIsLoading(false)
      return false
    }
  }

  // -------------------------------------------------------------------------
  // fetchUserProfile: obtiene información del usuario desde el backend
  // -------------------------------------------------------------------------
  const fetchUserProfile = async (token: string, persist: boolean = true): Promise<boolean> => {
    try {
      const profileResponse = await fetch('http://localhost:8000/api/mi-perfil/', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!profileResponse.ok) {
        console.warn('Token inválido o expirado.')
        logout()
        return false
      }

      const profileData = await profileResponse.json()

      // Normalización del rol recibido desde el backend
      let mappedRole: UserRole
      switch (profileData.role || profileData.rol) {
        case 'admin':
        case 'Administrador':
          mappedRole = 'admin'
          break
        case 'student':
        case 'Estudiante':
          mappedRole = 'student'
          break
        case 'researcher':
        case 'Investigador':
          mappedRole = 'researcher'
          break
        default:
          mappedRole = 'student'
      }

      const userData: User = {
        id: String(profileData.id ?? ''),
        name: profileData.nombre,
        email: profileData.email,
        role: mappedRole,
      }

      setUser(userData)

      if (persist) {
        localStorage.setItem('robotat_user', JSON.stringify(userData))
      }

      setIsLoading(false)
      return true
    } catch (error) {
      console.error('Error al obtener el perfil del usuario:', error)
      setIsLoading(false)
      return false
    }
  }

  // -------------------------------------------------------------------------
  // logout: elimina datos del usuario y limpia almacenamiento local
  // -------------------------------------------------------------------------
  const logout = () => {
    setUser(null)
    clearStoredAuth()
  }

  // -------------------------------------------------------------------------
  // Renderizado del proveedor con el valor del contexto disponible
  // -------------------------------------------------------------------------
  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================================
// Hook personalizado: useAuth
// Permite acceder al contexto desde cualquier componente de forma segura.
// ============================================================================
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
