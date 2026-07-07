// ======================================================================================
// Archivo: StudentResults.tsx
// Descripción general:
// --------------------------------------------------------------------------------------
// Este componente React muestra los resultados experimentales del estudiante dentro del
// sistema Robotat. Su propósito es ofrecer un panel visual e interactivo donde se pueden
// consultar, filtrar y descargar los datos obtenidos en sesiones de práctica con los robots.
//
// Funcionalidades principales:
//   • Visualización de experimentos con métricas de desempeño (tasa de éxito, error, convergencia).
//   • Filtrado por nombre, robot y estado del experimento (exitoso, parcial o fallido).
//   • Descarga de resultados en formatos CSV, JSON o PDF para análisis posterior.
//   • Vista previa modal con secciones para gráficas (trayectoria, velocidad, error) y una
//     tabla con muestras de datos.
//   • Resumen estadístico general (tiempo total, promedio de éxito, cantidad de marcadores).
//
// En conjunto, este módulo permite que los estudiantes consulten su historial experimental,
// exporten los datos para análisis y revisen la evolución de sus resultados dentro del
// entorno del laboratorio Robotat.


// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ======================================================================================


import React, { useState } from 'react';
import { 
  Download, 
  Search, 
  Filter, 
  Calendar,
  FileText,
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye,
  LineChart,
  Activity,
  Target,
  Zap
} from 'lucide-react';

interface ExperimentResult {
  id: string;
  name: string;
  date: string;
  robot: string;
  duration: string;
  status: 'success' | 'partial' | 'failed';
  successRate: number;
  finalError: number;
  convergenceTime: string;
  dataSize: string;
  bookmarks: number;
}

interface SessionData {
  positions: Array<{ time: number; x: number; y: number; theta: number }>;
  velocities: Array<{ time: number; linear: number; angular: number }>;
  errors: Array<{ time: number; error: number }>;
}

