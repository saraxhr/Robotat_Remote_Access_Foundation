// ======================================================================================
// Archivo: DataDownload.tsx
// Descripción general:
// --------------------------------------------------------------------------------------
// Este componente React permite a los usuarios del sistema Robotat acceder y descargar
// los datos experimentales generados en el laboratorio. Presenta una lista de experimentos
// registrados, junto con sus detalles, estado y tipos de datos disponibles para exportar.
//
// Funcionalidades principales:
//   • Búsqueda y filtrado por nombre, robot y fecha del experimento.
//   • Descarga de datos en múltiples formatos (CSV, JSON, MAT, MP4).
//   • Vista previa de información y muestras de datos simulados.
//   • Historial de exportaciones con registro de usuario, fecha y tamaño del archivo.
//   • Indicadores visuales del estado de cada experimento (completado, procesando o error).
//
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
  Video,
  Database,
  BarChart3,
  Eye,
  Bot,
  Camera,
  Clock,
  User,
  TrendingUp,
  LineChart,
  Activity
} from 'lucide-react';

interface Experiment {
  id: string;
  name: string;
  robot: string;
  date: string;
  researcher: string;
  duration: string;
  dataTypes: string[];
  fileSize: string;
  status: 'completed' | 'processing' | 'failed';
  description: string;
}

interface ExportHistory {
  id: string;
  experimentId: string;
  experimentName: string;
  format: string;
  downloadedBy: string;
  downloadDate: string;
  fileSize: string;
}

