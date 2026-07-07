// ============================================================================
// Archivo: AdminHistory.tsx
// Descripción: Panel de administración para visualizar el historial de actividad
//              del sistema. Incluye filtros, estadísticas generales, exportación
//              de CSV y acciones rápidas.
// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ============================================================================

import React, { useState } from 'react'
import {
  History,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Activity,
  Camera,
  Bot,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  FileText,
  BarChart3,
  TrendingUp,
} from 'lucide-react'

// ============================================================================
// Interfaces de datos utilizadas en la tabla y estadísticas
// ============================================================================
interface HistoryEntry {
  id: string
  timestamp: string
  user: string
  action: string
  type: 'login' | 'robot_control' | 'camera' | 'system' | 'error'
  details: string
  duration?: string
  device?: string
}

interface SystemStats {
  totalSessions: number
  totalUsers: number
  avgSessionTime: string
  mostUsedRobot: string
  peakHour: string
}

// ============================================================================
// Componente principal: AdminHistory
// ============================================================================
export function AdminHistory() {
  // -------------------------------------------------------------------------
  // Estados del filtro y selección
  // -------------------------------------------------------------------------
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [filterDate, setFilterDate] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null)

  // -------------------------------------------------------------------------
  // Datos simulados del historial (mock)
  // -------------------------------------------------------------------------
  const mockHistory: HistoryEntry[] = [
    {
      id: '1',
      timestamp: '2024-01-15 14:30:25',
      user: 'Juan López',
      action: 'Inició sesión',
      type: 'login',
      details: 'Acceso desde IP: 192.168.1.45',
      duration: '45min',
    },
    {
      id: '2',
      timestamp: '2024-01-15 14:32:10',
      user: 'Juan López',
      action: 'Controló Robot Pololu #1',
      type: 'robot_control',
      details: 'Movimientos: 23 comandos, Navegación autónoma activada',
      duration: '12min',
      device: 'Robot Pololu #1',
    },
    {
      id: '3',
      timestamp: '2024-01-15 14:45:33',
      user: 'María García',
      action: 'Grabó video de cámara',
      type: 'camera',
      details: 'Cámara PTZ #2 - Grabación de 8 minutos guardada',
      duration: '8min',
      device: 'Cámara PTZ #2',
    },
    {
      id: '4',
      timestamp: '2024-01-15 15:02:18',
      user: 'Sistema',
      action: 'Reinicio automático',
      type: 'system',
      details: 'MaxArm Robot reiniciado por timeout de conexión',
      device: 'MaxArm Robot',
    },
    {
      id: '5',
      timestamp: '2024-01-15 15:15:44',
      user: 'Dr. Roberto Martínez',
      action: 'Exportó datos experimentales',
      type: 'robot_control',
      details: 'Descarga de logs de sensores y trayectorias (2.3MB)',
      duration: '25min',
      device: 'Robot Pololu #2',
    },
    {
      id: '6',
      timestamp: '2024-01-15 15:30:12',
      user: 'Ana Herrera',
      action: 'Error de conexión',
      type: 'error',
      details: 'Falló conexión con Cámara PTZ #3 - Timeout después de 30s',
      device: 'Cámara PTZ #3',
    },
    {
      id: '7',
      timestamp: '2024-01-15 16:00:05',
      user: 'Carlos Mendoza',
      action: 'Completó práctica de laboratorio',
      type: 'robot_control',
      details: 'Sesión de navegación con obstáculos - Objetivos completados',
      duration: '35min',
      device: 'Robot Pololu #1',
    },
    {
      id: '8',
      timestamp: '2024-01-15 16:22:30',
      user: 'Sistema',
      action: 'Backup automático',
      type: 'system',
      details: 'Respaldo de configuraciones y logs completado (15.7MB)',
    },
  ]

  // -------------------------------------------------------------------------
  // Estadísticas del sistema (valores simulados)
  // -------------------------------------------------------------------------
  const systemStats: SystemStats = {
    totalSessions: 156,
    totalUsers: 24,
    avgSessionTime: '28min',
    mostUsedRobot: 'Robot Pololu #1',
    peakHour: '14:00-15:00',
  }

  // -------------------------------------------------------------------------
  // Filtros combinados: búsqueda, tipo y fecha
  // -------------------------------------------------------------------------
  const filteredHistory = mockHistory.filter((entry) => {
    const matchesSearch =
      entry.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.details.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesType = filterType === 'all' || entry.type === filterType
    const matchesDate = !filterDate || entry.timestamp.startsWith(filterDate)

    return matchesSearch && matchesType && matchesDate
  })

  // -------------------------------------------------------------------------
  // Asignación de íconos según el tipo de evento
  // -------------------------------------------------------------------------
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'login':
        return <User className="w-4 h-4" />
      case 'robot_control':
        return <Bot className="w-4 h-4" />
      case 'camera':
        return <Camera className="w-4 h-4" />
      case 'system':
        return <Activity className="w-4 h-4" />
      case 'error':
        return <AlertTriangle className="w-4 h-4" />
      default:
        return <FileText className="w-4 h-4" />
    }
  }

  // -------------------------------------------------------------------------
  // Colores distintivos por tipo de evento
  // -------------------------------------------------------------------------
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'login':
        return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400'
      case 'robot_control':
        return 'text-green-600 bg-green-100 dark:bg-green-900/20 dark:text-green-400'
      case 'camera':
        return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20 dark:text-purple-400'
      case 'system':
        return 'text-orange-600 bg-orange-100 dark:bg-orange-900/20 dark:text-orange-400'
      case 'error':
        return 'text-red-600 bg-red-100 dark:bg-red-900/20 dark:text-red-400'
      default:
        return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400'
    }
  }

  // -------------------------------------------------------------------------
  // Exportación del historial a CSV
  // -------------------------------------------------------------------------
  const exportHistory = () => {
    const csvContent = [
      ['Fecha/Hora', 'Usuario', 'Acción', 'Tipo', 'Detalles', 'Duración', 'Dispositivo'],
      ...filteredHistory.map((entry) => [
        entry.timestamp,
        entry.user,
        entry.action,
        entry.type,
        entry.details,
        entry.duration || '',
        entry.device || '',
      ]),
    ]
      .map((row) => row.join(','))
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `robotat_history_${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // -------------------------------------------------------------------------
  // Render del componente
  // -------------------------------------------------------------------------
  return (
    <div className="space-y-6">
      {/* Encabezado principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Historial de Actividad
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Registro completo de actividades del sistema
          </p>
        </div>
        <button
          onClick={exportHistory}
          className="inline-flex items-center gap-2 bg-uvg-yellow text-uvg-green-dark px-4 py-2 rounded-lg hover:bg-uvg-yellow/90 transition-colors"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {/* Estadísticas del sistema */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <BarChart3 className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {systemStats.totalSessions}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sesiones Totales</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <User className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {systemStats.totalUsers}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Usuarios Activos</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {systemStats.avgSessionTime}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Promedio</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Bot className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                Pololu #1
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Más Usado</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {systemStats.peakHour}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Hora Pico</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Campo de búsqueda */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, acción o detalles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            />
          </div>

          {/* Selector de tipo */}
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="login">Inicios de sesión</option>
              <option value="robot_control">Control de robots</option>
              <option value="camera">Actividad de cámaras</option>
              <option value="system">Sistema</option>
              <option value="error">Errores</option>
            </select>
          </div>

          {/* Filtro por fecha */}
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-gray-400" />
            <input
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* Tabla del historial */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Registro de Actividades
          </h3>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {filteredHistory.length} entradas encontradas
          </span>
        </div>

        <div className="max-h-96 overflow-y-auto divide-y divide-gray-200 dark:divide-gray-700">
          {filteredHistory.map((entry) => (
            <div
              key={entry.id}
              className={`p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                selectedEntry === entry.id ? 'bg-uvg-green-light/10 dark:bg-uvg-green-dark/20' : ''
              }`}
              onClick={() =>
                setSelectedEntry(selectedEntry === entry.id ? null : entry.id)
              }
            >
              <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${getTypeColor(entry.type)}`}>
                  {getTypeIcon(entry.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {entry.action}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                      {entry.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {entry.duration}
                        </span>
                      )}
                      <span>{entry.timestamp}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-2 text-sm text-gray-600 dark:text-gray-400">
                    Usuario: <span className="font-medium">{entry.user}</span>
                    {entry.device && (
                      <>
                        • Dispositivo:{' '}
                        <span className="font-medium">{entry.device}</span>
                      </>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {entry.details}
                  </p>

                  {/* Detalles expandidos */}
                  {selectedEntry === entry.id && (
                    <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                        Detalles Adicionales
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            ID de Sesión:
                          </span>
                          <span className="ml-2 font-mono">
                            {entry.id.padStart(8, '0')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">
                            Tipo:
                          </span>
                          <span className="ml-2 capitalize">
                            {entry.type.replace('_', ' ')}
                          </span>
                        </div>
                        {entry.device && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Dispositivo:
                            </span>
                            <span className="ml-2">{entry.device}</span>
                          </div>
                        )}
                        {entry.duration && (
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">
                              Duración:
                            </span>
                            <span className="ml-2">{entry.duration}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones rápidas */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Acciones Rápidas
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg text-left transition-colors">
            <FileText className="w-6 h-6 text-blue-600 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">
              Generar Reporte
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Crear reporte detallado del período
            </p>
          </button>
          <button className="p-4 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded-lg text-left transition-colors">
            <BarChart3 className="w-6 h-6 text-green-600 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">
              Análisis de Uso
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Ver estadísticas detalladas
            </p>
          </button>
          <button className="p-4 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded-lg text-left transition-colors">
            <AlertTriangle className="w-6 h-6 text-purple-600 mb-2" />
            <p className="font-medium text-gray-900 dark:text-white">
              Alertas del Sistema
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Configurar notificaciones
            </p>
          </button>
        </div>
      </div>
    </div>
  )
}
