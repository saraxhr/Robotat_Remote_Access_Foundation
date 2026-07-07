// ============================================================================
// Archivo: Dashboard.tsx
// Descripción: Panel principal de control. Presenta estadísticas dinámicas,
//              estado del laboratorio, actividad reciente y accesos rápidos
//              según el rol del usuario (administrador, estudiante o investigador).
// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ============================================================================

import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Users,
  Activity,
  Clock,
  Camera,
  Bot,
  TrendingUp,
  Calendar,
  Play,
  Monitor,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Componente principal Dashboard
// ---------------------------------------------------------------------------
// Este componente genera el panel de inicio con datos dinámicos obtenidos
// del backend, mostrando métricas y acciones adaptadas al rol del usuario.
export function Dashboard() {
  const { user } = useAuth()

  // Estados para almacenar información obtenida del backend
  const [users, setUsers] = useState<any[]>([])
  const [userLogins, setUserLogins] = useState<any[]>([])
  const [userStats, setUserStats] = useState<any[]>([])

  // -------------------------------------------------------------------------
  // Efecto: carga inicial de datos desde el backend (Django)
  // -------------------------------------------------------------------------
  useEffect(() => {
    const token =
      localStorage.getItem('robotat_token') ||
      localStorage.getItem('accessToken')
    console.log('Token cargado por Dashboard:', token)
    if (!token) return

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    }

    Promise.all([
      fetch('http://localhost:8000/api/usuarios/', { headers }),
      fetch('http://localhost:8000/api/logins/', { headers }),
      fetch('http://localhost:8000/api/estadisticas/', { headers }),
    ])
      .then(async ([usersRes, loginsRes, statsRes]) => {
        const usersJson = usersRes.ok ? await usersRes.json() : []
        const loginsJson = loginsRes.ok ? await loginsRes.json() : []
        const statsJson = statsRes.ok ? await statsRes.json() : []

        // Si la respuesta de usuarios viene paginada, extrae el array results
        const usersData = Array.isArray(usersJson)
          ? usersJson
          : usersJson.results || []

        setUsers(usersData)
        setUserLogins(Array.isArray(loginsJson) ? loginsJson : [])
        setUserStats(Array.isArray(statsJson) ? statsJson : [])
      })
      .catch(err =>
        console.error('Error cargando datos del dashboard:', err)
      )
  }, [])

  // -------------------------------------------------------------------------
  // Genera mensaje de bienvenida dinámico según la hora del día
  // -------------------------------------------------------------------------
  const getWelcomeMessage = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Buenos días'
    if (hour < 18) return 'Buenas tardes'
    return 'Buenas noches'
  }

  // -------------------------------------------------------------------------
  // Calcula estadísticas principales en función del rol del usuario
  // -------------------------------------------------------------------------
  const getStatsForRole = () => {
    // ADMIN: muestra métricas reales obtenidas desde el backend
    if (user?.role === 'admin') {
      const activeUsers = users.filter(u => u.is_active).length || 0
      const sessionsToday = userLogins.length || 0

      // Cálculo del tiempo promedio de uso
      const totalTime = userStats.reduce(
        (acc: number, u: any) => acc + (u.total_time || 0),
        0
      )
      const avgSeconds = userStats.length
        ? totalTime / userStats.length
        : 0

      // Función para formatear valores de tiempo según su magnitud
      const formatTime = (seconds: number): string => {
        if (seconds > 1000) {
          const h = Math.floor(seconds / 3600)
          const m = Math.floor((seconds % 3600) / 60)
          const s = Math.floor(seconds % 60)
          return `${h}h ${m}m ${s}s`
        } else if (seconds > 10 && seconds < 1000) {
          const h = Math.floor(seconds / 60)
          const m = Math.floor(seconds % 60)
          return `${h}h ${m}m`
        } else {
          const h = seconds
          const m = Math.floor((h % 1) * 60)
          return `${Math.floor(h)}h ${m}m`
        }
      }

      const avgDisplay = formatTime(avgSeconds)

      return [
        { label: 'Usuarios Activos', value: `${activeUsers}`, icon: Users, color: 'text-blue-600' },
        { label: 'Robots Conectados', value: '3/5', icon: Bot, color: 'text-green-600' },
        { label: 'Sesiones Hoy', value: `${sessionsToday}`, icon: Activity, color: 'text-purple-600' },
        { label: 'Tiempo Promedio', value: avgDisplay, icon: Clock, color: 'text-orange-600' },
      ]
    }

    // STUDENT: estadísticas simuladas para vistas del estudiante
    if (user?.role === 'student') {
      return [
        { label: 'Sesiones Completadas', value: '12', icon: Play, color: 'text-blue-600' },
        { label: 'Tiempo Total', value: '8.5h', icon: Clock, color: 'text-green-600' },
        { label: 'Experimentos', value: '5', icon: Calendar, color: 'text-purple-600' },
        { label: 'Resultados', value: '4', icon: TrendingUp, color: 'text-orange-600' },
      ]
    }

    // RESEARCHER: estadísticas simuladas para vistas del investigador
    if (user?.role === 'researcher') {
      return [
        { label: 'Experimentos', value: '8', icon: Play, color: 'text-blue-600' },
        { label: 'Datos Recolectados', value: '2.1GB', icon: TrendingUp, color: 'text-green-600' },
        { label: 'Tiempo Laboratorio', value: '32h', icon: Clock, color: 'text-purple-600' },
        { label: 'Publicaciones', value: '2', icon: Activity, color: 'text-orange-600' },
      ]
    }

    return []
  }

  const stats = getStatsForRole()

  // -------------------------------------------------------------------------
  // Genera actividad reciente (mock o simulada según rol)
  // -------------------------------------------------------------------------
  const getRecentActivity = () => {
    if (user?.role === 'admin') {
      return [
        { time: '10:30 AM', action: 'Juan López inició sesión con Robot Pololu', type: 'info' },
        { time: '10:15 AM', action: 'María García completó experimento MaxArm', type: 'success' },
        { time: '09:45 AM', action: 'Sistema de cámaras reiniciado automáticamente', type: 'warning' },
        { time: '09:30 AM', action: 'Roberto Martínez reservó laboratorio 2-4 PM', type: 'info' },
      ]
    }

    if (user?.role === 'student') {
      return [
        { time: 'Ayer', action: 'Completaste práctica de navegación autónoma', type: 'success' },
        { time: '2 días', action: 'Descargaste resultados de sesión #11', type: 'info' },
        { time: '3 días', action: 'Reservaste laboratorio para mañana 2-4 PM', type: 'info' },
        { time: '1 semana', action: 'Iniciaste primera sesión con Robot Pololu', type: 'success' },
      ]
    }

    return [
      { time: 'Hoy', action: 'Experimento de manipulación completado', type: 'success' },
      { time: 'Ayer', action: 'Datos exportados (500MB)', type: 'info' },
      { time: '2 días', action: 'Sesión de calibración con MaxArm', type: 'info' },
      { time: '3 días', action: 'Nuevo registro de prueba creado', type: 'success' },
    ]
  }

  const recentActivity = getRecentActivity()

  // -------------------------------------------------------------------------
  // Renderizado principal del panel
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Sección de bienvenida */}
      <div className="bg-gradient-to-r from-uvg-green-dark to-uvg-green-light text-white rounded-xl p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              {getWelcomeMessage()}, {user?.name}
            </h1>
            <p className="text-uvg-green-light/80 capitalize">
              Panel de control - {user?.role === 'admin'
                ? 'Administrador'
                : user?.role === 'student'
                ? 'Estudiante'
                : 'Investigador'}
            </p>
          </div>
          <div className="hidden md:block">
            <Bot className="w-16 h-16 text-uvg-yellow opacity-80" />
          </div>
        </div>
      </div>

      {/* Sección de estadísticas (tarjetas) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon
          return (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          )
        })}
      </div>

      {/* Estado del laboratorio y actividad reciente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estado del laboratorio */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Monitor className="w-6 h-6 text-uvg-green-dark" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Estado del Laboratorio
            </h3>
          </div>

          <div className="space-y-4">
            {/* Ejemplo de recursos del laboratorio */}
            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-900 dark:text-white font-medium">
                  Robot Pololu #1
                </span>
              </div>
              <span className="text-green-600 dark:text-green-400 text-sm">
                En línea
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-900 dark:text-white font-medium">
                  MaxArm Robot
                </span>
              </div>
              <span className="text-green-600 dark:text-green-400 text-sm">
                Disponible
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-gray-900 dark:text-white font-medium">
                  Cámara PTZ #3
                </span>
              </div>
              <span className="text-yellow-600 dark:text-yellow-400 text-sm">
                Mantenimiento
              </span>
            </div>

            <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-900 dark:text-white font-medium">
                  Sistema de Cámaras
                </span>
              </div>
              <span className="text-green-600 dark:text-green-400 text-sm">
                6/6 activas
              </span>
            </div>
          </div>
        </div>

        {/* Actividad reciente */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="w-6 h-6 text-uvg-green-dark" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Actividad Reciente
            </h3>
          </div>

          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200"
              >
                <div
                  className={`w-2 h-2 rounded-full mt-2 ${
                    activity.type === 'success'
                      ? 'bg-green-500'
                      : activity.type === 'warning'
                      ? 'bg-yellow-500'
                      : 'bg-blue-500'
                  }`}
                ></div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.action}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {activity.time}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Acciones rápidas (solo para administradores) */}
      {user?.role === 'admin' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Acciones Rápidas
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-4 bg-uvg-green-light/10 hover:bg-uvg-green-light/20 rounded-lg transition-colors duration-200 text-left">
              <Users className="w-6 h-6 text-uvg-green-dark mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">
                Gestionar Usuarios
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Crear o editar cuentas
              </p>
            </button>
            <button className="p-4 bg-uvg-yellow/10 hover:bg-uvg-yellow/20 rounded-lg transition-colors duration-200 text-left">
              <Monitor className="w-6 h-6 text-uvg-green-dark mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">
                Control del Lab
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Administrar dispositivos
              </p>
            </button>
            <button className="p-4 bg-uvg-green-dark/10 hover:bg-uvg-green-dark/20 rounded-lg transition-colors duration-200 text-left">
              <Camera className="w-6 h-6 text-uvg-green-dark mb-2" />
              <p className="font-medium text-gray-900 dark:text-white">
                Monitoreo de Cámaras
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cámaras en tiempo real
              </p>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
