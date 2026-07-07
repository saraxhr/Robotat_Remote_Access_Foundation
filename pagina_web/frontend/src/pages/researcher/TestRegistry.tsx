// ======================================================================================
// Archivo: TestRegistry.tsx
// Descripción general:
// --------------------------------------------------------------------------------------
// Este componente React gestiona la pestaña **"Registro de Pruebas"** dentro del sistema
// Robotat. Su objetivo es ofrecer a los investigadores y administradores un espacio para
// registrar, consultar y organizar los experimentos realizados en el laboratorio.
//
// Funcionalidades principales:
//   • Visualización de registros experimentales con detalles de robot, fecha y responsable.
//   • Filtros por estado, fecha y texto (nombre, investigador u objetivo).
//   • Creación de nuevos registros mediante un formulario modal con validaciones básicas.
//   • Indicadores de estado del experimento (Completado, En progreso, Planificado).
//   • Vinculación a conjuntos de datos y publicaciones académicas (DOI).
//   • Estadísticas globales de registros (totales, completados, en progreso, publicados).
//   • Botones de acción por registro: Ver, Editar y Descargar datos.

//
// Autora: Sara Hernández  
// Colaborador: ChatGPT
// ======================================================================================


import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  Calendar,
  Bot,
  Camera,
  FileText,
  Edit3,
  Trash2,
  Eye,
  Link as LinkIcon,
  Download,
  CheckCircle,
  Clock,
  User,
  Target,
  X,
  Save,
  AlertCircle
} from 'lucide-react';

interface TestRecord {
  id: string;
  name: string;
  date: string;
  robot: string;
  researcher: string;
  objective: string;
  observations: string;
  status: 'completed' | 'in_progress' | 'planned';
  linkedData?: string;
  isPublished: boolean;
  publicationLink?: string;
}

interface NewRecord {
  name: string;
  robot: string;
  objective: string;
  observations: string;
}

