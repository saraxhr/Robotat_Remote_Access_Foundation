// ======================================================================================
// Archivo: PololuControl.tsx
// Descripción general:
// --------------------------------------------------------------------------------------
// Este componente React implementa el panel interactivo de control para el Pololu
// dentro del sistema Robotat. Combina el manejo directo del robot (movimiento y velocidad)
// con la visualización simultánea de múltiples cámaras IP conectadas al backend.
//
// Funcionalidades principales:
//   • Control del Pololu:
//       - Envío de comandos de movimiento (adelante, atrás, izquierda, derecha, detener).
//       - Construcción de paquetes MQTT estandarizados y comunicación con el backend Django.
//       - Control desde la interfaz o mediante teclado (flechas y barra espaciadora).
//       - Ajuste dinámico de la velocidad del robot.
//   • Gestión de cámaras:
//       - Integración con el microservidor Flask de video en tiempo real (MJPEG).
//       - Monitoreo de estado online/offline mediante polling periódico.
//       - Control PTZ (pan, tilt, zoom) con respuesta visual inmediata.
//       - Múltiples modos de visualización: mosaico, enfoque, cíclico y pantalla completa.
//       - Soporte para grabación y actualización manual de cada cámara.
//   • Interfaz visual:
//       - Indicadores de conexión, batería y tiempo activo.
//       - Controles tipo D-Pad para movimiento manual.
//       - Layout adaptable y diseño responsive.
//
// Este módulo conecta el nivel de interacción usuario-hardware, unificando en una sola
// interfaz el control remoto del robot y la supervisión visual del entorno del laboratorio.

// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ======================================================================================


import React, { useState, useEffect, useCallback } from 'react';
import {
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Circle,
  Gauge,
  Power,
  PowerOff,
  AlertCircle,
  CheckCircle,
  Radio,
  Zap,
  Timer,
  Camera,
  Grid3x3,
  Maximize2,
  RefreshCw,
  Play,
  Square,
  ZoomIn,
  ZoomOut,
  Move,
  RotateCw,
  Eye,
  Minimize2,
  Monitor,
  Layers
} from 'lucide-react';

// ================================================================
// Utilidades de integración backend con frontend 
// ================================================================

// Mapa de IDs del frontend =  IDs lógicos del backend Django
// - En el backend, las cámaras configuradas están en config.py con IDs "1" y "2".
// - En el frontend se usa 'cam1', 'cam2', ...; aquí se relacionan ambos.
// - Así, cuando se envíe PTZ o se pida stream/estado, se sabrá a qué ID llamar.
const CAM_BACKEND_ID: Record<string, string> = {
  cam1: '1',  // 'cam1' en UI corresponde a cámara "1" en /api/cameras/1/...
  cam2: '2',  // 'cam2' en UI corresponde a cámara "2" en /api/cameras/2/...
  // cam3..cam6 de deja sin mapear por ahora (no configurar aún)
};

//  función para obtener la URL de stream desde Flask
const buildStreamURL = (backendId: string, bust?: boolean) => {
  const suffix = bust ? `?t=${Date.now()}` : '';
  // Se puede cambiar el dominio de base según la red local (por ejemplo 192.168.50.XXX)
  const FLASK_BASE = "http://localhost:8090";
  return `${FLASK_BASE}/camera/${backendId}${suffix}`;
};


const buildStatusURL = () => {
  const FLASK_BASE = "http://localhost:8090";
  return `${FLASK_BASE}/status`;
};


// Función auxiliar para traducir el control de UI a comando PTZ del backend
// - backend acepta: up|down|left|right|home (y center/reset mapean a Home)
// - Aquí se mapean acciones de UI a esos comandos y se deja zoom para más adelante si aplicara
const mapPTZCmd = (control: 'pan-left' | 'pan-right' | 'tilt-up' | 'tilt-down' | 'zoom-in' | 'zoom-out') => {
  // retornar el comando string que espera la API /ptz/ en el campo "cmd"
  switch (control) {
    case 'pan-left':  return 'left';   // mover a la izquierda
    case 'pan-right': return 'right';  // mover a la derecha
    case 'tilt-up':   return 'up';     // mover hacia arriba
    case 'tilt-down': return 'down';   // mover hacia abajo
    // Los siguientes dos (zoom) no están soportados en  ptz_view; podría implementar en backend o ignorar
    case 'zoom-in':   return 'home';   // usar 'home' como no-op visible (placeholder) por ahora
    case 'zoom-out':  return 'home';   // idem; evita error en backend hasta que se agregue zoom real
  }
};


