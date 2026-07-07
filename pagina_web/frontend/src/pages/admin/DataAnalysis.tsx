// ======================================================================================
// Archivo: DataAnalysis.tsx
// Descripción general:
// --------------------------------------------------------------------------------------
// Este componente React representa el módulo de análisis de datos del sistema Robotat.
// Se encarga de:
//  - Conectarse al backend (canal MQTT) mediante WebSocket.
//  - Recibir y procesar datos de captura de movimiento (MoCap) en tiempo real.
//  - Calcular métricas como integridad, duplicados, pérdidas y velocidades.
//  - Renderizar gráficas dinámicas (trayectoria XY, 3D y velocidad) en elementos <canvas>.
//  - Exportar los datos en formato CSV o JSON para análisis posterior.
// ======================================================================================

// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT

// --------------------------------------------------------------------------------------
// Importaciones base de React y hooks fundamentales
// --------------------------------------------------------------------------------------
import React, { useState, useEffect, useRef } from 'react'; 
// useState: Manejo de estados internos del componente.
// useEffect: Efectos secundarios (ej. conexión WebSocket o redibujar gráficos).
// useRef: Referencias persistentes para acceder a elementos DOM (canvas) o variables.

// --------------------------------------------------------------------------------------
// Importación de íconos desde la librería lucide-react
// --------------------------------------------------------------------------------------
// Estos íconos se utilizan en la interfaz para representar visualmente
// métricas, botones, acciones y secciones del panel de análisis.
import {
  Activity,        // Indicador de actividad general o movimiento.
  TrendingUp,      // Representa métricas ascendentes o positivas.
  TrendingDown,    // Representa métricas descendentes o negativas.
  Database,        // Ícono para secciones de datos o registros.
  Download,        // Ícono de descarga (CSV / JSON).
  AlertTriangle,   // Alerta visual de errores o datos corruptos.
  Package,         // Representa paquetes MQTT recibidos.
  BarChart3,       // Icono para gráficas de barras o métricas de calidad.
  Wifi,            // Ícono de conexión a red o estado de recepción.
  FileText,        // Representa exportación o archivos de texto.
  RefreshCw,       // Botón de reinicio o actualización.
  Filter,          // Reservado para futuros filtros de datos.
  Maximize2,       // Botón de maximizar una figura (canvas).
  Box,             // Figura 3D o representación espacial.
  Radio,           // Estado de “marker detectado”.
  Shield,          // Indicador de integridad o seguridad.
  Info,            // Información adicional o descripción.
  Eye,             // Mostrar una gráfica.
  EyeOff,          // Ocultar una gráfica.
  X,               // Cerrar una figura.
  Minimize2,       // Minimizar una figura expandida.
  LineChart,       // Representa gráficas de trayectoria XY.
  Gauge            // Representa gráficas de velocidad o magnitud.
} from 'lucide-react';


// ======================================================================================
// Definición de interfaces (tipos de datos usados dentro del componente)
// ======================================================================================

// --------------------------------------------------------------------------------------
// Interface: MoCapData
// --------------------------------------------------------------------------------------
// Representa un paquete de datos recibido del sistema de captura de movimiento (MoCap).
// Cada paquete contiene información de posición, orientación, validación y checksum.
interface MoCapData {
  id: string;              // Identificador único del paquete (usado para renderizado en tabla).
  timestamp: number;       // Marca de tiempo en milisegundos.
  src: string;             // Fuente o ID del marcador (ej. “1”, “2”, “3”…).
  pid: number;             // Identificador del paquete (packet ID) asignado por el sistema.
  cks: string;             // Checksum o hash usado para verificar duplicados/corrupción.
  pld: {                   // Payload (carga útil) con la información de pose.
    x: number;             // Coordenada X en metros.
    y: number;             // Coordenada Y en metros.
    z: number;             // Coordenada Z en metros.
    qx: number;            // Cuaternión (componente X) que define la orientación.
    qy: number;            // Cuaternión (componente Y).
    qz: number;            // Cuaternión (componente Z).
    qw: number;            // Cuaternión (componente W o escalar).
  };
  valid: boolean;          // Indica si el paquete pasó las validaciones de formato y checksum.
  velocity?: number;       // Velocidad instantánea (calculada entre muestras sucesivas).
}