export function TestRegistry() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDate, setFilterDate] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<string | null>(null);
  const [newRecord, setNewRecord] = useState<NewRecord>({
    name: '',
    robot: '',
    objective: '',
    observations: ''
  });

  const testRecords: TestRecord[] = [
    {
      id: '1',
      name: 'Navegación Autónoma con Obstáculos Dinámicos',
      date: '2025-01-15',
      robot: 'Robot Pololu #1',
      researcher: 'Dr. Roberto Martínez',
      objective: 'Evaluar algoritmos de path planning en entornos con obstáculos móviles',
      observations: 'El robot mostró excelente adaptabilidad. Se observaron mejoras del 23% en tiempo de navegación comparado con algoritmos estáticos.',
      status: 'completed',
      linkedData: 'dataset_nav_001.json',
      isPublished: true,
      publicationLink: 'https://doi.org/10.1234/robotics.2024.001'
    },
    {
      id: '2',
      name: 'Control de Fuerza en Manipulación Delicada',
      date: '2025-01-14',
      robot: 'MaxArm Robot',
      researcher: 'Dr. Ana Herrera',
      objective: 'Desarrollar algoritmos de control de fuerza para manipulación de objetos frágiles',
      observations: 'Resultados prometedores en control de fuerza. Necesita ajuste fino en sensores de contacto.',
      status: 'completed',
      linkedData: 'dataset_force_002.mat',
      isPublished: false
    },
    {
      id: '3',
      name: 'Calibración Multi-Robot Distribuida',
      date: '2025-01-13',
      robot: 'Robot Pololu #1, #2',
      researcher: 'Dr. Roberto Martínez',
      objective: 'Implementar sistema de calibración automática entre múltiples robots',
      observations: 'Experimento en progreso. Fase 1 completada con resultados satisfactorios.',
      status: 'in_progress',
      isPublished: false
    },
    {
      id: '4',
      name: 'Seguimiento Visual Multi-Cámara',
      date: '2025-01-16',
      robot: 'Cámaras PTZ #1-4',
      researcher: 'Dr. Ana Herrera',
      objective: 'Desarrollar sistema de seguimiento de objetos con múltiples cámaras PTZ',
      observations: '',
      status: 'planned',
      isPublished: false
    }
  ];

  const filteredRecords = testRecords.filter(record => {
    const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.researcher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         record.objective.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || record.status === filterStatus;
    const matchesDate = !filterDate || record.date === filterDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Aquí iría la lógica para crear el registro
    console.log('Creando registro:', newRecord);
    setNewRecord({ name: '', robot: '', objective: '', observations: '' });
    setShowCreateForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'planned': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'planned': return <Calendar className="w-4 h-4 text-blue-500" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Registro de Pruebas
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Bitácora digital de experimentos y observaciones
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center gap-2 bg-uvg-yellow text-uvg-green-dark px-4 py-2 rounded-lg hover:bg-uvg-yellow/90 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Nuevo Registro
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">24</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Registros Totales</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">18</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Completados</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">4</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Progreso</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <LinkIcon className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">6</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Publicados</p>
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
              placeholder="Buscar registros..."
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
              <option value="completed">Completados</option>
              <option value="in_progress">En Progreso</option>
              <option value="planned">Planificados</option>
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

      {/* Records List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Registros de Experimentos
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredRecords.map((record) => (
            <div key={record.id} className="p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(record.status)}
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {record.name}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(record.status)}`}>
                      {record.status === 'completed' ? 'Completado' :
                       record.status === 'in_progress' ? 'En Progreso' : 'Planificado'}
                    </span>
                    {record.isPublished && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 rounded-full text-xs font-medium">
                        Publicado
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-uvg-green-dark" />
                      <span className="text-gray-600 dark:text-gray-400">{record.robot}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-uvg-green-dark" />
                      <span className="text-gray-600 dark:text-gray-400">{record.date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-uvg-green-dark" />
                      <span className="text-gray-600 dark:text-gray-400">{record.researcher}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Objetivo:</span>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{record.objective}</p>
                    </div>
                    {record.observations && (
                      <div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones:</span>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{record.observations}</p>
                      </div>
                    )}
                  </div>

                  {record.linkedData && (
                    <div className="mt-3 p-3 bg-uvg-green-light/10 rounded-lg">
                      <div className="flex items-center gap-2">
                        <LinkIcon className="w-4 h-4 text-uvg-green-dark" />
                        <span className="text-sm font-medium text-uvg-green-dark dark:text-uvg-green-light">
                          Datos vinculados: {record.linkedData}
                        </span>
                      </div>
                    </div>
                  )}

                  {record.isPublished && record.publicationLink && (
                    <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-purple-600" />
                        <a 
                          href={record.publicationLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:underline"
                        >
                          Ver publicación académica
                        </a>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 ml-4">
                  <button
                    onClick={() => setSelectedRecord(record.id)}
                    className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    <Eye className="w-4 h-4" />
                    Ver
                  </button>
                  <button className="inline-flex items-center gap-2 bg-uvg-yellow/10 text-uvg-green-dark px-3 py-2 rounded-lg hover:bg-uvg-yellow/20 transition-colors duration-200">
                    <Edit3 className="w-4 h-4" />
                    Editar
                  </button>
                  {record.linkedData && (
                    <button className="inline-flex items-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors duration-200">
                      <Download className="w-4 h-4" />
                      Datos
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Create Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Nuevo Registro de Prueba
                </h3>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Nombre del Experimento *
                  </label>
                  <input
                    type="text"
                    value={newRecord.name}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ej: Navegación con obstáculos dinámicos"
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Robot/Cámara Utilizada *
                  </label>
                  <select
                    value={newRecord.robot}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, robot: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar dispositivo</option>
                    <option value="Robot Pololu #1">Robot Pololu #1</option>
                    <option value="Robot Pololu #2">Robot Pololu #2</option>
                    <option value="MaxArm Robot">MaxArm Robot</option>
                    <option value="Cámaras PTZ #1-4">Cámaras PTZ #1-4</option>
                    <option value="Sistema Completo">Sistema Completo</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Objetivo del Experimento *
                  </label>
                  <textarea
                    value={newRecord.objective}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, objective: e.target.value }))}
                    placeholder="Describe el objetivo principal del experimento..."
                    rows={3}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Observaciones Iniciales
                  </label>
                  <textarea
                    value={newRecord.observations}
                    onChange={(e) => setNewRecord(prev => ({ ...prev, observations: e.target.value }))}
                    placeholder="Observaciones, hipótesis o notas iniciales..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-3 bg-uvg-yellow text-uvg-green-dark rounded-lg hover:bg-uvg-yellow/90 transition-colors duration-200 font-medium"
                  >
                    <Save className="w-4 h-4 mr-2 inline" />
                    Crear Registro
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}