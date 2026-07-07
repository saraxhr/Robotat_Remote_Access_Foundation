// ======================================================================================
// Archivo: StudyMaterials.tsx
// Descripción general:
// --------------------------------------------------------------------------------------
// Este componente React presenta la sección de materiales de estudio para los usuarios
// del sistema Robotat. Proporciona acceso a guías, videos tutoriales y ejemplos de código
// organizados por tipo, categoría, nivel de dificultad y robot asociado.
//
// Funcionalidades principales:
//   • Búsqueda y filtrado dinámico por tipo (guía, video, código) y categoría (Pololu, MaxArm, etc.).
//   • Descarga de documentos PDF y apertura de videos en enlaces externos.
//   • Visualización de ejemplos de código para Python y MATLAB con opción de copia al portapapeles.
//   • Etiquetas de dificultad y lenguaje de programación con colores distintivos.
//   • Interfaz moderna, responsive y coherente con la identidad visual de Robotat.
//
// Autora: Sara Hernández  
// Colaborador: ChatGPT   
// ======================================================================================




import React, { useState } from 'react';
import { 
  BookOpen, 
  Video, 
  Code, 
  Download, 
  ExternalLink,
  Search,
  Filter,
  FileText,
  Play,
  Copy,
  CheckCircle,
  Bot,
  Camera,
  Settings
} from 'lucide-react';

interface StudyMaterial {
  id: string;
  title: string;
  type: 'guide' | 'video' | 'code';
  category: 'pololu' | 'maxarm' | 'general' | 'programming';
  description: string;
  url?: string;
  downloadUrl?: string;
  duration?: string;
  language?: 'python' | 'matlab' | 'general';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface CodeExample {
  id: string;
  title: string;
  language: 'python' | 'matlab';
  description: string;
  code: string;
  robot: 'pololu' | 'maxarm' | 'general';
}

export function StudyMaterials() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const materials: StudyMaterial[] = [
    {
      id: '1',
      title: 'Guía de Inicio Rápido - Robot Pololu',
      type: 'guide',
      category: 'pololu',
      description: 'Introducción completa al uso del Robot Pololu 3pi+, incluyendo configuración inicial y primeros movimientos.',
      downloadUrl: '/guides/pololu_quickstart.pdf',
      difficulty: 'beginner'
    },
    {
      id: '2',
      title: 'Manual Completo - MaxArm Robot',
      type: 'guide',
      category: 'maxarm',
      description: 'Documentación detallada del brazo robótico MaxArm, cinemática directa e inversa y programación de trayectorias.',
      downloadUrl: '/guides/maxarm_manual.pdf',
      difficulty: 'intermediate'
    },
    {
      id: '3',
      title: 'Navegación Autónoma con Pololu',
      type: 'video',
      category: 'pololu',
      description: 'Video demostrativo de algoritmos de navegación autónoma y evitación de obstáculos.',
      url: 'https://example.com/video1',
      duration: '15:30',
      difficulty: 'intermediate'
    },
    {
      id: '4',
      title: 'Programación de Trayectorias - MaxArm',
      type: 'video',
      category: 'maxarm',
      description: 'Tutorial paso a paso para programar movimientos complejos en el brazo robótico.',
      url: 'https://example.com/video2',
      duration: '22:45',
      difficulty: 'advanced'
    },
    {
      id: '5',
      title: 'Configuración del Entorno de Desarrollo',
      type: 'guide',
      category: 'programming',
      description: 'Guía para configurar/descargar librerías de MATLAB y Python útiles para el laboratorio.',
      downloadUrl: '/guides/dev_setup.pdf',
      difficulty: 'beginner'
    },
    {
      id: '6',
      title: 'Introducción a la Plataforma Robotat',
      type: 'video',
      category: 'general',
      description: 'Recorrido completo por la interfaz web y funcionalidades disponibles para estudiantes.',
      url: 'https://example.com/video3',
      duration: '12:15',
      difficulty: 'beginner'
    }
  ];

