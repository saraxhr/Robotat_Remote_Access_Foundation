// ============================================================================
// Archivo: Layout.tsx
// Descripción: Shell principal de la aplicación que define la estructura
//              visual con barra lateral (sidebar), barra superior (topbar)
//              y área de contenido dinámico (children).
// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ============================================================================

import React, { ReactNode, useState, useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { Logo } from './Logo'

// Importación de íconos desde lucide-react para componer la interfaz
import {
  Sun,
  Moon,
  LogOut,
  Menu,
  X,
  Home,
  Users,
  Settings,
  Monitor,
  History,
  Download,
  FileText,
  Play,
  Bot,
  BarChart3,
} from 'lucide-react'
import { Activity } from 'lucide-react'

// Importación de herramientas de enrutamiento para navegación y detección de ruta activa
import { Link, useLocation, useNavigate } from 'react-router-dom'

// ---------------------------------------------------------------------------
// Tipado de propiedades del componente Layout
// ---------------------------------------------------------------------------
interface LayoutProps {
  children: ReactNode // Contenido que se renderiza dentro del layout
}

// ---------------------------------------------------------------------------
// Componente principal Layout
// ---------------------------------------------------------------------------
// Este componente organiza la estructura general de la aplicación, controlando
// la visualización de menús, temas y acceso a secciones según el rol del usuario.
export function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuth()              // Contexto de autenticación
  const { theme, toggleTheme } = useTheme()       // Contexto de tema visual
  const [sidebarOpen, setSidebarOpen] = useState(false) // Estado: visibilidad del sidebar en móvil
  const location = useLocation()                  // Ruta actual (para marcar ítem activo)
  const navigate = useNavigate()                  // Navegación programática (logout, redirección)

  // -------------------------------------------------------------------------
  // Generación segura de iniciales de usuario (evita errores con nombres vacíos)
  // -------------------------------------------------------------------------
  const userInitials = useMemo(() => {
    if (!user?.name) return '?'
    const parts = String(user.name).trim().split(/\s+/).filter(Boolean)
    return parts.map(p => p[0]?.toUpperCase() || '').join('').slice(0, 3) || '?'
  }, [user?.name])

  // -------------------------------------------------------------------------
  // Función de cierre de sesión: limpia el contexto y redirige al inicio
  // -------------------------------------------------------------------------
  const handleLogout = () => {
    try {
      logout()
    } finally {
      navigate('/')
    }
  }

  // -------------------------------------------------------------------------
  // Tipado del objeto de navegación del sidebar
  // -------------------------------------------------------------------------
  type NavItem = {
    name: string
    href: string
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  }

  // -------------------------------------------------------------------------
  // Generación dinámica del menú de navegación según el rol del usuario
  // -------------------------------------------------------------------------
  const navigationItems: NavItem[] = useMemo(() => {
    const SafeIcon = (IconComp: any) =>
      IconComp && typeof IconComp === 'function' ? IconComp : Home

    // Ítems comunes a cualquier usuario autenticado
    const common: NavItem[] = [
      { name: 'Dashboard', href: '/dashboard', icon: SafeIcon(Home) },
    ]

    // Si no hay usuario autenticado (páginas públicas)
    if (!user) return []

    // Menú para ADMINISTRADOR
    if (user.role === 'admin') {
      return [
        ...common,
        { name: 'Gestión de Usuarios', href: '/admin/usuarios', icon: SafeIcon(Users) },
        { name: 'Control del Lab', href: '/admin/lab-control', icon: SafeIcon(Settings) },
        { name: 'Monitoreo de Cámaras', href: '/admin/monitoreo', icon: SafeIcon(Monitor) },
        { name: 'Control del Pololu', href: '/admin/pololu', icon: SafeIcon(Bot) },
        { name: 'Logs MQTT', href: '/admin/logs', icon: SafeIcon(Activity) },
        { name: 'Análisis de Datos', href: '/admin/analisis', icon: SafeIcon(BarChart3) },
        { name: 'Historial', href: '/admin/historial', icon: SafeIcon(History) },
      ]
    }

    // Menú para ESTUDIANTE
    if (user.role === 'student') {
      return [
        ...common,
        { name: 'Mi Sesión', href: '/estudiante/sesion', icon: SafeIcon(Play) },
        { name: 'Mis Resultados', href: '/estudiante/resultados', icon: SafeIcon(Download) },
        { name: 'Material de Apoyo', href: '/estudiante/material', icon: SafeIcon(FileText) },
        { name: 'Logs MQTT', href: '/estudiante/logs', icon: SafeIcon(Activity) },
      ]
    }

    // Menú para INVESTIGADOR
    if (user.role === 'researcher') {
      return [
        ...common,
        { name: 'Experimentación', href: '/investigador/experimentacion', icon: SafeIcon(Play) },
        { name: 'Monitoreo de Cámaras', href: '/investigador/monitoreo', icon: SafeIcon(Monitor) },
        { name: 'Descarga de Datos', href: '/investigador/datos', icon: SafeIcon(Download) },
        { name: 'Registro de Pruebas', href: '/investigador/registro', icon: SafeIcon(FileText) },
        { name: 'Logs MQTT', href: '/investigador/logs', icon: SafeIcon(Activity) },
      ]
    }

    // Fallback para roles no reconocidos
    return common
  }, [user])

  // -------------------------------------------------------------------------
  // Layout simplificado para usuarios no autenticados (home, login, explorar)
  // -------------------------------------------------------------------------
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-uvg-green-light/10 to-uvg-yellow/10 dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
        {/* Botón de cambio de tema flotante */}
        <div className="absolute top-4 right-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300"
            aria-label="Cambiar tema"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-uvg-green-dark" />
            ) : (
              <Sun className="w-5 h-5 text-uvg-yellow" />
            )}
          </button>
        </div>

        {/* Renderizado del contenido público */}
        {children}
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Layout completo para usuarios autenticados (sidebar + topbar + contenido)
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      {/* Fondo translúcido para cerrar el sidebar en móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar lateral */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 shadow-xl transform transition-transform duration-300 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        {/* Encabezado del sidebar con logo y botón de cierre en móvil */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <Logo size="sm" />
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            aria-label="Cerrar menú lateral"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navegación lateral */}
        <nav className="mt-8 px-6">
          <ul className="space-y-2">
            {navigationItems.map(item => {
              const Icon = item.icon
              const isActive = location.pathname === item.href

              return (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-uvg-green-dark text-white shadow-lg'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-uvg-green-light/10 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>

      {/* Contenedor principal (contenido + barra superior) */}
      <div className="lg:ml-64">
        {/* Barra superior */}
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center gap-4">
              {/* Botón para abrir sidebar en dispositivos móviles */}
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Abrir menú lateral"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* Título dinámico según la ruta actual */}
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {location.pathname === '/dashboard' && 'Dashboard'}
                {location.pathname === '/admin/pololu' && 'Control del Pololu'}
                {location.pathname === '/investigador/experimentacion' && 'Experimentación'}
                {location.pathname === '/investigador/monitoreo' && 'Monitoreo de Cámaras'}
                {location.pathname === '/investigador/datos' && 'Descarga de Datos'}
                {location.pathname === '/investigador/registro' && 'Registro de Pruebas'}
                {location.pathname === '/admin/logs' && 'Logs MQTT'}
                {location.pathname === '/investigador/logs' && 'Logs MQTT'}
                {location.pathname === '/estudiante/logs' && 'Logs MQTT'}
              </h2>
            </div>

            {/* Controles derechos: tema, usuario, logout */}
            <div className="flex items-center gap-4">
              {/* Botón de tema */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                aria-label="Cambiar tema"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Sun className="w-5 h-5 text-uvg-yellow" />
                )}
              </button>

              {/* Información del usuario actual */}
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {user?.name || 'Usuario'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">
                    {user?.role || 'user'}
                  </p>
                </div>
                <div className="w-8 h-8 bg-uvg-green-dark rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {userInitials}
                  </span>
                </div>
              </div>

              {/* Botón de logout */}
              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Contenido dinámico (según la ruta actual) */}
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
