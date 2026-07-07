// ======================================================================================
// Archivo: Experimentation.tsx
// Descripción general:
// --------------------------------------------------------------------------------------
// Este componente React representa la pestaña de **"Experimentación"** destinada a los 
// investigadores dentro del sistema Robotat. Permite la configuración, ejecución y 
// monitoreo de experimentos en tiempo real con los robots del laboratorio.
//
// Funcionalidades principales:
//   • Selección de robots disponibles (Pololu y MaxArm) con indicación de estado.
//   • Configuración personalizada del experimento (nombre, duración y parámetros).
//   • Edición y carga de scripts Python/MATLAB desde la interfaz.
//   • Ejecución y detención de experimentos con temporizador activo.
//   • Registro de eventos en una consola de logs clasificados (info, error, éxito, advertencia).
//   • Exportación de resultados y bitácoras en formato JSON.
//   • Modal interactivo para edición del script con cierre y guardado.
//   • Monitoreo visual con vista de cámara simulada y progreso porcentual.
//
// Autora: Sara Hernández
// Colaborador: ChatGPT  
// ======================================================================================


import React, { useState, useEffect } from 'react'; //  Importa React y hooks que usaremos
import {                                         // Importa solo los íconos que realmente utilizamos
  Play,                                          //    Ícono para botón "Iniciar"
  Square,                                        //    Ícono para botón "Detener"
  Bot,                                           //    Ícono para representar robots
  Upload,                                        //    Ícono para botón "Cargar" script
  Code,                                          //    Ícono para botón "Editar Script"
  Timer,                                         //    Ícono de temporizador
  Activity,                                      //    Ícono genérico para logs (info)
  AlertCircle,                                   //    Ícono para logs de warning/error
  CheckCircle,                                   //    Ícono para logs de éxito
  Camera,                                        //    Ícono para placeholder de cámara
  Save,                                          //    Ícono para botón "Guardar Datos"
  X                                              //    Ícono para cerrar modal
} from 'lucide-react';

// ------------------------------------------------------------
// Definición de tipos/Interfaces
// ------------------------------------------------------------

interface Robot {                                 // ← Tipo para cada robot en la lista
  id: string;                                     // ← ID único del robot
  name: string;                                   // ← Nombre legible
  type: 'pololu' | 'maxarm';                      // ← Tipo de robot
  status: 'available' | 'busy' | 'offline';       // ← Estado actual
  location: string;                               // ← Ubicación física en el lab
}

interface ExperimentConfig {                       // ← Tipo para la configuración del experimento
  name: string;                                   // ← Nombre del experimento
  robot: string;                                  // ← Robot principal (si se usa uno al tiempo)
  duration: number;                               // ← Duración en minutos
  script: string;                                 // ← Código/Script del experimento
  parameters: {                                   // ← Parámetros ajustables
    speed: number;                                //    Velocidad (1–10)
    precision: number;                            //    Precisión (1–10)
    iterations: number;                           //    Iteraciones (1–50)
  };
}

interface LogEntry {                               // ← Tipo para cada entrada en la consola de logs
  timestamp: string;                              // ← Hora del evento (hh:mm:ss)
  type: 'info' | 'warning' | 'error' | 'success'; // ← Tipo de log
  message: string;                                // ← Mensaje descriptivo
}