  const codeExamples: CodeExample[] = [
    {
      id: '1',
      title: 'Movimiento Básico - Pololu',
      language: 'python',
      description: 'Código básico para mover el robot Pololu en línea recta y realizar giros.',
      robot: 'pololu',
      code: `# Movimiento básico del Robot Pololu
import robotat_pololu as robot
import time

def basic_movement():
    # Inicializar robot
    robot.initialize()
    
    # Configurar velocidad
    robot.set_speed(0.3)  # 30% de velocidad máxima
    
    # Mover hacia adelante por 2 segundos
    robot.move_forward()
    time.sleep(2)
    
    # Girar 90 grados a la derecha
    robot.turn_right(90)
    
    # Mover hacia adelante por 1 segundo
    robot.move_forward()
    time.sleep(1)
    
    # Detener robot
    robot.stop()
    
    print("Movimiento completado")

# Ejecutar función
basic_movement()`
    },
    {
      id: '2',
      title: 'Evitación de Obstáculos - Pololu',
      language: 'python',
      description: 'Algoritmo simple de evitación de obstáculos usando sensores de proximidad.',
      robot: 'pololu',
      code: `# Evitación de obstáculos
import robotat_pololu as robot
import time

def obstacle_avoidance():
    robot.initialize()
    robot.set_speed(0.25)
    
    while True:
        # Leer sensores de proximidad
        front_distance = robot.get_front_sensor()
        
        if front_distance > 20:  # Sin obstáculo (>20cm)
            robot.move_forward()
        else:  # Obstáculo detectado
            robot.stop()
            time.sleep(0.5)
            
            # Girar a la derecha
            robot.turn_right(45)
            time.sleep(1)
            
            # Continuar
            robot.move_forward()
        
        time.sleep(0.1)  # Pequeña pausa

# Ejecutar
obstacle_avoidance()`
    },
    {
      id: '3',
      title: 'Control Básico - MaxArm',
      language: 'matlab',
      description: 'Código MATLAB para controlar las articulaciones del brazo MaxArm.',
      robot: 'maxarm',
      code: `% Control básico del MaxArm Robot
function basic_maxarm_control()
    % Inicializar conexión
    maxarm = robotat_maxarm_init();
    
    % Posición inicial (home)
    home_position = [0, 0, 0, 0, 0, 0];  % 6 articulaciones
    maxarm_move_to(maxarm, home_position);
    pause(2);
    
    % Secuencia de movimientos
    positions = [
        [30, 0, 0, 0, 0, 0];     % Mover base
        [30, 45, 0, 0, 0, 0];    % Mover hombro
        [30, 45, -30, 0, 0, 0];  % Mover codo
        [30, 45, -30, 0, 45, 0]; % Mover muñeca
    ];
    
    % Ejecutar movimientos
    for i = 1:size(positions, 1)
        fprintf('Moviendo a posición %d\\n', i);
        maxarm_move_to(maxarm, positions(i, :));
        pause(3);  % Esperar 3 segundos
    end
    
    % Regresar a home
    maxarm_move_to(maxarm, home_position);
    
    % Cerrar conexión
    maxarm_close(maxarm);
    fprintf('Secuencia completada\\n');
end`
    },
    {
      id: '4',
      title: 'Cinemática Inversa - MaxArm',
      language: 'matlab',
      description: 'Implementación de cinemática inversa para posicionamiento cartesiano.',
      robot: 'maxarm',
      code: `% Cinemática inversa para MaxArm
function inverse_kinematics_demo()
    % Inicializar MaxArm
    maxarm = robotat_maxarm_init();
    
    % Definir posiciones cartesianas objetivo (x, y, z)
    target_positions = [
        [0.2, 0.1, 0.15];   % Posición 1
        [0.15, 0.2, 0.12];  % Posición 2
        [0.25, 0.0, 0.18];  % Posición 3
    ];
    
    for i = 1:size(target_positions, 1)
        target = target_positions(i, :);
        fprintf('Moviendo a posición cartesiana: [%.2f, %.2f, %.2f]\\n', ...
                target(1), target(2), target(3));
        
        % Calcular ángulos de articulaciones
        joint_angles = maxarm_inverse_kinematics(target);
        
        if ~isempty(joint_angles)
            % Mover a la posición calculada
            maxarm_move_to(maxarm, joint_angles);
            pause(3);
        else
            fprintf('Posición inalcanzable\\n');
        end
    end
    
    % Cerrar conexión
    maxarm_close(maxarm);
end

function angles = maxarm_inverse_kinematics(target_pos)
    % Implementación simplificada de cinemática inversa
    % En la práctica, esto requiere cálculos más complejos
    x = target_pos(1);
    y = target_pos(2);
    z = target_pos(3);
    
    % Cálculos básicos (simplificados)
    theta1 = atan2(y, x);
    r = sqrt(x^2 + y^2);
    
    % Verificar si la posición es alcanzable
    if r > 0.3 || z > 0.25  % Límites del workspace
        angles = [];
        return;
    end
    
    % Calcular otros ángulos (simplificado)
    theta2 = asin(z / 0.2);
    theta3 = -theta2;
    
    angles = [rad2deg(theta1), rad2deg(theta2), rad2deg(theta3), 0, 0, 0];
end`
    }
  ];

