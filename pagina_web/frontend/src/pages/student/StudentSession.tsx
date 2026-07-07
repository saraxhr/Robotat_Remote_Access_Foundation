// ======================================================================================
// Archivo: StudentSession.tsx
// Descripción general:
// --------------------------------------------------------------------------------------
// Este componente React define la vista principal del estudiante dentro del sistema
// Robotat. Permite monitorear en tiempo real las cámaras del laboratorio mediante 
// transmisión MJPEG directa desde un microservidor Flask, controlar la sesión activa 
// (cronómetro, marcadores), y gestionar código para experimentos locales.
//
// Funcionalidades principales:
//   • Transmisión de video MJPEG desde Flask (sin uso de iframes).
//   • Polling periódico al backend Django para actualizar el estado online/offline de cámaras.
//   • Control de sesión con cronómetro, inicio, fin y marcadores temporales.
//   • Exportación de bookmarks en formato CSV o JSON.
//   • Editor de código embebido con carga de archivos locales.
//   • Diferentes layouts de visualización de cámaras (grid, enfoque, carrusel).
//   • Modo de pantalla completa para monitoreo ampliado.
//
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ======================================================================================


/* Importa React y los hooks necesarios (estado y efectos). */
import React, { useState, useEffect } from 'react'

/* Importa íconos de lucide-react usados en la interfaz. */
import {
  Play,
  Pause,
  Square,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Camera,
  Maximize,
  RotateCcw,
  Settings,
  Timer,
  Bot,
  Upload,
  Code,
  Grid3X3,
  Focus,
  ChevronLeft,
  ChevronRight,
  Volume2,
  VolumeX,
  Bookmark,
  X,
  Minimize
} from 'lucide-react'

/* Declara la interfaz de la cámara usada en esta vista. */
interface CameraView {
  /* ID lógico de la cámara (coincide con backend: "1".."6"). */
  id: string
  /* Nombre visible en la tarjeta. */
  name: string
  /* Ubicación o descripción breve. */
  location: string
  /* Estado online/offline pintado por la UI. */
  status: 'online' | 'offline'
  /* Campo opcional con URL de stream (no necesario porque la construimos). */
  stream?: string
}

/* Declara la interfaz de los bookmarks (marcadores de sesión). */
interface Bookmark {
  /* Identificador único del marcador. */
  id: string
  /* Tiempo (en segundos) desde el inicio de la sesión. */
  timestamp: number
  /* ID de la cámara asociada. */
  cameraId: string
  /* Nota breve del marcador. */
  note: string
}

/* Define la base del backend como en Admin: usa .env o localhost:8000 por defecto. */
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'

/* Define la base del microservidor Flask (transmisión MJPEG). */
const FLASK_BASE = import.meta.env.VITE_FLASK_BASE || 'http://localhost:5000'