// ------------------------------------------------------------
// Componente principal: Experimentation
// ------------------------------------------------------------
export function Experimentation() {                // ← Exporta el componente para usarlo en rutas
  const [selectedRobots, setSelectedRobots] = useState<string[]>([]); // ← IDs de robots seleccionados
  const [isExperimentRunning, setIsExperimentRunning] = useState(false); // ← Flag de ejecución
  const [experimentTime, setExperimentTime] = useState(0); // ← Segundos transcurridos
  const [showScriptEditor, setShowScriptEditor] = useState(false); // ← Mostrar/ocultar modal editor

  const [logs, setLogs] = useState<LogEntry[]>([  // ← Estado de logs (inicial con 3 entradas)
    { timestamp: '10:30:15', type: 'info',    message: 'Sistema inicializado correctamente' },
    { timestamp: '10:30:20', type: 'success', message: 'Conexión establecida con Robot Pololu #1' },
    { timestamp: '10:30:25', type: 'info',    message: 'Calibración de sensores completada' }
  ]);

  const [config, setConfig] = useState<ExperimentConfig>({ // ← Configuración del experimento
    name: 'Experimento de Navegación',           // ← Nombre por defecto
    robot: '',                                   // ← Robot específico (si se requiere)
    duration: 30,                                // ← Duración (min)
    script: `# Script de ejemplo para Robot Pololu
# Navegación básica con evitación de obstáculos

def main():
    robot.initialize()
    robot.set_speed(0.3)
    
    for i in range(10):
        if robot.detect_obstacle():
            robot.turn_right(90)
        else:
            robot.move_forward(0.5)
        
        robot.wait(1)
    
    robot.stop()
    return "Experimento completado"`,            // ← Script de ejemplo (Python-like)
    parameters: {                                // ← Parámetros por defecto
      speed: 5,
      precision: 7,
      iterations: 10
    }
  });

  const robots: Robot[] = [                      // ← Lista estática (placeholder) de robots en el lab
    { id: '1', name: 'Robot Pololu #1', type: 'pololu', status: 'available', location: 'Mesa A' },
    { id: '2', name: 'Robot Pololu #2', type: 'pololu', status: 'busy',      location: 'Mesa B' },
    { id: '3', name: 'MaxArm Robot',    type: 'maxarm',  status: 'available', location: 'Mesa C' },
    { id: '4', name: 'Robot Pololu #3', type: 'pololu', status: 'offline',   location: 'Mesa D' }
  ];

  // ------------------------------------------------------------
  // Handlers principales
  // ------------------------------------------------------------

  const handleRobotSelection = (robotId: string) => { // ← Selecciona/deselecciona robot (si disponible)
    setSelectedRobots(prev =>
      prev.includes(robotId)                          // ← ¿Ya está seleccionado?
        ? prev.filter(id => id !== robotId)           // ← Sí: lo quitamos
        : [...prev, robotId]                          // ← No: lo agregamos
    );
  };

  const startExperiment = () => {                     // ← Inicia el experimento
    if (selectedRobots.length === 0) {                // ← Debe haber al menos un robot seleccionado
      addLog('error', 'Debe seleccionar al menos un robot');
      return;
    }
    setIsExperimentRunning(true);                     // ← Pone la bandera de ejecución en true
    setExperimentTime(0);                             // ← Reinicia el timer
    addLog('success', `Experimento iniciado con ${selectedRobots.length} robot(s)`); // ← Log
  };

  const stopExperiment = () => {                      // ← Detiene el experimento manualmente
    setIsExperimentRunning(false);                    // ← Bandera en false
    addLog('info', 'Experimento detenido por el usuario'); // ← Log
  };

  const addLog = (type: LogEntry['type'], message: string) => { // ← Agrega una entrada a logs
    const timestamp = new Date().toLocaleTimeString(); // ← Hora local hh:mm:ss
    setLogs(prev => [...prev, { timestamp, type, message }].slice(-50)); // ← Mantén máx. 50 entradas
  };

  const formatTime = (seconds: number) => {          // ← Formatea segundos a mm:ss
    const mins = Math.floor(seconds / 60);           // ← Calcula minutos
    const secs = seconds % 60;                       // ← Calcula segundos residuales
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`; // ← mm:ss
  };

  const uploadScript = () => {                        // ← Abre un file picker para cargar script al estado
    const input = document.createElement('input');    // ← Crea un input de tipo archivo
    input.type = 'file';                              // ← Define tipo
    input.accept = '.py,.m,.txt';                     // ← Extensiones permitidas
    input.onchange = (e) => {                         // ← Handler al seleccionar archivo
      const file = (e.target as HTMLInputElement).files?.[0]; // ← Toma el primer archivo
      if (file) {                                     // ← Si existe
        const reader = new FileReader();              // ← Crea lector de archivos
        reader.onload = (evt) => {                    // ← Callback al terminar de leer
          setConfig(prev => ({ ...prev, script: evt.target?.result as string })); // ← Guarda en config.script
          addLog('success', `Script cargado: ${file.name}`);                       // ← Log de éxito
        };
        reader.readAsText(file);                      // ← Lee el archivo como texto
      }
    };
    input.click();                                    // ← Dispara el selector de archivos
  };

  const saveExperimentData = () => {                  // ← Exporta la sesión/experimento como JSON
    const data = {                                    // ← Arma el objeto a serializar
      config,
      selectedRobots,
      duration: experimentTime,
      logs,
      timestamp: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); // ← Blob JSON
    const url = URL.createObjectURL(blob);            // ← Crea URL temporal
    const a = document.createElement('a');            // ← Crea <a> para descargar
    a.href = url;                                     // ← Asigna URL
    a.download = `experimento_${config.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`; // ← Nombre
    document.body.appendChild(a);                     // ← Agrega al DOM para poder clickearlo
    a.click();                                        // ← Dispara la descarga
    document.body.removeChild(a);                     // ← Limpia el DOM
    URL.revokeObjectURL(url);                         // ← Libera el objeto URL
  };

  // ------------------------------------------------------------
  // Efecto: manejo del temporizador (1 Hz) mientras corre el experimento
  // ------------------------------------------------------------
  useEffect(() => {                                   // ← Efecto dependiente de isExperimentRunning y duration
    let intervalId: number | undefined;               // ← ID de intervalo (number en navegador)
    if (isExperimentRunning) {                        // ← Solo si está corriendo
      intervalId = window.setInterval(() => {         // ← setInterval cada 1 s
        setExperimentTime(prev => {                   // ← Actualiza contador
          const newTime = prev + 1;                   // ← Incrementa un segundo
          if (newTime % 10 === 0) {                   // ← Cada 10 s, agrega log de progreso
            addLog('info', `Experimento en progreso: ${formatTime(newTime)}`);
          }
          if (newTime >= config.duration * 60) {      // ← Si alcanzó la duración objetivo (min → s)
            setIsExperimentRunning(false);            // ← Detiene experimento
            addLog('success', 'Experimento completado automáticamente'); // ← Log de finalización
          }
          return newTime;                             // ← Devuelve nuevo valor
        });
      }, 1000);                                       // ← Cada 1 segundo
    }
    return () => {                                    // ← Cleanup al desmontar o cambiar dependencias
      if (intervalId !== undefined) {                 // ← Si había intervalo activo
        clearInterval(intervalId);                    // ← Cancela el intervalo
      }
    };
  }, [isExperimentRunning, config.duration]);         // ← Re-ejecuta cuando cambian estas dependencias

  // ------------------------------------------------------------
  // Helpers de UI: colores por estado y selector de íconos de log
  // ------------------------------------------------------------
  const getStatusColor = (status: string) => {        // ← Retorna clases tailwind según estado del robot
    switch (status) {
      case 'available':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'busy':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'offline':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getLogIcon = (type: string) => {              // ← Devuelve el JSX del ícono según el tipo de log
    switch (type) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default:
        return <Activity className="w-4 h-4 text-blue-500" />;
    }
  };

  // ------------------------------------------------------------
  // Render de la interfaz
  // ------------------------------------------------------------
  return (
    <div className="space-y-6"> {/* ← Contenedor maestro con separación vertical */}
      {/* Encabezado principal con título, timer y CTA de inicio/detención */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Experimentación Avanzada {/* ← Título de sección */}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Configura y ejecuta experimentos personalizados {/* ← Subtítulo */}
          </p>
        </div>

        <div className="flex items-center gap-4"> {/* ← Bloque derecho: Timer + Botón */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg shadow">
            <Timer className="w-5 h-5 text-uvg-green-dark" /> {/* ← Ícono del temporizador */}
            <span className="font-mono text-lg text-gray-900 dark:text-white">
              {formatTime(experimentTime)} {/* ← Muestra mm:ss */}
            </span>
          </div>

          {/* Botón condicional: Iniciar o Detener según estado */}
          {!isExperimentRunning ? (
            <button
              onClick={startExperiment}                // ← Handler iniciar
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200"
            >
              <Play className="w-4 h-4" />            {/* ← Ícono Play */}
              Iniciar Experimento
            </button>
          ) : (
            <button
              onClick={stopExperiment}                 // ← Handler detener
              className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200"
            >
              <Square className="w-4 h-4" />           {/* ← Ícono Stop */}
              Detener
            </button>
          )}
        </div>
      </div>

      {/* Grid principal: Selección de robots / Configuración / Monitoreo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tarjeta: Selección de Robots */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Selección de Robots
          </h3>

          <div className="space-y-3">
            {robots.map((robot) => (                 // ← Itera robots disponibles
              <div
                key={robot.id}                       // ← key única para React
                className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  selectedRobots.includes(robot.id)  // ← Si está seleccionado
                    ? 'border-uvg-green-dark bg-uvg-green-light/10'
                    : robot.status === 'available'   // ← Si está disponible
                      ? 'border-gray-200 dark:border-gray-700 hover:border-uvg-green-light'
                      : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed' // ← No seleccionable
                }`}
                onClick={() => robot.status === 'available' && handleRobotSelection(robot.id)} // ← Toggle selección
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot className="w-5 h-5 text-uvg-green-dark" /> {/* ← Ícono robot */}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        {robot.name}                                   {/* ← Nombre robot */}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">
                        {robot.location}                               {/* ← Ubicación */}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(robot.status)}`}>
                    {/* ← Etiqueta de estado legible */}
                    {robot.status === 'available' ? 'Disponible' :
                     robot.status === 'busy'      ? 'Ocupado'    : 'Desconectado'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tarjeta: Configuración del Experimento */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Configuración del Experimento
          </h3>

          <div className="space-y-4">
            {/* Campo: Nombre del experimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nombre del Experimento
              </label>
              <input
                type="text"                               // ← Input de texto
                value={config.name}                       // ← Valor actual
                onChange={(e) => setConfig(prev => ({ ...prev, name: e.target.value }))} // ← Actualiza nombre
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
              />
            </div>

            {/* Campo: Duración (minutos) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Duración (minutos)
              </label>
              <input
                type="number"                             // ← Campo numérico
                min={1}                                   // ← Mínimo 1 minuto
                max={120}                                 // ← Máximo 120 minutos
                value={config.duration}                   // ← Valor actual
                onChange={(e) => setConfig(prev => ({ ...prev, duration: parseInt(e.target.value || '1', 10) }))} // ← Actualiza
                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
              />
            </div>

            {/* Grupo de Parámetros (sliders) */}
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Parámetros
              </label>

              {/* Slider: Velocidad */}
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Velocidad</span>
                  <span className="text-gray-900 dark:text-white">{config.parameters.speed}/10</span>
                </div>
                <input
                  type="range"                             // ← Control tipo slider
                  min={1}                                  // ← Mínimo
                  max={10}                                 // ← Máximo
                  value={config.parameters.speed}          // ← Valor actual
                  onChange={(e) => setConfig(prev => ({    // ← Actualiza estado anidado
                    ...prev,
                    parameters: { ...prev.parameters, speed: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-uvg-green-dark" // ← Color del slider (depende de tu Tailwind config)
                />
              </div>

              {/* Slider: Precisión */}
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Precisión</span>
                  <span className="text-gray-900 dark:text-white">{config.parameters.precision}/10</span>
                </div>
                <input
                  type="range"                             // ← Control tipo slider
                  min={1}                                  // ← Mínimo
                  max={10}                                 // ← Máximo
                  value={config.parameters.precision}      // ← Valor actual
                  onChange={(e) => setConfig(prev => ({    // ← Actualiza estado anidado
                    ...prev,
                    parameters: { ...prev.parameters, precision: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-uvg-green-dark" // ← Estilo slider
                />
              </div>

              {/* Slider: Iteraciones */}
              <div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Iteraciones</span>
                  <span className="text-gray-900 dark:text-white">{config.parameters.iterations}</span>
                </div>
                <input
                  type="range"                             // ← Control tipo slider
                  min={1}                                  // ← Mínimo
                  max={50}                                 // ← Máximo
                  value={config.parameters.iterations}     // ← Valor actual
                  onChange={(e) => setConfig(prev => ({    // ← Actualiza estado anidado
                    ...prev,
                    parameters: { ...prev.parameters, iterations: parseInt(e.target.value, 10) }
                  }))}
                  className="w-full accent-uvg-green-dark" // ← Estilo slider
                />
              </div>
            </div>

            {/* Botones: Editar Script / Cargar Script */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowScriptEditor(true)} // ← Abre modal de editor
                className="flex-1 inline-flex items-center justify-center gap-2 bg-uvg-yellow/10 text-uvg-green-dark px-3 py-2 rounded-lg hover:bg-uvg-yellow/20 transition-colors duration-200"
              >
                <Code className="w-4 h-4" />              {/* ← Ícono código */}
                Editar Script
              </button>
              <button
                onClick={uploadScript}                    // ← Dispara selector de archivo
                className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors duration-200"
              >
                <Upload className="w-4 h-4" />           {/* ← Ícono subir */}
                Cargar
              </button>
            </div>
          </div>
        </div>

        {/* Tarjeta: Monitoreo en Tiempo Real */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Monitoreo en Tiempo Real
          </h3>

          {/* Placeholder de cámara / estado del experimento */}
          <div className="aspect-video bg-gray-900 rounded-lg mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900">
              <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">
                ● EXPERIMENTO {/* ← Etiqueta roja estilo "REC" */}
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center text-white/60">
                  {isExperimentRunning ? (               // ← Contenido según estado
                    <div className="space-y-2">
                      <Bot className="w-8 h-8 mx-auto animate-pulse" />
                      <p className="text-sm">Experimento en curso</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Camera className="w-8 h-8 mx-auto" />
                      <p className="text-sm">Vista de experimento</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Indicadores de estado básicos */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                isExperimentRunning
                  ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                  : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
              }`}>
                {isExperimentRunning ? 'En Ejecución' : 'Detenido'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Robots Activos:</span>
              <span className="text-sm text-gray-900 dark:text-white">{selectedRobots.length}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">Progreso:</span>
              <span className="text-sm text-gray-900 dark:text-white">
                {Math.min(100, Math.round((experimentTime / (config.duration * 60)) * 100))}% {/* ← % con clamp */}
              </span>
            </div>
          </div>

          {/* Botón para guardar datos (solo visible si corre) */}
          {isExperimentRunning && (
            <button
              onClick={saveExperimentData}               // ← Exporta JSON de la sesión
              className="w-full mt-4 inline-flex items-center justify-center gap-2 bg-uvg-yellow text-uvg-green-dark px-4 py-2 rounded-lg hover:bg-uvg-yellow/90 transition-colors duration-200"
            >
              <Save className="w-4 h-4" />               {/* ← Ícono guardar */}
              Guardar Datos
            </button>
          )}
        </div>
      </div>

      {/* Consola de Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Consola de Logs
          </h3>
        </div>
        <div className="h-64 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 font-mono text-sm">
          {logs.map((log, index) => (                 // ← Render de cada log
            <div key={index} className="flex items-start gap-3 mb-2">
              <span className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                {log.timestamp}                        {/* ← Hora */}
              </span>
              {getLogIcon(log.type)}                  {/* ← Ícono por tipo */}
              <span className="text-gray-900 dark:text-white flex-1">
                {log.message}                         {/* ← Mensaje */}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modal de Editor de Script */}
      {showScriptEditor && (                          // ← Render condicional del modal
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              {/* Header del modal */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Editor de Script
                </h3>
                <button
                  onClick={() => setShowScriptEditor(false)} // ← Cierra modal
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                  aria-label="Cerrar editor de script"
                >
                  <X className="w-5 h-5" />                 {/* ← Ícono cerrar */}
                </button>
              </div>

              {/* Área de texto para el script */}
              <textarea
                value={config.script}                       // ← Valor actual del script
                onChange={(e) => setConfig(prev => ({ ...prev, script: e.target.value }))} // ← Actualiza script
                className="w-full h-96 px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent font-mono text-sm"
                placeholder="Escriba su script aquí..."
              />

              {/* Botones del modal */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowScriptEditor(false)} // ← Cierra sin cambios extra
                  className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => setShowScriptEditor(false)} // ← Aquí podrías persistir el script si fuera necesario
                  className="flex-1 px-4 py-2 bg-uvg-yellow text-uvg-green-dark rounded-lg hover:bg-uvg-yellow/90 transition-colors duration-200"
                >
                  Guardar Script
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
