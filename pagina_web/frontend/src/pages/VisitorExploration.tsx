// ============================================================================
// Archivo: VisitorExploration.tsx
// Descripción: Página pública de exploración del laboratorio para visitantes.
//              Incluye transmisión en vivo (MJPEG desde Flask), demos locales
//              en video y una llamada a la acción final para iniciar sesión.
// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ============================================================================

import React, { useState } from 'react'
import {
  Camera,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  ArrowLeft,
  Clock,
  Eye,
  Download,
} from 'lucide-react'
import { Link } from 'react-router-dom'

// ============================================================================
// Configuración base de rutas (backend y microservidor Flask)
// ============================================================================
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
const FLASK_BASE = import.meta.env.VITE_FLASK_BASE || 'http://localhost:5000'

// ============================================================================
// Interfaces de datos
// ============================================================================
interface Demo {
  id: string
  title: string
  description: string
  duration: string
  thumbnail: string
  category: 'robot' | 'arm' | 'navigation'
}

// ============================================================================
// Componente principal: VisitorExploration
// ============================================================================
export function VisitorExploration() {
  // -------------------------------------------------------------------------
  // Estados de la sección de transmisión en vivo
  // -------------------------------------------------------------------------
  const [selectedCamera, setSelectedCamera] = useState('1')
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)

  // -------------------------------------------------------------------------
  // Lista de cámaras disponibles
  // -------------------------------------------------------------------------
  const cameras = [
    { id: '1', name: 'Vista General', location: 'Laboratorio Principal' },
    { id: '2', name: 'Pololus', location: 'Área de Trabajo A' },
    { id: '3', name: 'Brazo MaxArm', location: 'Estación de Manipulación' },
  ]

  // -------------------------------------------------------------------------
  // Configuración de las demos pregrabadas
  // -------------------------------------------------------------------------
  type DemoWithVideo = Demo & { src: string; poster?: string }

  const [openDemo, setOpenDemo] = useState<DemoWithVideo | null>(null)

  const demos: DemoWithVideo[] = [
    {
      id: '1',
      title: 'Robot Pololu - Navegación Autónoma',
      description: 'Demostración de navegación autónoma evitando obstáculos',
      duration: '0:32',
      thumbnail: 'pololu-demo',
      category: 'robot',
      src: '/videos/pololu1.mp4',
    },
    {
      id: '2',
      title: 'MaxArm - Manipulación de Objetos',
      description: 'Brazo robótico recogiendo y colocando objetos con precisión',
      duration: '5:20',
      thumbnail: 'maxarm-demo',
      category: 'arm',
      src: '/videos/pololu2.mp4',
      poster: '/thumbs/maxarm.jpg',
    },
    {
      id: '3',
      title: 'Sistema de Visión - Seguimiento',
      description: 'Cámaras PTZ siguiendo automáticamente objetos en movimiento',
      duration: '2:15',
      thumbnail: 'vision-demo',
      category: 'navigation',
      src: '/videos/vision.mp4',
      poster: '/thumbs/vision.jpg',
    },
    {
      id: '4',
      title: 'Colaboración Multi-Robot',
      description: 'Múltiples robots trabajando en coordinación',
      duration: '4:30',
      thumbnail: 'multi-robot-demo',
      category: 'robot',
      src: '/videos/multirobot.mp4',
      poster: '/thumbs/multirobot.jpg',
    },
  ]

  // -------------------------------------------------------------------------
  // Funciones auxiliares de estilo y texto
  // -------------------------------------------------------------------------
  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'robot':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'arm':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'navigation':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getCategoryName = (category: string) => {
    switch (category) {
      case 'robot':
        return 'Robótica Móvil'
      case 'arm':
        return 'Manipulación'
      case 'navigation':
        return 'Visión Artificial'
      default:
        return 'General'
    }
  }

  // -------------------------------------------------------------------------
  // Render principal del componente
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-uvg-green-light/10 via-white to-uvg-yellow/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Encabezado con enlace de regreso */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-uvg-green-dark dark:text-uvg-green-light hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al inicio
          </Link>
        </div>

        {/* Introducción */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Exploración del Robotat
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Descubre las capacidades del laboratorio mediante transmisiones en vivo
            y demostraciones pregrabadas de nuestros equipos de robótica.
          </p>
        </div>

        {/* -----------------------------------------------------------------
           Sección: Transmisión en vivo (Flask MJPEG)
        ------------------------------------------------------------------*/}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                Transmisión en Vivo
              </h2>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm text-red-600 dark:text-red-400 font-medium">
                  EN VIVO
                </span>
              </div>
            </div>

            {/* Selector de cámara */}
            <div className="flex flex-wrap gap-2 mb-4">
              {cameras.map((camera) => (
                <button
                  key={camera.id}
                  onClick={() => setSelectedCamera(camera.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium ${
                    selectedCamera === camera.id
                      ? 'bg-uvg-green-dark text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {camera.name}
                </button>
              ))}
            </div>

            {/* Contenedor del stream */}
            <div className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden mb-4">
              <div className="absolute inset-0 bg-black">
                {(selectedCamera === '1' || selectedCamera === '2') ? (
                  <img
                    src={`${FLASK_BASE}/camera/${selectedCamera}`}
                    className="w-full h-full object-cover"
                    alt={`Transmisión ${cameras.find(c => c.id === selectedCamera)?.name || 'Cámara'}`}
                    draggable={false}
                    loading="eager"
                    decoding="sync"
                    fetchPriority="high"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none'
                      console.warn(`Stream no disponible para cámara ${selectedCamera}`)
                    }}
                    onLoad={(e) => {
                      (e.target as HTMLImageElement).style.display = 'block'
                    }}
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-white/60">
                      <Camera className="w-12 h-12 mx-auto mb-3 animate-pulse" />
                      <p className="text-lg font-medium">Vista del Laboratorio</p>
                      <p className="text-sm text-white/40">
                        Transmisión limitada para visitantes
                      </p>
                    </div>
                  </div>
                )}

                <div className="absolute top-4 left-4 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                  ● EN VIVO
                </div>
                <div className="absolute bottom-4 left-4 text-white">
                  <p className="text-sm font-medium">
                    {cameras.find(c => c.id === selectedCamera)?.name}
                  </p>
                  <p className="text-xs text-white/70">
                    {cameras.find(c => c.id === selectedCamera)?.location}
                  </p>
                </div>
                <div className="absolute top-4 right-4 bg-black/50 text-white px-3 py-1 rounded-full text-xs flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>24 viendo</span>
                </div>
              </div>
            </div>

            {/* Controles decorativos */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-2 bg-uvg-yellow text-uvg-green-dark rounded-lg hover:bg-uvg-yellow/90"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
              </div>
              <button className="p-2 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* -----------------------------------------------------------------
           Sección: Demos pregrabadas
        ------------------------------------------------------------------*/}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mt-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Demostraciones Pregrabadas
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {demos.length} videos disponibles
            </span>
          </div>

          {/* Grid de demos */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {demos.map((demo) => (
              <div
                key={demo.id}
                className="group cursor-pointer"
                onClick={() => setOpenDemo(demo)}
              >
                <div className="aspect-video bg-gray-900 rounded-lg relative overflow-hidden mb-3">
                  {demo.poster ? (
                    <img
                      src={demo.poster}
                      alt={demo.title}
                      className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white/60">
                      <Play className="w-8 h-8 mx-auto mb-2" />
                    </div>
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                    {demo.duration}
                  </div>
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-12 h-12 bg-uvg-yellow rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-uvg-green-dark ml-1" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                        demo.category
                      )}`}
                    >
                      {getCategoryName(demo.category)}
                    </span>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock className="w-3 h-3" />
                      {demo.duration}
                    </div>
                  </div>
                  <h3 className="font-medium text-gray-900 dark:text-white group-hover:text-uvg-green-dark dark:group-hover:text-uvg-green-light transition-colors">
                    {demo.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                    {demo.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Modal de reproducción */}
          {openDemo && (
            <div
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
              onClick={() => setOpenDemo(null)}
            >
              <div
                className="w-full max-w-5xl bg-gray-900 rounded-xl overflow-hidden shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between px-4 py-3 bg-gray-800">
                  <h4 className="text-white font-semibold text-sm md:text-base">
                    {openDemo.title}
                  </h4>
                  <div className="flex items-center gap-3">
                    <a
                      href={openDemo.src}
                      download
                      className="inline-flex items-center gap-1 text-gray-200 hover:text-white text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Descargar
                    </a>
                    <button
                      onClick={() => setOpenDemo(null)}
                      className="text-gray-200 hover:text-white text-sm"
                      aria-label="Cerrar"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <video
                  src={openDemo.src}
                  poster={openDemo.poster}
                  controls
                  autoPlay
                  className="w-full h-auto max-h-[75vh] bg-black"
                />
                <div className="px-4 py-3 bg-gray-800/80">
                  <p className="text-gray-300 text-sm">
                    {openDemo.description}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* -----------------------------------------------------------------
           Llamado a la acción final (CTA)
        ------------------------------------------------------------------*/}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-uvg-green-dark to-uvg-green-light text-white rounded-xl p-8">
            <h3 className="text-2xl font-bold mb-4">
              ¿Listo para experimentar con robots reales?
            </h3>
            <p className="text-uvg-green-light/80 mb-6 max-w-2xl mx-auto">
              Únete a la comunidad de estudiantes e investigadores que ya están utilizando
              Robotat para sus proyectos de robótica e investigación.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center gap-2 bg-uvg-yellow text-uvg-green-dark px-6 py-3 rounded-lg hover:bg-uvg-yellow/90 font-semibold"
              >
                Iniciar Sesión
              </Link>
              <Link
                to="/"
                className="inline-flex items-center gap-2 bg-white/20 text-white px-6 py-3 rounded-lg hover:bg-white/30 font-semibold"
              >
                Más Información
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