// --------------------------------------------------------------------------------------
// Interface: PacketStats
// --------------------------------------------------------------------------------------
// Agrupa estadísticas globales sobre los paquetes recibidos desde el sistema MQTT.
interface PacketStats {
  total: number;              // Número total de paquetes procesados.
  valid: number;              // Paquetes válidos sin errores.
  corrupted: number;          // Paquetes detectados como corruptos o inválidos.
  duplicates: number;         // Paquetes duplicados (mismo checksum repetido).
  lostEstimated: number;      // Estimación de paquetes perdidos (por discontinuidad en IDs).
  integrityPercent: number;   // Porcentaje de integridad (paquetes válidos / total).
  duplicateRate: number;      // Porcentaje de duplicados.
  lossRate: number;           // Porcentaje estimado de pérdida.
}


// --------------------------------------------------------------------------------------
// Interface: TrajectoryPoint
// --------------------------------------------------------------------------------------
// Define un punto individual dentro de la trayectoria calculada para un marcador específico.
interface TrajectoryPoint {
  x: number;          // Coordenada X en metros.
  y: number;          // Coordenada Y en metros.
  z: number;          // Coordenada Z en metros.
  timestamp: number;  // Tiempo de captura de este punto.
  velocity: number;   // Velocidad estimada en ese instante.
}


// --------------------------------------------------------------------------------------
// Interface: MarkerVisibility
// --------------------------------------------------------------------------------------
// Controla qué gráficos están visibles para cada marcador detectado.
// Permite mostrar u ocultar gráficas XY, 3D y de velocidad por marcador.
interface MarkerVisibility {
  [markerId: string]: {
    xy: boolean;        // Estado de visibilidad de la gráfica XY.
    traj3d: boolean;    // Estado de visibilidad de la trayectoria 3D.
    velocity: boolean;  // Estado de visibilidad de la gráfica de velocidad.
  };
}


// --------------------------------------------------------------------------------------
// Interface: MarkerData
// --------------------------------------------------------------------------------------
// Agrupa toda la información asociada a cada marcador detectado.
// Incluye los paquetes recibidos y la trayectoria calculada.
interface MarkerData {
  [markerId: string]: {
    data: MoCapData[];           // Lista de paquetes recibidos (historial reciente).
    trajectory: TrajectoryPoint[]; // Trayectoria reconstruida (puntos X, Y, Z, velocidad).
  };
}


// --------------------------------------------------------------------------------------
// Interface: FigureState
// --------------------------------------------------------------------------------------
// Controla el estado visual de cada figura (canvas) del análisis.
// Se utiliza para determinar si está maximizada o no.
interface FigureState {
  [figureId: string]: {
    maximized: boolean;   // true = figura expandida en pantalla completa.
  };
}