interface ControlState {
  direction: 'forward' | 'backward' | 'left' | 'right' | 'stop';
  speed: number;
  isConnected: boolean;
  battery: number;
  activeTime: number;
}

interface CameraState {
  id: string;
  name: string;
  isConnected: boolean;
  isRecording: boolean;
  stream: string;
  pan: number;
  tilt: number;
  zoom: number;
}

type ViewMode = 'mosaic' | 'focus' | 'cycle' | 'fullscreen';
type MosaicLayout = '2x3' | '3x2' | '1x6';

export function PololuControl() {
  const [controlState, setControlState] = useState<ControlState>({
    direction: 'stop',
    speed: 50,
    isConnected: true,
    battery: 85,
    activeTime: 0
  });

  const [cameras, setCameras] = useState<CameraState[]>([
    { id: 'cam1', name: 'Cámara Frontal', isConnected: true, isRecording: false, stream: '', pan: 0, tilt: 0, zoom: 1 },
    { id: 'cam2', name: 'Cámara Trasera', isConnected: true, isRecording: false, stream: '', pan: 0, tilt: 0, zoom: 1 },
    { id: 'cam3', name: 'Cámara Lateral Izq', isConnected: true, isRecording: false, stream: '', pan: 0, tilt: 0, zoom: 1 },
    { id: 'cam4', name: 'Cámara Lateral Der', isConnected: false, isRecording: false, stream: '', pan: 0, tilt: 0, zoom: 1 },
    { id: 'cam5', name: 'Cámara Superior', isConnected: true, isRecording: false, stream: '', pan: 0, tilt: 0, zoom: 1 },
    { id: 'cam6', name: 'Cámara General', isConnected: true, isRecording: false, stream: '', pan: 0, tilt: 0, zoom: 1 }
  ]);

  const [viewMode, setViewMode] = useState<ViewMode>('mosaic');
  const [mosaicLayout, setMosaicLayout] = useState<MosaicLayout>('2x3');
  const [focusedCamera, setFocusedCamera] = useState<string>('cam1');
  const [pinnedCamera, setPinnedCamera] = useState<string | null>(null);
  const [cycleInterval, setCycleInterval] = useState<number>(10);
  const [currentCycleIndex, setCurrentCycleIndex] = useState<number>(0);
  const [showPTZControls, setShowPTZControls] = useState<boolean>(false);
  const [activeKey, setActiveKey] = useState<string | null>(null);

  // Simular tiempo activo
  useEffect(() => {
    const timer = setInterval(() => {
      if (controlState.isConnected && controlState.direction !== 'stop') {
        setControlState(prev => ({
          ...prev,
          activeTime: prev.activeTime + 1
        }));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [controlState.isConnected, controlState.direction]);

  // Modo cíclico automático
  useEffect(() => {
    if (viewMode === 'cycle') {
      const interval = setInterval(() => {
        setCurrentCycleIndex(prev => (prev + 1) % cameras.length);
      }, cycleInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [viewMode, cycleInterval, cameras.length]);

  // ================================================================
//  Integración con backend de cámaras 
// ================================================================

// Efecto para inicializar streams de las cámaras configuradas (solo 1 y 2 por ahora)
// - Establece la propiedad 'stream' de cam1/cam2 con la URL MJPEG del backend
// - Mantiene las demás cámaras sin tocar 
useEffect(() => {
  // se actualiza solo cam1 y cam2 con sus streams reales
  setCameras(prev =>
    prev.map(cam => {
      // se obtiene el ID del backend correspondiente (si existe en el mapa)
      const backendId = CAM_BACKEND_ID[cam.id];
      // Si hay ID de backend, contruir la URL de stream; si no, dejar el stream vacío
      const stream = backendId ? buildStreamURL(backendId) : '';
      // devolver el objeto cámara, actualizando solo 'stream' si aplica
      return backendId ? { ...cam, stream } : cam;
    })
  );
  // Dependencias vacías: esto se ejecuta una sola vez al montar el componente
}, []);

// Efecto para hacer polling de estado online/offline de las cámaras configuradas
// - Consulta /api/cameras/<id>/status/ cada 5 segundos (configurable)
// - Actualiza isConnected en el estado para que el UI muestre el punto verde/rojo
useEffect(() => {
  // Definir una flag para evitar setState si el componente se desmonta
  let cancelled = false;
  // Definimos el intervalo de consulta en milisegundos
  const INTERVAL_MS = 5000; // 5s; si se desea más responsivo, bajar a 2000ms

  // Función asíncrona que pide el estado de cada cámara mapeada (cam1, cam2)
  const pollStatus = async () => {
    try {
      // Usar Promise.all para consultar todas las cámaras mapeadas en paralelo
      const entries = Object.entries(CAM_BACKEND_ID); // [['cam1','1'],['cam2','2']]
      const results = await Promise.all(
      entries.map(async ([frontId, backId]) => {
      const res = await fetch(buildStatusURL(), { method: 'GET' });
      const data = await res.json();
      const online = data?.[backId]?.active || false;
      return [frontId, online] as const;
  })
);


      // Si el componente sigue montado, actualizar isConnected según resultados
      if (!cancelled) {
        setCameras(prev =>
          prev.map(cam => {
            // Buscar si esta cámara tiene un resultado de status
            const hit = results.find(([fid]) => fid === cam.id);
            // Si hay resultado, aplicar isConnected; si no, dejar como está
            return hit ? { ...cam, isConnected: hit[1] } : cam;
          })
        );
      }
    } catch {
      // En caso de error general, marcar todas las cámaras mapeadas como offline
      if (!cancelled) {
        setCameras(prev =>
          prev.map(cam =>
            CAM_BACKEND_ID[cam.id] ? { ...cam, isConnected: false } : cam
          )
        );
      }
    }
  };

  // Ejecutar inmediatamente al montar para no esperar 5s la primera vez
  pollStatus();
  // Creamos el intervalo periódico
  const iv = setInterval(pollStatus, INTERVAL_MS);

  // Función de limpieza: cancela actualizaciones y limpia intervalo
  return () => {
    cancelled = true;
    clearInterval(iv);
  };
  // Dependencias: ninguna; el mapa de cámaras es constante en tiempo de ejecución
}, []);


// ================================================================
//  Manejar comandos de movimiento del Pololu y envío en tiempo real
// ================================================================
//Construcción paquete JSON 
function buildPololuPacket(direction: string, speed: number, state: 'pressed' | 'released' | 'emergency') {
  return {
    src: 2,                        // Source: WEB_APP
    pts: Date.now() / 1000,        // Timestamp en segundos UNIX
    ptp: 2,                        // PacketType.COMMAND
    pid:
      state === 'pressed'
        ? (direction === 'forward'  ? 101 :  // FWD_PRESS
           direction === 'backward' ? 103 :  // BWD_PRESS
           direction === 'left'     ? 105 :  // LFT_PRESS
           direction === 'right'    ? 107 :  // RGT_PRESS
           100)                     // FORCE_STOP por default
        : (direction === 'forward'  ? 102 :  // FWD_RELEASE
           direction === 'backward' ? 104 :  // BWD_RELEASE
           direction === 'left'     ? 106 :  // LFT_RELEASE
           direction === 'right'    ? 108 :  // RGT_RELEASE
           100),                    // FORCE_STOP si no aplica
    psb: 0,
    pld: null,
    cks: null                      // Checksum se calcula en backend
  };
}


// Función general para enviar el paquete al backend en tiempo real
async function sendPololuPacket(packet: any) {
  try {
    const token = localStorage.getItem("robotat_token") || localStorage.getItem ("accessToken");   
    const response = await fetch("http://localhost:8000/api/enviar-comando/", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {})  
      },
      body: JSON.stringify(packet)
    });
    

    if (!response.ok) {
      const errorText = await response.text();
      console.error(" Error al enviar comando:", errorText);
    } else {
      console.log("Comando enviado correctamente:", packet);
      console.log ("Paquete MQTT enviado al backend:", JSON.stringify (packet, null, 2))
    }
  } catch (error) {
    console.error(" No se pudo conectar al servidor:", error);
  }
}

// ---------------------------------------------------------------
// handleMove: cuando se presiona una dirección (pressed)
// ---------------------------------------------------------------
const handleMove = useCallback(async (direction: 'forward' | 'backward' | 'left' | 'right') => {
  // Actualiza estado visual de la UI
  setControlState(prev => ({ ...prev, direction }));

  // Construye el paquete con estado "pressed"
  const packet = buildPololuPacket(direction, controlState.speed, "pressed");

  // Envíalo al backend
  await sendPololuPacket(packet);

}, [controlState.speed]);

// ---------------------------------------------------------------
// handleStop: cuando se suelta el botón (released)
// ---------------------------------------------------------------
const handleStop = useCallback(async () => {
  // Guardamos la última dirección antes de detener
  setControlState(prev => {
    const lastDirection = prev.direction;

    // Construye paquete "released" ANTES de poner stop
    const packet = buildPololuPacket(lastDirection, 0, "released");
    sendPololuPacket(packet);

    // Retorna el nuevo estado con dirección "stop"
    return { ...prev, direction: "stop" };
  });
}, []);
 
  // Controles de teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.key)) {
        e.preventDefault();
      }

      switch (e.key) {
        case 'ArrowUp':
          if (activeKey !== 'up') {
            setActiveKey('up');
            handleMove('forward');
          }
          break;
        case 'ArrowDown':
          if (activeKey !== 'down') {
            setActiveKey('down');
            handleMove('backward');
          }
          break;
        case 'ArrowLeft':
          if (activeKey !== 'left') {
            setActiveKey('left');
            handleMove('left');
          }
          break;
        case 'ArrowRight':
          if (activeKey !== 'right') {
            setActiveKey('right');
            handleMove('right');
          }
          break;
        case ' ':
        case 'Space':
          handleStop();
          setActiveKey(null);
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        handleStop();
        setActiveKey(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [activeKey, handleMove, handleStop]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getDirectionIcon = () => {
    switch (controlState.direction) {
      case 'forward':
        return <ArrowUp className="w-6 h-6" />;
      case 'backward':
        return <ArrowDown className="w-6 h-6" />;
      case 'left':
        return <ArrowLeft className="w-6 h-6" />;
      case 'right':
        return <ArrowRight className="w-6 h-6" />;
      default:
        return <Circle className="w-6 h-6" />;
    }
  };

  const toggleRecording = (cameraId: string) => {
    setCameras(prev => prev.map(cam =>
      cam.id === cameraId ? { ...cam, isRecording: !cam.isRecording } : cam
    ));
  };

 // Refresca el stream forzando cache-busting sobre la URL del backend
const refreshCamera = (cameraId: string) => {
  // Buscamos el ID backend (si no existe, no hacemos nada)
  const backendId = CAM_BACKEND_ID[cameraId];
  // Actualizamos solo esa cámara, re-asignando el 'stream' con ?t=timestamp
  setCameras(prev =>
    prev.map(cam =>
      cam.id === cameraId && backendId
        ? { ...cam, stream: buildStreamURL(backendId, true) } // true => cache-bust
        : cam
    )
  );
};

// Envía comandos PTZ reales al backend y actualiza estado local como feedback visual
const handlePTZControl = async (
  cameraId: string,
  control: 'pan-left' | 'pan-right' | 'tilt-up' | 'tilt-down' | 'zoom-in' | 'zoom-out'
) => {
  // Obtenemos el ID de backend asociado (si no hay, no intentamos nada)
  const backendId = CAM_BACKEND_ID[cameraId];
  // Si la cámara no está mapeada al backend (cam3..cam6 por ahora), solo actualizamos UI local
  if (!backendId) {
    // Mantén tu feedback visual local (igual que antes)
    setCameras(prev => prev.map(cam => {
      if (cam.id !== cameraId) return cam;       // Si no es la cámara objetivo, la dejamos igual
      // Ajustamos valores locales (pan/tilt/zoom) como simulación de respuesta
      switch (control) {
        case 'pan-left':  return { ...cam, pan:  Math.max(cam.pan - 10, -180) };
        case 'pan-right': return { ...cam, pan:  Math.min(cam.pan + 10,  180) };
        case 'tilt-up':   return { ...cam, tilt: Math.min(cam.tilt + 10,   90) };
        case 'tilt-down': return { ...cam, tilt: Math.max(cam.tilt - 10,  -90) };
        case 'zoom-in':   return { ...cam, zoom: Math.min(cam.zoom + 0.5, 10) };
        case 'zoom-out':  return { ...cam, zoom: Math.max(cam.zoom - 0.5,  1) };
        default:          return cam;            // Cualquier otro caso no cambia el estado
      }
    }));
    // Salimos porque no hay backend asociado que invocar
    return;
  }

  // Si hay backend, construimos el comando esperado por /api/cameras/<id>/ptz/
  const cmd = mapPTZCmd(control);                 // Traducimos el control de UI al "cmd" del backend
  // Por seguridad, si el mapeo no devuelve nada, no hacemos la llamada
  if (!cmd) return;

  try {
    // Enviamos el POST con JSON {"cmd": "...", "speed": 4}, usando el endpoint del backend
    const res = await fetch(`/api/cameras/${backendId}/ptz/`, {
      method: 'POST',                              // Método HTTP según tu ptz_view
      headers: { 'Content-Type': 'application/json' },  // Indicamos que el body es JSON
      body: JSON.stringify({ cmd, speed: 4 }),     // Velocidad 4 por defecto (puedes exponer control luego)
    });

    // Si la respuesta no es 2xx, podemos registrar el error (tu backend devuelve {"ok": false, "error": "..."} en 500)
    if (!res.ok) {
      // Intentamos leer el json para log de depuración
      try {
        const data = await res.json();            // Parseamos posible respuesta JSON de error
        console.warn('PTZ backend error:', data); // Mostramos advertencia en consola para depurar
      } catch {
        console.warn('PTZ backend error (no json).'); // Si no vino JSON, igual dejamos aviso
      }
    }
  } catch (err) {
    // Si fetch lanza excepción (timeout/red), lo registramos para diagnóstico
    console.warn('PTZ request failed:', err);     // Mensaje útil en consola para depurar conectividad
  }

  // Actualizamos UI local como feedback inmediato, independientemente del resultado (optimista)
  setCameras(prev => prev.map(cam => {
    if (cam.id !== cameraId) return cam;          // Solo modificamos la cámara objetivo
    switch (control) {
      case 'pan-left':  return { ...cam, pan:  Math.max(cam.pan - 10, -180) }; // Disminuye pan
      case 'pan-right': return { ...cam, pan:  Math.min(cam.pan + 10,  180) }; // Aumenta pan
      case 'tilt-up':   return { ...cam, tilt: Math.min(cam.tilt + 10,   90) }; // Sube tilt
      case 'tilt-down': return { ...cam, tilt: Math.max(cam.tilt - 10,  -90) }; // Baja tilt
      case 'zoom-in':   return { ...cam, zoom: Math.min(cam.zoom + 0.5, 10) }; // Feedback zoom
      case 'zoom-out':  return { ...cam, zoom: Math.max(cam.zoom - 0.5,  1) }; // Feedback zoom
      default:          return cam;               // Si ocurre algo no previsto, no cambiamos
    }
  }));
};

  const getMosaicGridClass = () => {
    switch (mosaicLayout) {
      case '2x3':
        return 'grid-cols-2 grid-rows-3';
      case '3x2':
        return 'grid-cols-3 grid-rows-2';
      case '1x6':
        return 'grid-cols-6 grid-rows-1';
      default:
        return 'grid-cols-2 grid-rows-3';
    }
  };

  const renderCamera = (camera: CameraState, size: 'small' | 'medium' | 'large' | 'full', showControls: boolean = false) => {
    const sizeClasses = {
      small: 'h-32',
      medium: 'h-48',
      large: 'h-96',
      full: 'h-full'
    };

    return (
      <div
        key={camera.id}
        className={`relative bg-gray-900 rounded-lg overflow-hidden ${sizeClasses[size]} group`}
        onClick={() => size === 'small' && setFocusedCamera(camera.id)}
      >
        {/* Stream de cámara desde backend (MJPEG via <img>) */}
    <img
  // Usamos el 'stream' que inicializamos en useEffect para cam1/cam2
  src={camera.stream /* URL /api/cameras/<id>/stream/ */}
  // Hacemos que ocupe todo el contenedor disponible y recorte manteniendo proporción
  className="w-full h-full object-cover bg-black"
  // Marcamos con alt el nombre de la cámara para accesibilidad
  alt={camera.name}
  // Si ocurre un error cargando (por ejemplo cámara offline), mostramos un fondo y dejamos isConnected como está
  onError={(e) => {
    // Si falla, opcionalmente podrías reemplazar por una imagen gris (ya tenemos el header que lo indica)
    // (Aquí no mutamos estado para no disparar loops; el polling de status ya marca offline)
    // Podemos, no obstante, limpiar el 'src' para evitar spinner infinito.
    const el = e.currentTarget;            // Obtenemos el elemento <img>
    el.removeAttribute('src');             // Quitamos el src para dejar el fondo
  }}
/>


        {/* Camera header */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 to-transparent p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${camera.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span className="text-white text-xs font-medium">{camera.name}</span>
            </div>
            <div className="flex items-center gap-1">
              {camera.isRecording && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-red-500 text-xs">REC</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions (visible on hover in mosaic) */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); toggleRecording(camera.id); }}
              disabled={!camera.isConnected}
              className={`p-2 rounded-lg transition-colors duration-200 ${
                camera.isRecording
                  ? 'bg-red-500 hover:bg-red-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {camera.isRecording ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); refreshCamera(camera.id); }}
              disabled={!camera.isConnected}
              className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {size === 'small' && (
              <button
                onClick={(e) => { e.stopPropagation(); setFocusedCamera(camera.id); setViewMode('focus'); }}
                disabled={!camera.isConnected}
                className="p-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* PTZ Controls (for focus mode) */}
        {showControls && showPTZControls && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
              <div className="grid grid-cols-3 gap-2 mb-4">
                <div></div>
                <button
                  onClick={() => handlePTZControl(camera.id, 'tilt-up')}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
                >
                  <ArrowUp className="w-5 h-5" />
                </button>
                <div></div>
                <button
                  onClick={() => handlePTZControl(camera.id, 'pan-left')}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setShowPTZControls(false)}
                  className="p-3 bg-red-500/80 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
                >
                  <Circle className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePTZControl(camera.id, 'pan-right')}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
                >
                  <ArrowRight className="w-5 h-5" />
                </button>
                <div></div>
                <button
                  onClick={() => handlePTZControl(camera.id, 'tilt-down')}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
                >
                  <ArrowDown className="w-5 h-5" />
                </button>
                <div></div>
              </div>
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => handlePTZControl(camera.id, 'zoom-out')}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
                >
                  <ZoomOut className="w-5 h-5" />
                </button>
                <button
                  onClick={() => handlePTZControl(camera.id, 'zoom-in')}
                  className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200"
                >
                  <ZoomIn className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Direction overlay (for keyboard control) */}
        {size === 'large' && activeKey && (
          <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
            <div className="bg-uvg-yellow/90 rounded-full p-6 shadow-2xl">
              {getDirectionIcon()}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCameraView = () => {
    switch (viewMode) {
      case 'mosaic':
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">Layout:</span>
                <div className="flex gap-2">
                  {(['2x3', '3x2', '1x6'] as MosaicLayout[]).map(layout => (
                    <button
                      key={layout}
                      onClick={() => setMosaicLayout(layout)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors duration-200 ${
                        mosaicLayout === layout
                          ? 'bg-uvg-green-dark text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {layout}
                    </button>
                  ))}
                </div>
              </div>
              {pinnedCamera && (
                <button
                  onClick={() => setPinnedCamera(null)}
                  className="text-xs text-uvg-green-dark hover:text-uvg-green-light"
                >
                  Dejar de fijar
                </button>
              )}
            </div>
            <div className={`grid ${getMosaicGridClass()} gap-4`}>
              {cameras.map(camera => renderCamera(camera, pinnedCamera === camera.id ? 'medium' : 'small'))}
            </div>
          </div>
        );

      case 'focus':
        const focusedCam = cameras.find(c => c.id === focusedCamera) || cameras[0];
        const otherCameras = cameras.filter(c => c.id !== focusedCamera);

        return (
          <div className="space-y-4">
            <div className="relative">
              {renderCamera(focusedCam, 'large', true)}

              {/* Fixed controls below main camera */}
              <div className="mt-4 flex items-center justify-center gap-4">
                <button
                  onClick={() => toggleRecording(focusedCam.id)}
                  disabled={!focusedCam.isConnected}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                    focusedCam.isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-uvg-green-dark hover:bg-uvg-green-light text-white'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {focusedCam.isRecording ? 'Detener Grabación' : 'Iniciar Grabación'}
                </button>
                <button
                  onClick={() => setShowPTZControls(!showPTZControls)}
                  disabled={!focusedCam.isConnected}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Move className="w-5 h-5 inline mr-2" />
                  Controles PTZ
                </button>
              </div>
            </div>

            {/* Thumbnail cameras */}
            <div className="grid grid-cols-5 gap-3">
              {otherCameras.map(camera => (
                <button
                  key={camera.id}
                  onClick={() => setFocusedCamera(camera.id)}
                  className="relative rounded-lg overflow-hidden hover:ring-2 hover:ring-uvg-green-light transition-all duration-200"
                >
                  {renderCamera(camera, 'small')}
                </button>
              ))}
            </div>
          </div>
        );

      case 'cycle':
        const currentCamera = cameras[currentCycleIndex];

        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between bg-uvg-green-dark/10 rounded-lg p-3">
              <div className="flex items-center gap-3">
                <RotateCw className="w-5 h-5 text-uvg-green-dark animate-spin" style={{ animationDuration: '3s' }} />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  Modo Cíclico - {currentCamera.name}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-400">
                  ({currentCycleIndex + 1}/{cameras.length})
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-600 dark:text-gray-400">Intervalo:</span>
                <select
                  value={cycleInterval}
                  onChange={(e) => setCycleInterval(parseInt(e.target.value))}
                  className="px-3 py-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-sm"
                >
                  <option value={5}>5s</option>
                  <option value={10}>10s</option>
                  <option value={15}>15s</option>
                  <option value={30}>30s</option>
                </select>
              </div>
            </div>
            {renderCamera(currentCamera, 'full')}
          </div>
        );

      case 'fullscreen':
        return (
          <div className="fixed inset-0 z-50 bg-black">
            <div className="absolute top-4 right-4 z-10">
              <button
                onClick={() => setViewMode('mosaic')}
                className="p-3 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors duration-200 backdrop-blur-sm"
              >
                <Minimize2 className="w-6 h-6" />
              </button>
            </div>
            <div className="h-full p-4 grid grid-cols-3 grid-rows-2 gap-4">
              {cameras.map(camera => renderCamera(camera, 'medium'))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Control del Pololu
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Control directo del robot con visualización multimodo de cámaras
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setControlState(prev => ({ ...prev, isConnected: !prev.isConnected }))}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              controlState.isConnected
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            {controlState.isConnected ? (
              <>
                <Power className="w-4 h-4" />
                Conectado
              </>
            ) : (
              <>
                <PowerOff className="w-4 h-4" />
                Desconectado
              </>
            )}
          </button>
          <button
            onClick={handleStop}
            className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            title="Parada de emergencia"
          >
            <AlertCircle className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            {controlState.isConnected ? (
              <CheckCircle className="w-8 h-8 text-green-500" />
            ) : (
              <AlertCircle className="w-8 h-8 text-red-500" />
            )}
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {controlState.isConnected ? 'En línea' : 'Desconectado'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Batería</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {controlState.battery}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Timer className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo activo</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {formatTime(controlState.activeTime)}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Control Panel - 1 columna */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Panel de Control
            </h3>
            <div className="flex items-center gap-2">
              <Radio className={`w-5 h-5 ${controlState.direction !== 'stop' ? 'text-green-500 animate-pulse' : 'text-gray-400'}`} />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {controlState.direction !== 'stop' ? 'Activo' : 'Detenido'}
              </span>
            </div>
          </div>

          {/* D-Pad Control */}
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="text-center mb-2">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Dirección actual</p>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-uvg-green-light/10 rounded-lg">
                {getDirectionIcon()}
                <span className="font-medium text-gray-900 dark:text-white capitalize">
                  {controlState.direction === 'stop' ? 'Detenido' :
                   controlState.direction === 'forward' ? 'Adelante' :
                   controlState.direction === 'backward' ? 'Atrás' :
                   controlState.direction === 'left' ? 'Izquierda' : 'Derecha'}
                </span>
              </div>
            </div>

            {/* D-Pad Layout */}
            <div className="relative w-64 h-64">
              <button
                onClick={handleStop}
                disabled={!controlState.isConnected}
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-full shadow-lg transition-all duration-200 flex items-center justify-center z-10"
              >
                <Circle className="w-6 h-6" />
              </button>

              <button
                onMouseDown={() => handleMove('forward')}
                onMouseUp={handleStop}
                onMouseLeave={handleStop}
                onTouchStart={() => handleMove('forward')}
                onTouchEnd={handleStop}
                disabled={!controlState.isConnected}
                className={`absolute top-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-t-3xl shadow-lg transition-all duration-200 flex items-center justify-center ${
                  activeKey === 'up' || controlState.direction === 'forward'
                    ? 'bg-uvg-green-dark text-white scale-105'
                    : 'bg-uvg-green-light hover:bg-uvg-green-dark text-uvg-green-dark hover:text-white'
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                <ArrowUp className="w-8 h-8" />
              </button>

              <button
                onMouseDown={() => handleMove('backward')}
                onMouseUp={handleStop}
                onMouseLeave={handleStop}
                onTouchStart={() => handleMove('backward')}
                onTouchEnd={handleStop}
                disabled={!controlState.isConnected}
                className={`absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-20 rounded-b-3xl shadow-lg transition-all duration-200 flex items-center justify-center ${
                  activeKey === 'down' || controlState.direction === 'backward'
                    ? 'bg-uvg-green-dark text-white scale-105'
                    : 'bg-uvg-green-light hover:bg-uvg-green-dark text-uvg-green-dark hover:text-white'
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                <ArrowDown className="w-8 h-8" />
              </button>

              <button
                onMouseDown={() => handleMove('left')}
                onMouseUp={handleStop}
                onMouseLeave={handleStop}
                onTouchStart={() => handleMove('left')}
                onTouchEnd={handleStop}
                disabled={!controlState.isConnected}
                className={`absolute left-0 top-1/2 -translate-y-1/2 w-20 h-20 rounded-l-3xl shadow-lg transition-all duration-200 flex items-center justify-center ${
                  activeKey === 'left' || controlState.direction === 'left'
                    ? 'bg-uvg-green-dark text-white scale-105'
                    : 'bg-uvg-green-light hover:bg-uvg-green-dark text-uvg-green-dark hover:text-white'
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                <ArrowLeft className="w-8 h-8" />
              </button>

              <button
                onMouseDown={() => handleMove('right')}
                onMouseUp={handleStop}
                onMouseLeave={handleStop}
                onTouchStart={() => handleMove('right')}
                onTouchEnd={handleStop}
                disabled={!controlState.isConnected}
                className={`absolute right-0 top-1/2 -translate-y-1/2 w-20 h-20 rounded-r-3xl shadow-lg transition-all duration-200 flex items-center justify-center ${
                  activeKey === 'right' || controlState.direction === 'right'
                    ? 'bg-uvg-green-dark text-white scale-105'
                    : 'bg-uvg-green-light hover:bg-uvg-green-dark text-uvg-green-dark hover:text-white'
                } disabled:bg-gray-400 disabled:cursor-not-allowed`}
              >
                <ArrowRight className="w-8 h-8" />
              </button>
            </div>

            <div className="text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Usa las flechas del teclado o presiona los botones
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                <kbd className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs">Espacio</kbd> para detener
              </p>
            </div>
          </div>

          {/* Speed Control */}
          <div className="mt-6">
            <div className="flex items-center gap-3 mb-4">
              <Gauge className="w-5 h-5 text-uvg-green-dark" />
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                Velocidad
              </h4>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600 dark:text-gray-400">Actual</span>
                <span className="text-lg font-bold text-uvg-green-dark">{controlState.speed}%</span>
              </div>

              <input
                type="range"
                min="0"
                max="100"
                value={controlState.speed}
                onChange={(e) => setControlState(prev => ({ ...prev, speed: parseInt(e.target.value) }))}
                disabled={!controlState.isConnected}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                style={{
                  background: `linear-gradient(to right, #00703c 0%, #00703c ${controlState.speed}%, #e5e7eb ${controlState.speed}%, #e5e7eb 100%)`
                }}
              />

              <div className="grid grid-cols-4 gap-2">
                {[25, 50, 75, 100].map((speed) => (
                  <button
                    key={speed}
                    onClick={() => setControlState(prev => ({ ...prev, speed }))}
                    disabled={!controlState.isConnected}
                    className={`px-2 py-1 rounded-lg text-xs font-medium transition-colors duration-200 ${
                      controlState.speed === speed
                        ? 'bg-uvg-green-dark text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {speed}%
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Camera View - 2 columnas */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6 text-uvg-green-dark" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Vista de Cámaras
              </h3>
            </div>

            {/* View Mode Selector */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('mosaic')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'mosaic'
                    ? 'bg-uvg-green-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
                title="Mosaico"
              >
                <Grid3x3 className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('focus')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'focus'
                    ? 'bg-uvg-green-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
                title="Enfocar una cámara"
              >
                <Eye className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('cycle')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'cycle'
                    ? 'bg-uvg-green-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
                title="Alternar cíclico"
              >
                <RotateCw className="w-5 h-5" />
              </button>
              <button
                onClick={() => setViewMode('fullscreen')}
                className={`p-2 rounded-lg transition-colors duration-200 ${
                  viewMode === 'fullscreen'
                    ? 'bg-uvg-green-dark text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                }`}
                title="Pantalla completa"
              >
                <Monitor className="w-5 h-5" />
              </button>
            </div>
          </div>

          {renderCameraView()}
        </div>
      </div>
    </div>
  );
}
