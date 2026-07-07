// ============================================================================
// Archivo: CameraMonitoring.tsx
// Descripción: Página de monitoreo de cámaras IP con integración MJPEG (Flask)
//              y control PTZ (Pan-Tilt-Zoom) conectado al backend Django.
//              Permite visualizar múltiples cámaras, grabar clips simulados
//              y acceder a controles individuales o pantalla completa.
// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Maximize,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Settings,
  Circle as Record,
  Square,
  Play,
  Pause,
  Download,
  Save,
} from 'lucide-react';

// ================================================
// Interfaz del objeto de cámara
// ================================================
interface CameraData {
  id: string;
  name: string;
  location: string;
  status: 'online' | 'offline' | 'recording';
  isRecording: boolean;
  recordingDuration: number;
  enabled: boolean;
}

// ================================================
// URLs base del backend Django y microservidor Flask
// ================================================
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000';
const FLASK_BASE = import.meta.env.VITE_FLASK_BASE || 'http://localhost:5000';

// ================================================
// Componente principal
// ================================================
export function CameraMonitoring() {
  const [cameras, setCameras] = useState<CameraData[]>([
    { id: '1', name: 'Cámara PTZ #1', location: 'Esquina NO', status: 'offline', isRecording: false, recordingDuration: 0, enabled: true },
    { id: '2', name: 'Cámara PTZ #2', location: 'Esquina NE', status: 'offline', isRecording: false, recordingDuration: 0, enabled: true },
    { id: '3', name: 'Cámara PTZ #3', location: 'Esquina SO', status: 'offline', isRecording: false, recordingDuration: 0, enabled: false },
    { id: '4', name: 'Cámara PTZ #4', location: 'Esquina SE', status: 'offline', isRecording: false, recordingDuration: 0, enabled: false },
    { id: '5', name: 'Cámara Cenital', location: 'Techo Central', status: 'offline', isRecording: false, recordingDuration: 0, enabled: false },
    { id: '6', name: 'Cámara PTZ #5', location: 'Centro', status: 'offline', isRecording: false, recordingDuration: 0, enabled: false },
  ]);

  const [fullscreenCamera, setFullscreenCamera] = useState<string | null>(null);

  // --------------------------------------------
  // Consultar estado online/offline de cámaras
  // --------------------------------------------
  const checkCameraStatus = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/cameras/${id}/status/`);
      const data = await res.json();
      const newStatus: 'online' | 'offline' = data?.online ? 'online' : 'offline';
      setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, status: newStatus } : c)));
    } catch {
      setCameras((prev) => prev.map((c) => (c.id === id ? { ...c, status: 'offline' } : c)));
    }
  };

  useEffect(() => {
    cameras.filter((c) => c.enabled).forEach((c) => checkCameraStatus(c.id));
    const iv = setInterval(() => {
      cameras.filter((c) => c.enabled).forEach((c) => checkCameraStatus(c.id));
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  // --------------------------------------------
  // Enviar comando PTZ
  // --------------------------------------------
  const sendPTZ = async (cameraId: string, cmd: 'up' | 'down' | 'left' | 'right' | 'home', speed = 4) => {
    try {
      await fetch(`${API_BASE}/api/cameras/${cameraId}/ptz/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cmd, speed }),
      });
    } catch (e) {
      console.error(`[PTZ] Error enviando comando ${cmd} a cámara ${cameraId}`, e);
    }
  };

  const handleCameraMove = (cameraId: string, direction: string) => {
    const cam = cameras.find((c) => c.id === cameraId);
    if (!cam || !cam.enabled) return;

    const map: Record<string, 'up' | 'down' | 'left' | 'right' | 'home'> = {
      up: 'up',
      down: 'down',
      left: 'left',
      right: 'right',
      center: 'home',
      reset: 'home',
    };

    const cmd = map[direction];
    if (cmd) sendPTZ(cameraId, cmd, 4);
  };

  // --------------------------------------------
  // Zoom (placeholder)
  // --------------------------------------------
  const handleZoom = (cameraId: string, zoomType: 'in' | 'out') => {
    console.log(`Zoom ${zoomType} solicitado para cámara ${cameraId} (placeholder)`);
  };

  // --------------------------------------------
  // Grabación simulada (solo en UI)
  // --------------------------------------------
  const toggleRecording = (cameraId: string) => {
    setCameras((prev) =>
      prev.map((cam) => {
        if (cam.id !== cameraId) return cam;
        const next = !cam.isRecording;
        return {
          ...cam,
          isRecording: next,
          recordingDuration: next ? 0 : cam.recordingDuration,
        };
      }),
    );
  };

  const saveRecording = (cameraId: string) => {
    const cam = cameras.find((c) => c.id === cameraId);
    if (!cam || !cam.isRecording) return;

    const blob = new Blob(['Video recording data'], { type: 'video/mp4' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cam.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toggleRecording(cameraId);
  };

  const formatRecordingTime = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${m.toString().padStart(2, '0')}:${r.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    const id = setInterval(() => {
      setCameras((prev) => prev.map((c) => (c.isRecording ? { ...c, recordingDuration: c.recordingDuration + 1 } : c)));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // ================================================
// Subcomponentes: CameraFeed y CameraControls
// ================================================
const CameraFeed = ({ camera, isFullscreen = false }: { camera: CameraData; isFullscreen?: boolean }) => {
  // URL directa al flujo MJPEG del servidor Flask
  const streamUrl = `${FLASK_BASE}/camera/${camera.id}`;

  return (
    <div className={`bg-gray-900 rounded-lg overflow-hidden relative ${isFullscreen ? 'h-full' : 'aspect-video'}`}>
      <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
        {/* Estado EN VIVO / DESCONECTADA */}
        <div className="absolute top-3 left-3 flex items-center gap-2 z-10">
          <div
            className={`w-2 h-2 rounded-full ${
              camera.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-red-500'
            }`}
          />
          <span className="text-white text-xs font-medium">
            {camera.status === 'online' ? 'EN VIVO' : 'DESCONECTADA'}
          </span>
        </div>

        {/* Indicador de grabación */}
        {camera.isRecording && (
          <div className="absolute top-3 right-3 flex items-center gap-1 bg-red-600 px-2 py-1 rounded text-xs text-white z-10">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            {`REC ${formatRecordingTime(camera.recordingDuration)}`}
          </div>
        )}

        {/* Video o placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          {camera.enabled && camera.status === 'online' ? (
            <img
              src={streamUrl}
              alt={`Cámara ${camera.name}`}
              className="w-full h-full object-cover"
              style={{ display: 'block' }}
              draggable={false}
            />
          ) : (
            <div className="text-center text-white/60">
              <Camera className="w-8 h-8 mx-auto mb-2" />
              <p className="text-sm">{camera.enabled ? 'Sin señal' : 'Cámara no conectada'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};





  const CameraControls = ({ camera }: { camera: CameraData }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-gray-900 dark:text-white">{camera.name}</h4>
        <div className="flex gap-2">
          <button
            onClick={() => toggleRecording(camera.id)}
            disabled={!camera.enabled || camera.status !== 'online'}
            className={`p-2 rounded-lg transition-colors duration-200 ${
              camera.isRecording
                ? 'bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400'
                : 'bg-green-100 text-green-600 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {camera.isRecording ? <Square className="w-4 h-4" /> : <Record className="w-4 h-4" />}
          </button>

          {camera.isRecording && (
            <button
              onClick={() => saveRecording(camera.id)}
              className="p-2 bg-uvg-yellow/20 text-uvg-green-dark hover:bg-uvg-yellow/30 rounded-lg transition-colors duration-200"
              title="Guardar Grabación"
            >
              <Save className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={() => setFullscreenCamera(camera.id)}
            className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 rounded-lg transition-colors duration-200"
          >
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>

      {camera.isRecording && (
        <div className="px-4 pb-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-red-600 dark:text-red-400 font-medium">
              {`● Grabando: ${formatRecordingTime(camera.recordingDuration)}`}
            </span>
            <button
              onClick={() => saveRecording(camera.id)}
              className="inline-flex items-center gap-1 text-uvg-green-dark hover:text-uvg-green-light transition-colors duration-200"
            >
              <Download className="w-3 h-3" />
              Guardar
            </button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Control PTZ</p>
          <div className="grid grid-cols-3 gap-1 max-w-24 mx-auto">
            <div />
            <button
              onClick={() => handleCameraMove(camera.id, 'up')}
              disabled={!camera.enabled || camera.status !== 'online'}
              className="p-2 bg-uvg-green-light/10 hover:bg-uvg-green-light/20 disabled:opacity-50 text-uvg-green-dark rounded transition-colors duration-200"
            >
              <ArrowUp className="w-3 h-3" />
            </button>
            <div />
            <button
              onClick={() => handleCameraMove(camera.id, 'left')}
              disabled={!camera.enabled || camera.status !== 'online'}
              className="p-2 bg-uvg-green-light/10 hover:bg-uvg-green-light/20 disabled:opacity-50 text-uvg-green-dark rounded transition-colors duration-200"
            >
              <ArrowLeft className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleCameraMove(camera.id, 'center')}
              disabled={!camera.enabled || camera.status !== 'online'}
              className="p-2 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-600 rounded transition-colors duration-200"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
            <button
              onClick={() => handleCameraMove(camera.id, 'right')}
              disabled={!camera.enabled || camera.status !== 'online'}
              className="p-2 bg-uvg-green-light/10 hover:bg-uvg-green-light/20 disabled:opacity-50 text-uvg-green-dark rounded transition-colors duration-200"
            >
              <ArrowRight className="w-3 h-3" />
            </button>
            <div />
            <button
              onClick={() => handleCameraMove(camera.id, 'down')}
              disabled={!camera.enabled || camera.status !== 'online'}
              className="p-2 bg-uvg-green-light/10 hover:bg-uvg-green-light/20 disabled:opacity-50 text-uvg-green-dark rounded transition-colors duration-200"
            >
              <ArrowDown className="w-3 h-3" />
            </button>
            <div />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => handleZoom(camera.id, 'out')}
            disabled={!camera.enabled || camera.status !== 'online'}
            className="flex-1 p-2 bg-uvg-yellow/10 hover:bg-uvg-yellow/20 disabled:opacity-50 text-uvg-green-dark rounded transition-colors duration-200 flex items-center justify-center"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={() => handleZoom(camera.id, 'in')}
            disabled={!camera.enabled || camera.status !== 'online'}
            className="flex-1 p-2 bg-uvg-yellow/10 hover:bg-uvg-yellow/20 disabled:opacity-50 text-uvg-green-dark rounded transition-colors duration-200 flex items-center justify-center"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );

  // ================================================
  // Render principal
  // ================================================
  const currentFullscreen = cameras.find((c) => c.id === fullscreenCamera) || null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Monitoreo de Cámaras</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Control en tiempo real de las 6 cámaras del laboratorio
          </p>
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200">
            <Play className="w-4 h-4" />
            Iniciar Todas
          </button>
          <button className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
            <Pause className="w-4 h-4" />
            Pausar Todas
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {cameras.map((camera) => (
          <div key={camera.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
            <div className="p-4">
              <CameraFeed camera={camera} />
            </div>
            <CameraControls camera={camera} />
          </div>
        ))}
      </div>

      {fullscreenCamera && currentFullscreen && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="w-full h-full max-w-6xl max-h-full flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-semibold">{currentFullscreen.name}</h3>
              <button
                onClick={() => setFullscreenCamera(null)}
                className="text-white hover:text-gray-300 p-2"
              >
                <Settings className="w-6 h-6" />
              </button>
            </div>

            <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="lg:col-span-3">
                <CameraFeed camera={currentFullscreen} isFullscreen />
              </div>
              <div className="lg:col-span-1">
                <CameraControls camera={currentFullscreen} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