export function StudentResults() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const experiments: ExperimentResult[] = [
    {
      id: '1',
      name: 'Navegación Básica - Línea Recta',
      date: '2025-01-15',
      robot: 'Robot Pololu #1',
      duration: '12min',
      status: 'success',
      successRate: 95,
      finalError: 0.02,
      convergenceTime: '8.5s',
      dataSize: '2.3 MB',
      bookmarks: 3
    },
    {
      id: '2',
      name: 'Evitación de Obstáculos',
      date: '2025-01-14',
      robot: 'Robot Pololu #1',
      duration: '18min',
      status: 'partial',
      successRate: 78,
      finalError: 0.15,
      convergenceTime: '12.3s',
      dataSize: '3.1 MB',
      bookmarks: 5
    },
    {
      id: '3',
      name: 'Seguimiento de Trayectoria',
      date: '2025-01-13',
      robot: 'MaxArm Robot',
      duration: '25min',
      status: 'success',
      successRate: 92,
      finalError: 0.05,
      convergenceTime: '6.2s',
      dataSize: '4.7 MB',
      bookmarks: 7
    },
    {
      id: '4',
      name: 'Control de Velocidad',
      date: '2025-01-12',
      robot: 'Robot Pololu #2',
      duration: '15min',
      status: 'failed',
      successRate: 45,
      finalError: 0.35,
      convergenceTime: 'N/A',
      dataSize: '1.8 MB',
      bookmarks: 2
    },
    {
      id: '5',
      name: 'Manipulación de Objetos',
      date: '2025-01-11',
      robot: 'MaxArm Robot',
      duration: '22min',
      status: 'success',
      successRate: 88,
      finalError: 0.08,
      convergenceTime: '9.1s',
      dataSize: '3.9 MB',
      bookmarks: 4
    }
  ];

  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.robot.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || exp.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'partial': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'partial': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleDownload = (experimentId: string, format: string) => {
    const experiment = experiments.find(e => e.id === experimentId);
    if (!experiment) return;

    let content = '';
    let mimeType = '';
    let extension = '';

    switch (format) {
      case 'CSV':
        content = `Timestamp,X,Y,Theta,Linear_Vel,Angular_Vel,Error\n${
          Array.from({ length: 100 }, (_, i) => 
            `${i * 0.1},${(Math.sin(i * 0.1) * 2).toFixed(3)},${(Math.cos(i * 0.1) * 2).toFixed(3)},${(i * 0.05).toFixed(3)},${(0.5 + Math.random() * 0.2).toFixed(3)},${(Math.random() * 0.1 - 0.05).toFixed(3)},${(Math.random() * 0.1).toFixed(3)}`
          ).join('\n')
        }`;
        mimeType = 'text/csv';
        extension = 'csv';
        break;
      case 'JSON':
        content = JSON.stringify({
          experiment: experiment.name,
          robot: experiment.robot,
          date: experiment.date,
          duration: experiment.duration,
          results: {
            successRate: experiment.successRate,
            finalError: experiment.finalError,
            convergenceTime: experiment.convergenceTime
          },
          data: {
            positions: Array.from({ length: 50 }, (_, i) => ({
              time: i * 0.2,
              x: Math.sin(i * 0.1) * 2,
              y: Math.cos(i * 0.1) * 2,
              theta: i * 0.05
            })),
            velocities: Array.from({ length: 50 }, (_, i) => ({
              time: i * 0.2,
              linear: 0.5 + Math.random() * 0.2,
              angular: Math.random() * 0.1 - 0.05
            }))
          }
        }, null, 2);
        mimeType = 'application/json';
        extension = 'json';
        break;
      case 'PDF':
        content = `Reporte de Experimento: ${experiment.name}\nFecha: ${experiment.date}\nRobot: ${experiment.robot}\nDuración: ${experiment.duration}\nTasa de Éxito: ${experiment.successRate}%\nError Final: ${experiment.finalError}\nTiempo de Convergencia: ${experiment.convergenceTime}`;
        mimeType = 'application/pdf';
        extension = 'pdf';
        break;
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${experiment.name.replace(/\s+/g, '_')}_${experiment.date}.${extension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const mockSessionData: SessionData = {
    positions: Array.from({ length: 20 }, (_, i) => ({
      time: i * 0.5,
      x: Math.sin(i * 0.2) * 3,
      y: Math.cos(i * 0.2) * 2,
      theta: i * 0.1
    })),
    velocities: Array.from({ length: 20 }, (_, i) => ({
      time: i * 0.5,
      linear: 0.5 + Math.sin(i * 0.3) * 0.3,
      angular: Math.cos(i * 0.4) * 0.2
    })),
    errors: Array.from({ length: 20 }, (_, i) => ({
      time: i * 0.5,
      error: Math.abs(Math.sin(i * 0.25)) * 0.2
    }))
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Mis Resultados
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Historial y análisis de tus experimentos
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Target className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {experiments.filter(e => e.status === 'success').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Exitosos</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {experiments.reduce((acc, exp) => acc + parseInt(exp.duration), 0)}min
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {Math.round(experiments.reduce((acc, exp) => acc + exp.successRate, 0) / experiments.length)}%
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Promedio Éxito</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Zap className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {experiments.reduce((acc, exp) => acc + exp.bookmarks, 0)}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Marcadores</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar experimentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            >
              <option value="all">Todos los estados</option>
              <option value="success">Exitosos</option>
              <option value="partial">Parciales</option>
              <option value="failed">Fallidos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Experiments List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historial de Experimentos
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredExperiments.map((experiment) => (
            <div key={experiment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(experiment.status)}
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {experiment.name}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(experiment.status)}`}>
                      {experiment.status === 'success' ? 'Exitoso' :
                       experiment.status === 'partial' ? 'Parcial' : 'Fallido'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Robot:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{experiment.robot}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Fecha:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{experiment.date}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Duración:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{experiment.duration}</p>
                    </div>
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Marcadores:</span>
                      <p className="font-medium text-gray-900 dark:text-white">{experiment.bookmarks}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-green-800 dark:text-green-300">Tasa de Éxito</span>
                      </div>
                      <p className="text-lg font-bold text-green-900 dark:text-green-200">{experiment.successRate}%</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Target className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-800 dark:text-blue-300">Error Final</span>
                      </div>
                      <p className="text-lg font-bold text-blue-900 dark:text-blue-200">{experiment.finalError}</p>
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Clock className="w-4 h-4 text-purple-600" />
                        <span className="font-medium text-purple-800 dark:text-purple-300">Convergencia</span>
                      </div>
                      <p className="text-lg font-bold text-purple-900 dark:text-purple-200">{experiment.convergenceTime}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => {
                      setSelectedExperiment(experiment.id);
                      setShowPreview(true);
                    }}
                    className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    Ver Gráficas
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDownload(experiment.id, 'CSV')}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 transition-colors duration-200"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleDownload(experiment.id, 'JSON')}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 transition-colors duration-200"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => handleDownload(experiment.id, 'PDF')}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 transition-colors duration-200"
                    >
                      PDF
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedExperiment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Análisis de Datos - {experiments.find(e => e.id === selectedExperiment)?.name}
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Position Chart */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Trayectoria XY
                  </h4>
                  <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <LineChart className="w-12 h-12 mx-auto mb-2" />
                      <p>Gráfica de trayectoria</p>
                      <p className="text-sm">Coordenadas X-Y del robot</p>
                    </div>
                  </div>
                </div>

                {/* Velocity Chart */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Velocidad vs Tiempo
                  </h4>
                  <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <TrendingUp className="w-12 h-12 mx-auto mb-2" />
                      <p>Gráfica de velocidad</p>
                      <p className="text-sm">Velocidad lineal y angular</p>
                    </div>
                  </div>
                </div>

                {/* Error Chart */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Error vs Tiempo
                  </h4>
                  <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2" />
                      <p>Gráfica de error</p>
                      <p className="text-sm">Error de seguimiento</p>
                    </div>
                  </div>
                </div>

                {/* Data Table */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Muestra de Datos (10 primeras entradas)
                  </h4>
                  <div className="h-64 overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                        <tr>
                          <th className="px-2 py-1 text-left">Tiempo</th>
                          <th className="px-2 py-1 text-left">X</th>
                          <th className="px-2 py-1 text-left">Y</th>
                          <th className="px-2 py-1 text-left">Vel</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {mockSessionData.positions.slice(0, 10).map((pos, i) => (
                          <tr key={i}>
                            <td className="px-2 py-1 text-gray-600 dark:text-gray-400">
                              {pos.time.toFixed(1)}s
                            </td>
                            <td className="px-2 py-1 text-gray-900 dark:text-white">
                              {pos.x.toFixed(3)}
                            </td>
                            <td className="px-2 py-1 text-gray-900 dark:text-white">
                              {pos.y.toFixed(3)}
                            </td>
                            <td className="px-2 py-1 text-gray-900 dark:text-white">
                              {mockSessionData.velocities[i]?.linear.toFixed(3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