// ======================================================================================
// Componente principal: DataAnalysis
// --------------------------------------------------------------------------------------
// Este componente engloba toda la lógica del análisis de datos de movimiento.
// Se comunica con el backend mediante WebSocket y renderiza los resultados en tiempo real.
// ======================================================================================
export function DataAnalysis() {

  // ------------------------------------------------------------------------------------
  // Estado: Control general de la recolección de datos
  // ------------------------------------------------------------------------------------
  // isCollecting: indica si la interfaz debe estar recibiendo y procesando datos.
  // setIsCollecting: función que activa o pausa la recepción de datos.
  const [isCollecting, setIsCollecting] = useState(true);


  // ------------------------------------------------------------------------------------
  // Estado: Métricas y estadísticas globales de paquetes
  // ------------------------------------------------------------------------------------
  // packetStats: objeto que almacena los contadores globales de los paquetes procesados.
  // Inicialmente se define con todos los valores en cero y 100% de integridad.
  const [packetStats, setPacketStats] = useState<PacketStats>({
    total: 0,
    valid: 0,
    corrupted: 0,
    duplicates: 0,
    lostEstimated: 0,
    integrityPercent: 100,
    duplicateRate: 0,
    lossRate: 0
  });


  // ------------------------------------------------------------------------------------
  // Estado: Datos de cada marcador detectado
  // ------------------------------------------------------------------------------------
  // markerData: almacena los datos recibidos y la trayectoria reconstruida para cada marcador.
  const [markerData, setMarkerData] = useState<MarkerData>({});


  // ------------------------------------------------------------------------------------
  // Estado: Visibilidad de las gráficas por marcador
  // ------------------------------------------------------------------------------------
  // markerVisibility: controla si las gráficas XY, 3D y velocidad están visibles para cada marcador.
  const [markerVisibility, setMarkerVisibility] = useState<MarkerVisibility>({});


  // ------------------------------------------------------------------------------------
  // Estado: Control de visualización de cada figura
  // ------------------------------------------------------------------------------------
  // figureStates: permite alternar entre modo normal o maximizado en cada figura individual.
  const [figureStates, setFigureStates] = useState<FigureState>({});


  // ------------------------------------------------------------------------------------
  // Estado: Registro de checksums (para detección de duplicados)
  // ------------------------------------------------------------------------------------
  // checksumRegistry: conjunto de valores únicos de checksum recibidos.
  // Se usa para calcular cuántos paquetes han sido repetidos.
  const [checksumRegistry, setChecksumRegistry] = useState<Set<string>>(new Set());


  // ------------------------------------------------------------------------------------
  // Referencia: Control del tiempo entre actualizaciones
  // ------------------------------------------------------------------------------------
  // lastUpdateRef: se utiliza para limitar la frecuencia de actualización de la interfaz.
  // Guarda la marca de tiempo de la última actualización procesada (en ms).
  const lastUpdateRef = useRef(0);


  // ------------------------------------------------------------------------------------
  // Referencia: Almacenamiento de referencias a elementos <canvas>
  // ------------------------------------------------------------------------------------
  // canvasRefs: mantiene referencias a todos los elementos de tipo canvas (XY, 3D, velocidad).
  // La clave del diccionario combina el ID del marcador y el tipo de figura.
  const canvasRefs = useRef<{ [key: string]: HTMLCanvasElement | null }>({});


  // Conexión WebSocket con el backend MQTT
  useEffect(() => {
    if (!isCollecting) return;

    const backendHost =
      window.location.hostname.includes("192.168.") ?
      `ws://${window.location.hostname}:8000/ws/mqtt/` :
      "ws://localhost:8000/ws/mqtt/";

    const ws = new WebSocket(backendHost);

    ws.onopen = () => console.log("[WS] Conectado al canal MQTT");

    ws.onmessage = (event) => {
  try {
    // --- Parsear el mensaje recibido del backend ---
    const data = JSON.parse(event.data);
    if (data.type !== "mqtt_message") return; // Ignorar otros tipos de mensajes

    // --- Control de tasa de actualización (máx 1 cada 250 ms) ---
    const now = Date.now();
    if (now - lastUpdateRef.current < 250) return;
    lastUpdateRef.current = now;

    // ===============================================================
    // Interpretación de la estructura real del paquete
    // ===============================================================
    // En los mensajes de tipo "mocap/allv2", la estructura real es:
    // {
    //   "src": 0,
    //   "pid": 19,
    //   "pld": {
    //     "pose": {
    //       "position": {"x": 0.0, "y": -0.5, "z": 1.2},
    //       "orientation": {"qx": 0.0, "qy": 0.0, "qz": 0.0, "qw": 1.0}
    //     }
    //   }
    // }
    // ===============================================================

    const p = data.packet || data || {};            // Soporta ambas estructuras
    const pose = p.pld?.pose || {};                 // Acceder a pose dentro del payload
    const position = pose.position || {};           // Posición 3D
    const orientation = pose.orientation || {};     // Orientación (cuaterniones)

    // --- Asignar ID del marker ---
    const markerId = String(p.src ?? "UNKNOWN");

    // --- Validar que haya coordenadas válidas antes de continuar ---
    if (
      !isFinite(position.x) ||
      !isFinite(position.y) ||
      !isFinite(position.z)
    ) {
      console.warn("Paquete inválido, ignorado:", p);
      return;
    }

    // --- Construir el nuevo paquete en formato estandarizado ---
    const newPacket: MoCapData = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      src: markerId,
      pid: Number(p.pid ?? 0),
      cks: String(p.cks ?? ""),
      pld: {
        x: Number(position.x ?? 0),
        y: Number(position.y ?? 0),
        z: Number(position.z ?? 0),
        qx: Number(orientation.qx ?? 0),
        qy: Number(orientation.qy ?? 0),
        qz: Number(orientation.qz ?? 0),
        qw: Number(orientation.qw ?? 1)
      },
      valid: true,
    };

    console.log(
  `[MoCap] ${markerId} → X:${newPacket.pld.x.toFixed(3)}  Y:${newPacket.pld.y.toFixed(3)}  Z:${newPacket.pld.z.toFixed(3)}`
);


    
        setMarkerData(prev => {
          const markerInfo = prev[markerId] || { data: [], trajectory: [] };
          const prevPoint = markerInfo.trajectory[markerInfo.trajectory.length - 1];

          const velocity = prevPoint
            ? Math.sqrt(
                Math.pow(newPacket.pld.x - prevPoint.x, 2) +
                Math.pow(newPacket.pld.y - prevPoint.y, 2) +
                Math.pow(newPacket.pld.z - prevPoint.z, 2)
              ) / ((newPacket.timestamp - prevPoint.timestamp) / 1000)
            : 0;

          newPacket.velocity = velocity;

          const newTrajectoryPoint: TrajectoryPoint = {
            x: newPacket.pld.x,
            y: newPacket.pld.y,
            z: newPacket.pld.z,
            timestamp: newPacket.timestamp,
            velocity
          };

          return {
            ...prev,
            [markerId]: {
              data: [newPacket, ...markerInfo.data].slice(0, 200),
              trajectory: [...markerInfo.trajectory, newTrajectoryPoint].slice(-100)
            }
          };
        });

        // Inicializar visibilidad del marker si no existe
        setMarkerVisibility(prev => {
          if (!prev[markerId]) {
            return {
              ...prev,
              [markerId]: { xy: true, traj3d: true, velocity: true }
            };
          }
          return prev;
        });

        setPacketStats(prev => {
          const isDuplicate = checksumRegistry.has(newPacket.cks);
          const total = prev.total + 1;
          const valid = prev.valid + 1;
          const duplicates = isDuplicate ? prev.duplicates + 1 : prev.duplicates;
          const integrityPercent = total > 0 ? (valid / total) * 100 : 100;
          const duplicateRate = total > 0 ? (duplicates / total) * 100 : 0;

          return {
            ...prev,
            total,
            valid,
            duplicates,
            integrityPercent,
            duplicateRate,
          };
        });

        setChecksumRegistry(prev => new Set(prev).add(newPacket.cks));
      } catch (err) {
        console.error("[WS ERROR] Error procesando paquete MQTT:", err);
      }
    };

    ws.onclose = () => console.warn("[WS] Desconectado del canal MQTT");
    return () => ws.close();
  }, [isCollecting, checksumRegistry]);

  // Redibujar gráficos cada 200ms
  useEffect(() => {
    const interval = setInterval(() => {
      Object.keys(markerData).forEach(markerId => {
        if (markerVisibility[markerId]?.xy) {
          drawXYGraph(markerId);
        }
        if (markerVisibility[markerId]?.traj3d) {
          drawTrajectory3D(markerId);
        }
        if (markerVisibility[markerId]?.velocity) {
          drawVelocityGraph(markerId);
        }
      });
    }, 200);

    return () => clearInterval(interval);
  }, [markerData, markerVisibility]);

  const drawXYGraph = (markerId: string) => {
    const canvas = canvasRefs.current[`${markerId}-xy`];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const markerInfo = markerData[markerId];
    if (!markerInfo || markerInfo.data.length < 2) return;

    const validData = markerInfo.data.filter(d => d.valid && !isNaN(d.pld.x)).slice(0, 100);

    const maxX = Math.max(...validData.map(d => Math.abs(d.pld.x))) || 2;
    const maxY = Math.max(...validData.map(d => Math.abs(d.pld.y))) || 2;

    // Ejes
    ctx.strokeStyle = '#00703c';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('X', width - 15, height / 2 - 5);
    ctx.fillText('Y', width / 2 + 5, 15);

    const scaleX = (width / 2) / (maxX * 1.2);
    const scaleY = (height / 2) / (maxY * 1.2);

    // Trayectoria
    ctx.beginPath();
    validData.forEach((data, index) => {
      const x = width / 2 + data.pld.x * scaleX;
      const y = height / 2 - data.pld.y * scaleY;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    const gradient = ctx.createLinearGradient(0, 0, width, 0);
    gradient.addColorStop(0, '#00703c');
    gradient.addColorStop(1, '#fdb927');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Punto actual
    if (validData.length > 0) {
      const latest = validData[0];
      const x = width / 2 + latest.pld.x * scaleX;
      const y = height / 2 - latest.pld.y * scaleY;

      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#fdb927';
      ctx.fill();
      ctx.strokeStyle = '#00703c';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  };

  const drawTrajectory3D = (markerId: string) => {
    const canvas = canvasRefs.current[`${markerId}-3d`];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const markerInfo = markerData[markerId];
    if (!markerInfo || markerInfo.trajectory.length < 2) return;

    const trajectory = markerInfo.trajectory;

    const maxRange = 2;
    const scale = Math.min(width, height) / (maxRange * 2.5);
    const centerX = width / 2;
    const centerY = height / 2;

    // Grid
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([2, 2]);

    for (let i = -2; i <= 2; i++) {
      const y = centerY - i * scale;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    for (let i = -2; i <= 2; i++) {
      const x = centerX + i * scale;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('Vista XY (Z como intensidad)', 10, 20);

    // Puntos de trayectoria
    trajectory.forEach((point, index) => {
      const x = centerX + point.x * scale;
      const y = centerY - point.y * scale;
      const zIntensity = Math.max(0, Math.min(1, (point.z + 0.5) / 1));

      const age = (Date.now() - point.timestamp) / 10000;
      const alpha = Math.max(0.2, 1 - age);

      const size = 2 + zIntensity * 4;
      const hue = 120 + zIntensity * 60;

      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fillStyle = `hsla(${hue}, 70%, 50%, ${alpha})`;
      ctx.fill();

      if (index === trajectory.length - 1) {
        ctx.strokeStyle = '#fdb927';
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    });

    // Línea de trayectoria
    if (trajectory.length > 1) {
      ctx.beginPath();
      trajectory.forEach((point, index) => {
        const x = centerX + point.x * scale;
        const y = centerY - point.y * scale;

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.strokeStyle = 'rgba(0, 112, 60, 0.3)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  };

  const drawVelocityGraph = (markerId: string) => {
    const canvas = canvasRefs.current[`${markerId}-velocity`];
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const markerInfo = markerData[markerId];
    if (!markerInfo || markerInfo.trajectory.length < 2) return;

    const trajectory = markerInfo.trajectory.slice(-50);

    const maxVelocity = Math.max(...trajectory.map(p => p.velocity)) || 1;

    // Ejes
    ctx.strokeStyle = '#00703c';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.font = '10px sans-serif';
    ctx.fillStyle = '#666';
    ctx.fillText('Velocidad (m/s)', 10, 15);
    ctx.fillText(`Max: ${maxVelocity.toFixed(3)}`, width - 80, 15);

    const scaleX = width / trajectory.length;
    const scaleY = (height - 20) / (maxVelocity * 1.2);

    // Gráfica de velocidad
    ctx.beginPath();
    trajectory.forEach((point, index) => {
      const x = index * scaleX;
      const y = height - (point.velocity * scaleY);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#00703c');
    gradient.addColorStop(1, '#fdb927');
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Relleno bajo la curva
    ctx.lineTo(width, height);
    ctx.lineTo(0, height);
    ctx.closePath();
    ctx.fillStyle = 'rgba(0, 112, 60, 0.1)';
    ctx.fill();
  };

  // ============================================================
// Exportación de datos (CSV / JSON)
// ============================================================
const exportData = (format: 'csv' | 'json') => {
  // Tomamos todos los datos válidos de todos los markers
  const allData = Object.values(markerData)
    .flatMap(m => m.data)
    .filter(d => d.valid);

  if (allData.length === 0) {
    alert("No hay datos válidos para exportar");
    return;
  }

  if (format === 'csv') {
    const csvContent = [
      ['Timestamp', 'Source', 'PacketID', 'X', 'Y', 'Z', 'Velocity', 'Checksum'],
      ...allData.map(d => [
        new Date(d.timestamp).toISOString(),
        d.src,
        d.pid.toString(),
        d.pld.x.toFixed(3),
        d.pld.y.toFixed(3),
        d.pld.z.toFixed(3),
        (d.velocity || 0).toFixed(3),
        d.cks
      ])
    ]
      .map(row => row.join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    downloadFile(blob, `mocap_data_${Date.now()}.csv`);
  } else {
    const jsonContent = JSON.stringify(allData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadFile(blob, `mocap_data_${Date.now()}.json`);
  }
};

// ============================================================
// Función auxiliar para descargar archivos
// ============================================================
const downloadFile = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

  const toggleMarkerVisibility = (markerId: string, type: 'xy' | 'traj3d' | 'velocity') => {
    setMarkerVisibility(prev => ({
      ...prev,
      [markerId]: {
        ...prev[markerId],
        [type]: !prev[markerId]?.[type]
      }
    }));
  };

  const toggleFigureMaximize = (figureId: string) => {
    setFigureStates(prev => ({
      ...prev,
      [figureId]: {
        maximized: !prev[figureId]?.maximized
      }
    }));
  };

  const closeFigure = (markerId: string, type: 'xy' | 'traj3d' | 'velocity') => {
    toggleMarkerVisibility(markerId, type);
  };

  const resetStats = () => {
    setMarkerData({});
    setPacketStats({
      total: 0,
      valid: 0,
      corrupted: 0,
      duplicates: 0,
      lostEstimated: 0,
      integrityPercent: 100,
      duplicateRate: 0,
      lossRate: 0
    });
    setChecksumRegistry(new Set());
    setMarkerVisibility({});
  };

  const activeMarkers = Object.keys(markerData);

  return (
    <div className="space-y-6">
      {/* Header con controles principales */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Análisis y Monitoreo de Datos
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Sistema de visualización multi-marker con análisis en tiempo real
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollecting(!isCollecting)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
              isCollecting
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            <Wifi className="w-4 h-4" />
            {isCollecting ? 'Detener Recolección' : 'Iniciar Recolección'}
          </button>
          <button
            onClick={resetStats}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors duration-200"
          >
            <RefreshCw className="w-4 h-4" />
            Reiniciar
          </button>
        </div>
      </div>

      {/* Métricas globales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Integridad</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {packetStats.integrityPercent.toFixed(2)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {packetStats.valid}/{packetStats.total} válidos
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Corruptos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {packetStats.corrupted}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {((packetStats.corrupted / packetStats.total) * 100 || 0).toFixed(2)}% del total
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Duplicados</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {packetStats.duplicates}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tasa: {packetStats.duplicateRate.toFixed(3)}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <TrendingDown className="w-8 h-8 text-orange-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Pérdida estimada</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {packetStats.lostEstimated}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tasa: {packetStats.lossRate.toFixed(3)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
{/* Historial de Paquetes Válidos */}
{/* ============================================================ */}
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <Database className="w-6 h-6 text-uvg-green-dark" />
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historial de Paquetes Válidos
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Últimos 50 paquetes válidos recibidos
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => exportData('csv')}
          className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          <Download className="w-4 h-4" />
          CSV
        </button>
        <button
          onClick={() => exportData('json')}
          className="inline-flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 hover:bg-green-200 rounded-lg text-sm font-medium transition-colors duration-200"
        >
          <FileText className="w-4 h-4" />
          JSON
        </button>
      </div>
    </div>
  </div>

  {/* Tabla */}
  <div className="overflow-x-auto">
    <table className="w-full">
      <thead className="bg-gray-50 dark:bg-gray-700">
        <tr>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Timestamp</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">X (m)</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Y (m)</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Z (m)</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Velocidad (m/s)</th>
          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Checksum</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
        {Object.values(markerData)
          .flatMap(m => m.data)
          .filter(d => d.valid)
          .slice(0, 50)
          .map((data) => (
            <tr key={data.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                {new Date(data.timestamp).toLocaleTimeString()}
              </td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{data.src}</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">{data.pld.x.toFixed(3)}</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">{data.pld.y.toFixed(3)}</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">{data.pld.z.toFixed(3)}</td>
              <td className="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">{(data.velocity || 0).toFixed(3)}</td>
              <td className="px-4 py-3 text-sm">
                <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-mono">
                  {data.cks}
                </code>
              </td>
            </tr>
          ))}
      </tbody>
    </table>
  </div>

  {/* Texto informativo */}
  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-blue-200 dark:border-blue-800">
    <div className="flex items-start gap-2">
      <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-900 dark:text-blue-200">
        Los datos se actualizan automáticamente y pueden exportarse para análisis posterior.
        El checksum sirve como identificador único para detectar duplicados y pérdidas de paquetes.
      </p>
    </div>
  </div>
</div>


      {/* Panel de Markers Detectados */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <Radio className="w-6 h-6 text-uvg-green-dark" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Markers Detectados
          </h3>
          <span className="px-3 py-1 bg-uvg-green-light/20 text-uvg-green-dark dark:text-uvg-green-light rounded-full text-sm font-medium">
            {activeMarkers.length} activos
          </span>
        </div>

        {activeMarkers.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No hay markers detectados</p>
            <p className="text-sm">Los markers aparecerán automáticamente al recibir datos</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activeMarkers.map(markerId => (
              <div
                key={markerId}
                className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg hover:border-uvg-green-light transition-colors duration-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {markerId}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {markerData[markerId]?.data.length || 0} ptos
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleMarkerVisibility(markerId, 'xy')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                      markerVisibility[markerId]?.xy
                        ? 'bg-uvg-green-dark text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {markerVisibility[markerId]?.xy ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    XY
                  </button>
                  <button
                    onClick={() => toggleMarkerVisibility(markerId, 'traj3d')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                      markerVisibility[markerId]?.traj3d
                        ? 'bg-uvg-green-dark text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {markerVisibility[markerId]?.traj3d ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    3D
                  </button>
                  <button
                    onClick={() => toggleMarkerVisibility(markerId, 'velocity')}
                    className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors duration-200 ${
                      markerVisibility[markerId]?.velocity
                        ? 'bg-uvg-green-dark text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {markerVisibility[markerId]?.velocity ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    Vel
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ============================================================ */}
{/* Métricas de Calidad y Estadísticas Generales */}
{/* ============================================================ */}
<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
  {/* Métricas de Calidad */}
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
    <div className="flex items-center gap-3 mb-4">
      <BarChart3 className="w-6 h-6 text-uvg-green-dark" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Métricas de Calidad
      </h3>
    </div>
    <div className="space-y-4">
      {/* Integridad */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Integridad de Transmisión</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {packetStats.integrityPercent.toFixed(2)}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-300"
            style={{ width: `${packetStats.integrityPercent}%` }}
          />
        </div>
      </div>

      {/* Duplicados */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de Duplicación</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {packetStats.duplicateRate.toFixed(3)}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 to-yellow-600 transition-all duration-300"
            style={{ width: `${Math.min(packetStats.duplicateRate * 20, 100)}%` }}
          />
        </div>
      </div>

      {/* Pérdida */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Tasa de Pérdida Estimada</span>
          <span className="text-sm font-bold text-gray-900 dark:text-white">
            {packetStats.lossRate.toFixed(3)}%
          </span>
        </div>
        <div className="w-full h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-500 to-red-600 transition-all duration-300"
            style={{ width: `${Math.min(packetStats.lossRate * 10, 100)}%` }}
          />
        </div>
      </div>
    </div>
  </div>

  {/* Estadísticas Generales */}
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
    <div className="flex items-center gap-3 mb-4">
      <Activity className="w-6 h-6 text-uvg-green-dark" />
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Estadísticas Generales
      </h3>
    </div>
    <div className="grid grid-cols-2 gap-4">
      <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Paquetes</p>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{packetStats.total}</p>
      </div>
      <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <p className="text-xs text-green-600 dark:text-green-400 mb-1">Válidos</p>
        <p className="text-2xl font-bold text-green-700 dark:text-green-300">{packetStats.valid}</p>
      </div>
      <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <p className="text-xs text-red-600 dark:text-red-400 mb-1">Corruptos</p>
        <p className="text-2xl font-bold text-red-700 dark:text-red-300">{packetStats.corrupted}</p>
      </div>
      <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <p className="text-xs text-yellow-600 dark:text-yellow-400 mb-1">Duplicados</p>
        <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">{packetStats.duplicates}</p>
      </div>
    </div>
  </div>
</div>


      {/* Contenedor de Figuras */}
      <div className="space-y-6">
        {activeMarkers.map(markerId => (
          <div key={markerId} className="space-y-4">
            {/* Figura XY */}
            {markerVisibility[markerId]?.xy && (
              <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                figureStates[`${markerId}-xy`]?.maximized ? 'col-span-2' : ''
              }`}>
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <LineChart className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {markerId} — Trayectoria XY
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFigureMaximize(`${markerId}-xy`)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                    >
                      {figureStates[`${markerId}-xy`]?.maximized ? (
                        <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                    <button
                      onClick={() => closeFigure(markerId, 'xy')}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <canvas
                    ref={el => canvasRefs.current[`${markerId}-xy`] = el}
                    width={500}
                    height={400}
                    className="w-full h-auto bg-gray-50 dark:bg-gray-900 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Últimos {markerData[markerId]?.data.length || 0} puntos | Actualización: 200ms
                  </p>
                </div>
              </div>
            )}

            {/* Figura 3D */}
            {markerVisibility[markerId]?.traj3d && (
              <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                figureStates[`${markerId}-3d`]?.maximized ? 'col-span-2' : ''
              }`}>
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <Box className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {markerId} — Trayectoria 3D
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFigureMaximize(`${markerId}-3d`)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                    >
                      {figureStates[`${markerId}-3d`]?.maximized ? (
                        <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                    <button
                      onClick={() => closeFigure(markerId, 'traj3d')}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <canvas
                    ref={el => canvasRefs.current[`${markerId}-3d`] = el}
                    width={500}
                    height={400}
                    className="w-full h-auto bg-gray-50 dark:bg-gray-900 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Últimos {markerData[markerId]?.trajectory.length || 0} puntos | Color/tamaño: altura Z
                  </p>
                </div>
              </div>
            )}

            {/* Figura Velocidad */}
            {markerVisibility[markerId]?.velocity && (
              <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
                figureStates[`${markerId}-velocity`]?.maximized ? 'col-span-2' : ''
              }`}>
                <div className="bg-gray-100 dark:bg-gray-700 px-4 py-2 flex items-center justify-between border-b border-gray-200 dark:border-gray-600">
                  <div className="flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {markerId} — Velocidad
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleFigureMaximize(`${markerId}-velocity`)}
                      className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors duration-200"
                    >
                      {figureStates[`${markerId}-velocity`]?.maximized ? (
                        <Minimize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      ) : (
                        <Maximize2 className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                      )}
                    </button>
                    <button
                      onClick={() => closeFigure(markerId, 'velocity')}
                      className="p-1 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
                    >
                      <X className="w-4 h-4 text-gray-600 dark:text-gray-300 hover:text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <canvas
                    ref={el => canvasRefs.current[`${markerId}-velocity`] = el}
                    width={500}
                    height={300}
                    className="w-full h-auto bg-gray-50 dark:bg-gray-900 rounded-lg"
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                    Últimos 50 puntos | Velocidad instantánea en m/s
                  </p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Info adicional */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <div className="flex items-start gap-2">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-900 dark:text-blue-200">
            <p className="font-semibold mb-1">Sistema de visualización multi-marker</p>
            <p>
              Los markers se detectan automáticamente al recibir datos por MQTT.
              Puedes mostrar/ocultar gráficas individuales para cada marker usando los botones en el panel de control.
              Las figuras se actualizan en tiempo real cada 200ms.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