  const filteredMaterials = materials.filter(material => {
    const matchesSearch = material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         material.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || material.type === filterType;
    const matchesCategory = filterCategory === 'all' || material.category === filterCategory;
    return matchesSearch && matchesType && matchesCategory;
  });

  const filteredCodeExamples = codeExamples.filter(example => {
    const matchesSearch = example.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         example.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || example.robot === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const copyToClipboard = (code: string, id: string) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    });
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'guide': return <FileText className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'code': return <Code className="w-5 h-5" />;
      default: return <BookOpen className="w-5 h-5" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'pololu': return <Bot className="w-4 h-4" />;
      case 'maxarm': return <Settings className="w-4 h-4" />;
      case 'general': return <Camera className="w-4 h-4" />;
      default: return <BookOpen className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Material de Apoyo
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Guías, videos y ejemplos de código para tus experimentos
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar materiales..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="guide">Guías</option>
              <option value="video">Videos</option>
              <option value="code">Código</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-gray-400" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            >
              <option value="all">Todas las categorías</option>
              <option value="pololu">Robot Pololu</option>
              <option value="maxarm">MaxArm Robot</option>
              <option value="general">General</option>
              <option value="programming">Programación</option>
            </select>
          </div>
        </div>
      </div>

      {/* Study Materials */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Guías y Videos
          </h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
          {filteredMaterials.map((material) => (
            <div key={material.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow duration-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getTypeIcon(material.type)}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(material.difficulty)}`}>
                    {material.difficulty === 'beginner' ? 'Principiante' :
                     material.difficulty === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {getCategoryIcon(material.category)}
                </div>
              </div>
              
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                {material.title}
              </h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {material.description}
              </p>
              
              {material.duration && (
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <Play className="w-3 h-3" />
                  {material.duration}
                </div>
              )}
              
              <div className="flex gap-2">
                {material.downloadUrl && (
                  <button className="flex-1 inline-flex items-center justify-center gap-2 bg-uvg-yellow/10 text-uvg-green-dark px-3 py-2 rounded-lg hover:bg-uvg-yellow/20 transition-colors duration-200 text-sm">
                    <Download className="w-4 h-4" />
                    Descargar
                  </button>
                )}
                {material.url && (
                  <button className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-3 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors duration-200 text-sm">
                    <ExternalLink className="w-4 h-4" />
                    Ver Video
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Ejemplos de Código
          </h3>
        </div>
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {filteredCodeExamples.map((example) => (
            <div key={example.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {example.title}
                    </h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      example.language === 'python' 
                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
                        : 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
                    }`}>
                      {example.language.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {example.description}
                  </p>
                </div>
                <button
                  onClick={() => copyToClipboard(example.code, example.id)}
                  className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
                >
                  {copiedCode === example.id ? (
                    <>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      Copiado
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copiar
                    </>
                  )}
                </button>
              </div>
              
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{example.code}</code>
                </pre>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}