/* Exporta el componente principal de la vista Estudiante. */
export function StudentSession() {
  /* Estado: indica si la sesión está activa (cronómetro, bookmarks). */
  const [isSessionActive, setIsSessionActive] = useState(false)
  /* Estado: tiempo acumulado de la sesión en segundos. */
  const [sessionTime, setSessionTime] = useState(0)
  /* Estado: robot seleccionado (se mantiene por compatibilidad visual). */
  const [selectedRobot, setSelectedRobot] = useState('pololu-1')
  /* Estado: tipo de layout de cámaras (grid | focus | carousel). */
  const [cameraLayout, setCameraLayout] = useState<'grid' | 'focus' | 'carousel'>('grid')
  /* Estado: ID de la cámara activa (usada por focus/carousel y bookmarks). */
  const [activeCameraId, setActiveCameraId] = useState('1')
  /* Estado: mute del audio (UI, sin audio real). */
  const [isMuted, setIsMuted] = useState(true)
  /* Estado: visibilidad del modal del editor de código. */
  const [showCodeEditor, setShowCodeEditor] = useState(false)
  /* Estado: contenido del editor de código (placeholder). */
  const [userCode, setUserCode] = useState(`# Código de ejemplo para Robot Pololu
import robotat_pololu as robot
import time

def main():
    robot.initialize()
    robot.set_speed(0.3)
    # Tu código aquí
    robot.move_forward()
    time.sleep(2)
    robot.stop()
    return "Experimento completado"`)
  /* Estado: lista de bookmarks (marcadores de momento). */
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  /* Estado: pantalla completa del bloque de cámaras. */
  const [isFullscreen, setIsFullscreen] = useState(false)

  /* Lista de robots (se conserva para selector visual). */
  const robots = [
    /* Robot Pololu disponible. */
    { id: 'pololu-1', name: 'Robot Pololu #1', status: 'available' },
    /* MaxArm ocupado (solo visual). */
    { id: 'maxarm-1', name: 'MaxArm Robot', status: 'busy' },
    /* Otro Pololu desconectado (solo visual). */
    { id: 'pololu-2', name: 'Robot Pololu #2', status: 'offline' }
  ]

  /* Lista de cámaras (2 operativas ahora, 6 preparadas). */
  const camerasInitial: CameraView[] = [
    /* Cam 1 (operativa). */
    { id: '1', name: 'Cam 1 - Pololu', location: 'Mesa A', status: 'offline' },
    /* Cam 2 (operativa). */
    { id: '2', name: 'Cam 2 - MaxArm', location: 'Mesa B', status: 'offline' },
    /* Cam 3 (futuro). */
    { id: '3', name: 'Cam 3 - General', location: 'Vista General', status: 'offline' },
    /* Cam 4 (futuro). */
    { id: '4', name: 'Cam 4 - Lateral', location: 'Vista Lateral', status: 'offline' },
    /* Cam 5 (futuro). */
    { id: '5', name: 'Cam 5 - Cenital', location: 'Vista Superior', status: 'offline' },
    /* Cam 6 (futuro). */
    { id: '6', name: 'Cam 6 - Detalle', location: 'Vista Detalle', status: 'offline' }
  ]

  /* Estado: arreglo de cámaras mostradas en la UI. */
  const [cameras, setCameras] = useState<CameraView[]>(camerasInitial)
  
  /* Construye la URL MJPEG del microservidor Flask (stream directo). */
  const getStreamUrl = (camId: string) => `${FLASK_BASE}/camera/${camId}`


  
  /* Helper: consulta estado online/offline al backend para una cámara. */
  const fetchCameraStatus = async (camId: string): Promise<'online' | 'offline'> => {
    /* Intenta hacer GET al endpoint de estado. */
    try {
      /* Llama a /api/cameras/<id>/status/ del backend. */
      const res = await fetch(`${API_BASE}/api/cameras/${camId}/status/`, { method: 'GET' })
      /* Si no responde 200, considera offline. */
      if (!res.ok) return 'offline'
      /* Parsea JSON con { online: boolean }. */
      const data = (await res.json()) as { online?: boolean }
      /* Devuelve 'online' o 'offline' en base al booleano. */
      return data?.online ? 'online' : 'offline'
    } catch {
      /* En error de red, marca offline. */
      return 'offline'
    }
  }

  /* Efecto: sondea periódicamente el estado de TODAS las cámaras (las no configuradas responderán offline). */
  useEffect(() => {
    /* Define función que actualiza el estado de cada cámara. */
    const poll = async () => {
      /* Mapea cámaras y reemplaza el campo status con la lectura del backend. */
      const upd = await Promise.all(
        cameras.map(async (c) => ({ ...c, status: await fetchCameraStatus(c.id) }))
      )
      /* Aplica el nuevo arreglo al estado. */
      setCameras(upd)
    }
    /* Lanza un sondeo inicial para pintar estados. */
    poll()
    /* Programa sondeo cada 15 segundos. */
    const iv = setInterval(poll, 15000)
    /* Limpia el intervalo al desmontar. */
    return () => clearInterval(iv)
    /* Observa solo la longitud (por si luego pasas de 2 a 6). */
  }, [cameras.length])

  /* Efecto: cronómetro 1 Hz cuando la sesión está activa. */
  useEffect(() => {
    /* Crea identificador de intervalo. */
    let id: ReturnType<typeof setInterval>
    /* Si la sesión está activa, inicia el contador. */
    if (isSessionActive) {
      /* Suma +1 s cada segundo. */
      id = setInterval(() => setSessionTime((t) => t + 1), 1000)
    }
    /* Limpia el intervalo al pausar/desmontar. */
    return () => clearInterval(id)
    /* Se ejecuta cuando cambia isSessionActive. */
  }, [isSessionActive])

  /* Acción: iniciar la sesión (activa cronómetro). */
  const handleStartSession = () => {
    /* Cambia flag a true. */
    setIsSessionActive(true)
  }

  /* Acción: terminar la sesión (resetea cronómetro). */
  const handleEndSession = () => {
    /* Cambia flag a false. */
    setIsSessionActive(false)
    /* Reinicia el tiempo. */
    setSessionTime(0)
  }

  /* Utilidad: formatea segundos a mm:ss. */
  const formatTime = (seconds: number) => {
    /* Calcula minutos enteros. */
    const mins = Math.floor(seconds / 60)
    /* Calcula segundos restantes. */
    const secs = seconds % 60
    /* Retorna cadena con padding. */
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  /* Manejador: abrir diálogo de archivo y cargarlo al editor. */
  const handleFileUpload = () => {
    /* Crea input temporal tipo file. */
    const input = document.createElement('input')
    /* Define tipo de entrada. */
    input.type = 'file'
    /* Limita extensiones sugeridas. */
    input.accept = '.py,.m,.txt'
    /* Define callback al elegir archivo. */
    input.onchange = (e) => {
      /* Toma el primer archivo. */
      const file = (e.target as HTMLInputElement).files?.[0]
      /* Verifica que exista. */
      if (file) {
        /* Crea lector. */
        const reader = new FileReader()
        /* Al terminar de leer, actualiza el editor. */
        reader.onload = (evt) => setUserCode((evt.target?.result as string) || '')
        /* Lee como texto. */
        reader.readAsText(file)
      }
    }
    /* Abre el diálogo. */
    input.click()
  }

  /* Manejador: agrega un marcador (bookmark) del tiempo actual para la cámara activa. */
  const addBookmark = () => {
    /* Crea objeto bookmark con datos de sesión. */
    const bm: Bookmark = {
      /* ID único a partir de timestamp. */
      id: Date.now().toString(),
      /* Tiempo de sesión actual. */
      timestamp: sessionTime,
      /* Cámara activa al momento. */
      cameraId: activeCameraId,
      /* Nota informativa con tiempo formateado. */
      note: `Momento marcado en ${formatTime(sessionTime)}`
    }
    /* Inserta el bookmark en el estado. */
    setBookmarks((prev) => [...prev, bm])
  }

  /* Manejador: exporta bookmarks como CSV o JSON. */
  const exportBookmarks = (format: 'csv' | 'json') => {
    /* Si no hay bookmarks, no hace nada. */
    if (bookmarks.length === 0) return
    /* Prepara contenido y metadatos. */
    let content = ''
    let mime = ''
    let ext = ''
    /* Si el formato es CSV, arma encabezado + filas. */
    if (format === 'csv') {
      /* Construye CSV completo como texto. */
      content =
        'Timestamp,Tiempo_Formateado,Camara_ID,Camara_Nombre,Nota\n' +
        bookmarks
          .map((b) => {
            /* Busca la cámara para obtener su nombre. */
            const cam = cameras.find((c) => c.id === b.cameraId)
            /* Devuelve línea CSV. */
            return `${b.timestamp},${formatTime(b.timestamp)},${b.cameraId},${cam?.name || 'Desconocida'},${b.note}`
          })
          .join('\n')
      /* Define MIME tipo CSV. */
      mime = 'text/csv'
      /* Extensión CSV. */
      ext = 'csv'
    } else {
      /* Para JSON, serializa sesión + bookmarks enriquecidos. */
      content = JSON.stringify(
        {
          /* Resumen de sesión. */
          session: { duration: sessionTime, robot: selectedRobot, date: new Date().toISOString() },
          /* Lista de bookmarks con cámara embebida. */
          bookmarks: bookmarks.map((b) => ({
            ...b,
            timeFormatted: formatTime(b.timestamp),
            camera: cameras.find((c) => c.id === b.cameraId)
          }))
        },
        /* Replacer nulo. */
        null,
        /* Indentación 2 espacios. */
        2
      )
      /* Define MIME JSON. */
      mime = 'application/json'
      /* Extensión JSON. */
      ext = 'json'
    }
    /* Crea Blob con el contenido generado. */
    const blob = new Blob([content], { type: mime })
    /* Genera URL temporal para descarga. */
    const url = URL.createObjectURL(blob)
    /* Crea enlace temporal <a>. */
    const a = document.createElement('a')
    /* Asigna URL del blob. */
    a.href = url
    /* Define nombre de archivo con fecha. */
    a.download = `bookmarks_sesion_${new Date().toISOString().slice(0, 10)}.${ext}`
    /* Inserta el enlace al DOM. */
    document.body.appendChild(a)
    /* Dispara clic programático. */
    a.click()
    /* Remueve el enlace. */
    document.body.removeChild(a)
    /* Revoca la URL temporal. */
    URL.revokeObjectURL(url)
  }


  /* Subcomponente: tarjeta de video de una cámara (optimizado sin flicker). */
const CameraFeed = ({
  camera,
  isActive = false,
  size = 'normal'
}: {
  camera: CameraView
  isActive?: boolean
  size?: 'normal' | 'large' | 'small'
}) => {
  /* Define tamaños visuales */
  const sizeClasses = {
    normal: 'aspect-video',
    large: 'aspect-video h-full',
    small: 'aspect-video h-20'
  } as const

  /* URL directa al stream MJPEG (Flask) */
  const streamUrl = `${FLASK_BASE}/camera/${camera.id}`
  const online = camera.status === 'online'

  return (
    <div
      className={`bg-gray-900 rounded-lg overflow-hidden relative cursor-pointer transition-all duration-200 ${
        sizeClasses[size]
      } ${isActive ? 'ring-2 ring-uvg-yellow' : ''}`}
      onClick={() => setActiveCameraId(camera.id)}
    >
      {/* Gradiente de fondo */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
        {/* Estado EN VIVO / OFFLINE */}
        <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
          <div
            className={`w-2 h-2 rounded-full ${
              online ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-white text-xs font-medium">
            {online ? 'EN VIVO' : 'OFFLINE'}
          </span>
        </div>

        {/* Nombre y ubicación */}
        <div className="absolute bottom-2 left-2 text-white z-10">
          <p className="text-xs font-medium">{camera.name}</p>
          <p className="text-xs text-white/70">{camera.location}</p>
        </div>

        {/* Contenido principal (video o placeholder) */}
        <div className="absolute inset-0 flex items-center justify-center">
          {online ? (
            <img
              src={streamUrl}
              alt={`Transmisión ${camera.name}`}
              className="w-full h-full object-cover"
              style={{ display: 'block' }}
              draggable={false}
            />
          ) : (
            <div className="text-center text-white/60">
              <Camera className="w-6 h-6 mx-auto mb-1" />
              <p className="text-xs">Sin señal</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


  /* Renderiza el layout de cámaras según la vista elegida (grid/focus/carousel). */
  const renderCameraLayout = () => {
    /* Obtiene la cámara activa; si no existe, usa la primera. */
    const activeCamera = cameras.find((c) => c.id === activeCameraId) || cameras[0]

    /* Cambia según el layout seleccionado. */
    switch (cameraLayout) {
      /* Vista cuadrícula 2x3. */
      case 'grid':
        /* Retorna malla de 6 tarjetas (2 activas ahora). */
        return (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {cameras.map((camera) => (
              /* Render de cada feed. */
              <CameraFeed key={camera.id} camera={camera} isActive={camera.id === activeCameraId} />
            ))}
          </div>
        )

      /* Vista enfoque: una grande + miniaturas. */
      case 'focus':
        /* Retorna contenedor vertical. */
        return (
          <div className="h-full flex flex-col gap-4">
            {/* Cámara activa en grande. */}
            <div className="flex-1">
              <CameraFeed camera={activeCamera} isActive={true} size="large" />
            </div>
            {/* Tira de miniaturas desplazable. */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {cameras
                .filter((c) => c.id !== activeCameraId)
                .map((camera) => (
                  /* Cada mini feed en ancho fijo. */
                  <div key={camera.id} className="flex-shrink-0 w-24">
                    <CameraFeed camera={camera} size="small" />
                  </div>
                ))}
            </div>
          </div>
        )

      /* Vista carrusel: anterior/siguiente y una grande al centro. */
      case 'carousel':
        /* Calcula índice actual. */
        const currentIndex = cameras.findIndex((c) => c.id === activeCameraId)
        /* Retorna carrusel simple. */
        return (
          <div className="h-full flex items-center">
            {/* Botón anterior con wrap-around. */}
            <button
              onClick={() => {
                /* Calcula índice previo (cíclico). */
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : cameras.length - 1
                /* Cambia la cámara activa. */
                setActiveCameraId(cameras[prevIndex].id)
              }}
              className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors duration-200"
            >
              {/* Ícono izquierda. */
              }
              <ChevronLeft className="w-6 h-6" />
            </button>
            {/* Área central con cámara activa grande. */}
            <div className="flex-1 mx-4">
              <CameraFeed camera={activeCamera} isActive={true} size="large" />
            </div>
            {/* Botón siguiente con wrap-around. */}
            <button
              onClick={() => {
                /* Calcula índice siguiente (cíclico). */
                const nextIndex = currentIndex < cameras.length - 1 ? currentIndex + 1 : 0
                /* Cambia la cámara activa. */
                setActiveCameraId(cameras[nextIndex].id)
              }}
              className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors duration-200"
            >
              {/* Ícono derecha. */}
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        )

      /* Default por completitud. */
      default:
        /* No renderiza nada. */
        return null
    }
  }

  /* Render principal del componente (respetando tu layout). */
  return (
    /* Contenedor vertical con separación entre secciones. */
    <div className="space-y-6">
      {/* ==== Encabezado con cronómetro y controles de sesión ==== */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Títulos y subtítulos */}
        <div>
          {/* Título principal. */}
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mi Sesión de Laboratorio</h1>
          {/* Subtítulo. */}
          <p className="text-gray-600 dark:text-gray-400 mt-1">Controla tu robot asignado en tiempo real</p>
        </div>

        {/* Cronómetro y botones iniciar/terminar */}
        <div className="flex items-center gap-4">
          {/* Tarjeta pequeña con ícono y tiempo formateado */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
            {/* Ícono de reloj. */}
            <Timer className="w-5 h-5 text-uvg-green-dark" />
            {/* Tiempo mm:ss. */}
            <span className="font-mono text-lg text-gray-900 dark:text-white">{formatTime(sessionTime)}</span>
          </div>

          {/* Botón para marcar momentos (solo si sesión activa) */}
          {isSessionActive && (
            <button
              onClick={addBookmark}
              className="inline-flex items-center gap-2 bg-uvg-yellow/10 text-uvg-green-dark px-4 py-2 rounded-lg hover:bg-uvg-yellow/20 transition-colors duration-200"
            >
              {/* Ícono bookmark. */}
              <Bookmark className="w-4 h-4" />
              {/* Texto. */}
              Marcar Momento
            </button>
          )}

          {/* Alterna Iniciar/Terminar sesión */}
          {!isSessionActive ? (
            /* Botón iniciar. */
            <button
              onClick={handleStartSession}
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              {/* Ícono play. */}
              <Play className="w-4 h-4" />
              {/* Texto. */}
              Iniciar Sesión
            </button>
          ) : (
            /* Botón terminar. */
            <button
              onClick={handleEndSession}
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duración-200"
            >
              {/* Ícono stop. */}
              <Square className="w-4 h-4" />
              {/* Texto. */}
              Terminar Sesión
            </button>
          )}
        </div>
      </div>

      {/* ==== Configuración del Experimento ==== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        {/* Título de sección. */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Configuración del Experimento</h3>

        {/* Grid de 2 columnas (selector + espacio) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Selector de Robot */}
          <div>
            {/* Etiqueta. */}
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Seleccionar Robot</label>
            {/* Select controlado. */}
            <select
              value={selectedRobot}
              onChange={(e) => setSelectedRobot(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            >
              {/* Opciones mapeadas. */}
              {robots.map((robot) => (
                /* Opción. */
                <option key={robot.id} value={robot.id} disabled={robot.status !== 'available'}>
                  {/* Texto con estado. */}
                  {robot.name} - {robot.status === 'available' ? 'Disponible' : robot.status === 'busy' ? 'Ocupado' : 'Desconectado'}
                </option>
              ))}
            </select>
          </div>

          {/* Espaciador para balance en pantallas grandes */}
          <div className="hidden lg:block" />
        </div>
      </div>

      {/* ==== Zona principal en tres columnas ==== */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ------------------ Columna 1-2: Cámaras ------------------ */}
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          {/* Header de la tarjeta de cámaras y botones de layout */}
          <div className="flex items-center justify-between mb-4">
            {/* Título. */}
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Monitoreo Visual</h3>
            {/* Botonera de layout/mute/fullscreen. */}
            <div className="flex gap-2">
              {/* Botón: vista en cuadrícula */}
              <button
                onClick={() => setCameraLayout('grid')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  cameraLayout === 'grid'
                    ? 'bg-uvg-yellow text-uvg-green-dark'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Vista en cuadrícula"
              >
                {/* Ícono grid. */}
                <Grid3X3 className="w-4 h-4" />
              </button>

              {/* Botón: vista enfoque */}
              <button
                onClick={() => setCameraLayout('focus')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  cameraLayout === 'focus'
                    ? 'bg-uvg-yellow text-uvg-green-dark'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Vista enfoque"
              >
                {/* Ícono foco. */}
                <Focus className="w-4 h-4" />
              </button>

              {/* Botón: vista carrusel */}
              <button
                onClick={() => setCameraLayout('carousel')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  cameraLayout === 'carousel'
                    ? 'bg-uvg-yellow text-uvg-green-dark'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                title="Vista carrusel"
              >
                {/* Ícono chevron (representa carrusel). */}
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Botón: mute/unmute (UI) */}
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                {/* Alterna icono según estado. */}
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              {/* Botón: maximizar */}
              <button
                onClick={() => setIsFullscreen(true)}
                className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              >
                {/* Ícono maximizar. */}
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Contenedor de cámaras con altura aumentada (como definiste). */}
          <div className="h-[32rem]">
            {/* Renderiza el layout actual. */}
            {renderCameraLayout()}
          </div>
        </div>

        {/* ------------------ Columna 3: Programación ------------------ */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          {/* Título de la tarjeta. */}
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Programación</h3>

          {/* Descripción breve. */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            Sube un archivo o abre el editor para escribir tus scripts del experimento.
          </p>

          {/* Botones de acción: Editor y Subir archivo */}
          <div className="flex gap-2">
            {/* Botón: abre el modal del editor de código */}
            <button
              onClick={() => setShowCodeEditor(true)}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-uvg-green-light/10 text-uvg-green-dark px-4 py-3 rounded-lg hover:bg-uvg-green-light/20 transition-colors duration-200"
            >
              {/* Ícono de código. */}
              <Code className="w-4 h-4" />
              {/* Texto. */}
              Editor de Código
            </button>

            {/* Botón: subir archivo y cargarlo al editor */}
            <button
              onClick={handleFileUpload}
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-3 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors duration-200"
            >
              {/* Ícono subir. */}
              <Upload className="w-4 h-4" />
              {/* Texto. */}
              Subir Archivo
            </button>
          </div>

          {/* Estado de sesión informativo (no condiciona programación). */}
          <div className="mt-4 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            {/* Texto del estado. */}
            <p className="text-xs text-gray-600 dark:text-gray-300">
              Estado de sesión: <span className="font-semibold">{isSessionActive ? 'Activa' : 'Inactiva'}</span>. Puedes
              preparar tu código en cualquier momento.
            </p>
          </div>

          {/* Sección de Bookmarks (últimos 3) */}
          {bookmarks.length > 0 && (
            <div className="mt-6">
              {/* Subtítulo con conteo. */}
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                Momentos Marcados ({bookmarks.length})
              </h4>
              {/* Lista vertical con scroll si excede altura. */}
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {bookmarks.slice(-3).map((bookmark) => (
                  /* Tarjeta compacta del bookmark. */
                  <div key={bookmark.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    {/* Lado izquierdo: ícono + textos. */}
                    <div className="flex items-center gap-2">
                      {/* Ícono bookmark. */}
                      <Bookmark className="w-3 h-3 text-uvg-green-dark" />
                      {/* Textos del bookmark. */}
                      <div>
                        {/* Tiempo formateado. */}
                        <p className="text-xs font-medium text-gray-900 dark:text-white">{formatTime(bookmark.timestamp)}</p>
                        {/* Nombre de la cámara asociada. */}
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {cameras.find((c) => c.id === bookmark.cameraId)?.name}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Botones de exportación. */}
              <div className="flex gap-2 mt-3">
                {/* Exportar CSV. */}
                <button
                  onClick={() => exportBookmarks('csv')}
                  className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors duration-200"
                >
                  CSV
                </button>
                {/* Exportar JSON. */}
                <button
                  onClick={() => exportBookmarks('json')}
                  className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors duration-200"
                >
                  JSON
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ==== Estado de la Sesión ==== */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        {/* Título. */}
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Estado de la Sesión</h3>
        {/* Grid con 3 indicadores. */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Indicador de sesión activa. */}
          <div className="text-center">
            {/* Punto de estado. */}
            <div className={`w-3 h-3 rounded-full mx-auto mb-2 ${isSessionActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            {/* Texto. */}
            <p className="text-sm text-gray-600 dark:text-gray-400">{isSessionActive ? 'Sesión Activa' : 'Sin Sesión'}</p>
          </div>

          {/* Robot seleccionado. */}
          <div className="text-center">
            {/* Texto principal. */}
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedRobot.charAt(0).toUpperCase() + selectedRobot.slice(1)}
            </p>
            {/* Subtítulo. */}
            <p className="text-sm text-gray-600 dark:text-gray-400">Robot Seleccionado</p>
          </div>

          {/* Tiempo restante ficticio. */}
          <div className="text-center">
            {/* Valor placeholder. */}
            <p className="text-2xl font-bold text-gray-900 dark:text-white">2h 30min</p>
            {/* Subtítulo. */}
            <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Restante</p>
          </div>
        </div>
      </div>

      {/* ==== Modal del Editor de Código ==== */}
      {showCodeEditor && (
        /* Overlay negro semitransparente. */
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          {/* Contenedor del modal con tamaños máximos. */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Padding interno. */}
            <div className="p-6">
              {/* Header del modal. */}
              <div className="flex items-center justify-between mb-6">
                {/* Título. */}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Editor de Código</h3>
                {/* Botón cerrar. */}
                <button
                  onClick={() => setShowCodeEditor(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  {/* Ícono X. */}
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Área de texto del editor (simple). */}
              <textarea
                value={userCode}
                onChange={(e) => setUserCode(e.target.value)}
                className="w-full h-96 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent font-mono text-sm"
                placeholder="Escriba su código aquí..."
              />

              {/* Botones inferiores. */}
              <div className="flex gap-3 mt-4">
                {/* Cancelar. */}
                <button
                  onClick={() => setShowCodeEditor(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancelar
                </button>
                {/* Guardar y Ejecutar (placeholder). */}
                <button
                  onClick={() => setShowCodeEditor(false)}
                  className="flex-1 px-4 py-2 bg-uvg-yellow text-uvg-green-dark rounded-lg hover:bg-uvg-yellow/90 transition-colors duration-200"
                >
                  Guardar y Ejecutar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==== Modal de Pantalla Completa para Cámaras ==== */}
      {isFullscreen && (
        /* Overlay oscuro para fullscreen. */
        <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-4">
          {/* Contenedor máximo con layout vertical. */}
          <div className="w-full h-full max-w-7xl max-h-full flex flex-col">
            {/* Header del modal. */}
            <div className="flex justify-between items-center mb-4">
              {/* Título. */}
              <h3 className="text-white text-xl font-semibold">Monitoreo Visual - Pantalla Completa</h3>
              {/* Botonera derecha. */}
              <div className="flex items-center gap-4">
                {/* Controles de layout dentro de fullscreen. */}
                <div className="flex gap-2">
                  {/* Grid. */}
                  <button
                    onClick={() => setCameraLayout('grid')}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      cameraLayout === 'grid' ? 'bg-uvg-yellow text-uvg-green-dark' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {/* Ícono grid. */}
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  {/* Focus. */}
                  <button
                    onClick={() => setCameraLayout('focus')}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      cameraLayout === 'focus' ? 'bg-uvg-yellow text-uvg-green-dark' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {/* Ícono foco. */}
                    <Focus className="w-4 h-4" />
                  </button>
                  {/* Carousel. */}
                  <button
                    onClick={() => setCameraLayout('carousel')}
                    className={`p-2 rounded-lg transition-colors duration-200 ${
                      cameraLayout === 'carousel' ? 'bg-uvg-yellow text-uvg-green-dark' : 'bg-white/20 text-white hover:bg-white/30'
                    }`}
                  >
                    {/* Ícono chevron. */}
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
                {/* Botón para salir del fullscreen. */}
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="text-white hover:text-gray-300 p-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors duration-200"
                >
                  {/* Ícono minimizar. */}
                  <Minimize className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Contenido reutilizando el mismo render del layout. */}
            <div className="flex-1">{renderCameraLayout()}</div>
          </div>
        </div>
      )}
    </div>
  )
}