export function DataDownload() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRobot, setFilterRobot] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [selectedExperiment, setSelectedExperiment] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const experiments: Experiment[] = [
    {
      id: '1',
      name: 'Navegación Autónoma - Obstáculos Dinámicos',
      robot: 'Robot Pololu #1',
      date: '2024-01-15',
      researcher: 'Dr. Roberto Martínez',
      duration: '45min',
      dataTypes: ['Poses', 'Trayectorias', 'Video', 'Logs'],
      fileSize: '2.3 GB',
      status: 'completed',
      description: 'Experimento de navegación con obstáculos móviles usando algoritmos de path planning'
    },
    {
      id: '2',
      name: 'Manipulación de Precisión - Objetos Frágiles',
      robot: 'MaxArm Robot',
      date: '2024-01-14',
      researcher: 'Dr. Ana Herrera',
      duration: '1h 20min',
      dataTypes: ['Poses', 'Fuerzas', 'Video', 'Logs'],
      fileSize: '1.8 GB',
      status: 'completed',
      description: 'Estudio de control de fuerza para manipulación de objetos delicados'
    },
    {
      id: '3',
      name: 'Calibración de Sensores - Múltiples Robots',
      robot: 'Robot Pololu #1, #2',
      date: '2024-01-13',
      researcher: 'Dr. Roberto Martínez',
      duration: '2h 15min',
      dataTypes: ['Sensores', 'Calibración', 'Logs'],
      fileSize: '856 MB',
      status: 'processing',
      description: 'Proceso de calibración cruzada entre múltiples unidades robóticas'
    },
    {
      id: '4',
      name: 'Visión Artificial - Seguimiento de Objetos',
      robot: 'Cámaras PTZ #1-4',
      date: '2024-01-12',
      researcher: 'Dr. Ana Herrera',
      duration: '35min',
      dataTypes: ['Video', 'Tracking', 'Logs'],
      fileSize: '3.1 GB',
      status: 'completed',
      description: 'Algoritmos de seguimiento visual con múltiples cámaras sincronizadas'
    }
  ];

  const exportHistory: ExportHistory[] = [
    {
      id: '1',
      experimentId: '1',
      experimentName: 'Navegación Autónoma - Obstáculos Dinámicos',
      format: 'CSV',
      downloadedBy: 'Dr. Roberto Martínez',
      downloadDate: '2024-01-15 16:30',
      fileSize: '45 MB'
    },
    {
      id: '2',
      experimentId: '2',
      experimentName: 'Manipulación de Precisión - Objetos Frágiles',
      format: 'MAT',
      downloadedBy: 'Dr. Ana Herrera',
      downloadDate: '2024-01-14 18:45',
      fileSize: '120 MB'
    },
    {
      id: '3',
      experimentId: '4',
      experimentName: 'Visión Artificial - Seguimiento de Objetos',
      format: 'MP4',
      downloadedBy: 'Dr. Ana Herrera',
      downloadDate: '2024-01-13 10:20',
      fileSize: '890 MB'
    }
  ];

  const filteredExperiments = experiments.filter(exp => {
    const matchesSearch = exp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         exp.researcher.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRobot = filterRobot === 'all' || exp.robot.toLowerCase().includes(filterRobot.toLowerCase());
    const matchesDate = !filterDate || exp.date === filterDate;
    return matchesSearch && matchesRobot && matchesDate;
  });

  const handleDownload = (experimentId: string, format: string) => {
    const experiment = experiments.find(e => e.id === experimentId);
    if (!experiment) return;

    const blob = new Blob(['Experiment data'], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${experiment.name.replace(/\s+/g, '_')}.${format.toLowerCase()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'processing': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getDataTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'poses': return <Activity className="w-4 h-4" />;
      case 'trayectorias': return <TrendingUp className="w-4 h-4" />;
      case 'video': return <Video className="w-4 h-4" />;
      case 'logs': return <FileText className="w-4 h-4" />;
      case 'sensores': return <BarChart3 className="w-4 h-4" />;
      case 'fuerzas': return <LineChart className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Descarga de Datos Experimentales
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Accede y exporta resultados de tus experimentos
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Experimentos</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Download className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">8.7 GB</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Datos Totales</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">156h</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Tiempo Lab</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">47</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Descargas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <Bot className="w-5 h-5 text-gray-400" />
            <select
              value={filterRobot}
              onChange={(e) => setFilterRobot(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            >
              <option value="all">Todos los robots</option>
              <option value="pololu">Robot Pololu</option>
              <option value="maxarm">MaxArm Robot</option>
              <option value="camera">Cámaras PTZ</option>
            </select>
          </div>
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

      {/* Experiments List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Experimentos Disponibles
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredExperiments.map((experiment) => (
            <div key={experiment.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {experiment.name}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(experiment.status)}`}>
                      {experiment.status === 'completed' ? 'Completado' :
                       experiment.status === 'processing' ? 'Procesando' : 'Error'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    {experiment.description}
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-uvg-green-dark" />
                      <span className="text-gray-600 dark:text-gray-400">{experiment.robot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-uvg-green-dark" />
                      <span className="text-gray-600 dark:text-gray-400">{experiment.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-uvg-green-dark" />
                      <span className="text-gray-600 dark:text-gray-400">{experiment.duration}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-uvg-green-dark" />
                      <span className="text-gray-600 dark:text-gray-400">{experiment.fileSize}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <span className="text-sm text-gray-500 dark:text-gray-400">Tipos de datos:</span>
                    <div className="flex gap-2">
                      {experiment.dataTypes.map((type, index) => (
                        <div key={index} className="flex items-center gap-1 bg-uvg-green-light/10 px-2 py-1 rounded text-xs">
                          {getDataTypeIcon(type)}
                          <span className="text-uvg-green-dark dark:text-uvg-green-light">{type}</span>
                        </div>
                      ))}
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
                    Vista Previa
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleDownload(experiment.id, 'CSV')}
                      disabled={experiment.status !== 'completed'}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => handleDownload(experiment.id, 'JSON')}
                      disabled={experiment.status !== 'completed'}
                      className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      JSON
                    </button>
                    <button
                      onClick={() => handleDownload(experiment.id, 'MAT')}
                      disabled={experiment.status !== 'completed'}
                      className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      MAT
                    </button>
                    <button
                      onClick={() => handleDownload(experiment.id, 'MP4')}
                      disabled={experiment.status !== 'completed'}
                      className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                    >
                      MP4
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export History */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Historial de Exportaciones
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Experimento
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Formato
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Descargado Por
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Fecha
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Tamaño
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {exportHistory.map((entry) => (
                <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                    {entry.experimentName}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-uvg-yellow/20 text-uvg-green-dark">
                      {entry.format}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {entry.downloadedBy}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {entry.downloadDate}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                    {entry.fileSize}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && selectedExperiment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Vista Previa de Datos
                </h3>
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <Eye className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Sample Data Table */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Muestra de Datos de Poses (10 primeras entradas)
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 dark:bg-gray-700">
                        <tr>
                          <th className="px-4 py-2 text-left">Timestamp</th>
                          <th className="px-4 py-2 text-left">X (m)</th>
                          <th className="px-4 py-2 text-left">Y (m)</th>
                          <th className="px-4 py-2 text-left">Θ (rad)</th>
                          <th className="px-4 py-2 text-left">Velocidad</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {Array.from({ length: 10 }, (_, i) => (
                          <tr key={i}>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                              {`00:${(i * 5).toString().padStart(2, '0')}:${(i * 3).toString().padStart(2, '0')}`}
                            </td>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">
                              {(Math.random() * 2 - 1).toFixed(3)}
                            </td>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">
                              {(Math.random() * 2 - 1).toFixed(3)}
                            </td>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">
                              {(Math.random() * Math.PI - Math.PI/2).toFixed(3)}
                            </td>
                            <td className="px-4 py-2 text-gray-900 dark:text-white">
                              {(Math.random() * 0.5).toFixed(3)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Sample Trajectory Chart */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
                    Gráfica de Trayectoria XY
                  </h4>
                  <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                    <div className="text-center text-gray-500 dark:text-gray-400">
                      <LineChart className="w-12 h-12 mx-auto mb-2" />
                      <p>Gráfica de trayectoria simulada</p>
                      <p className="text-sm">Coordenadas X-Y del robot durante el experimento</p>
                    </div>
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