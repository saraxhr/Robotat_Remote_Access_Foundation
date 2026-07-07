// ======================================================================================
// Archivo: MQTTLogs.tsx
// Descripción general:
// --------------------------------------------------------------------------------------
// Este componente React constituye el módulo de monitoreo en tiempo real de mensajes MQTT
// dentro del sistema Robotat. Su propósito principal es permitir al usuario visualizar,
// filtrar, pausar, exportar y limpiar los mensajes intercambiados entre los distintos
// agentes del laboratorio (robots, cámaras, etc.) a través del broker MQTT.
//
// Funcionalidades principales:
//   • Establece una conexión WebSocket con el backend de Django, el cual actúa como puente
//     entre el broker MQTT y la interfaz web.
//   • Permite listar los tópicos disponibles y gestionar suscripciones dinámicas.
//   • Muestra los mensajes recibidos por cada topic en tiempo real, clasificándolos según:
//       - tipo ('telemetry' o 'control'),
//       - agente emisor (p. ej., Pololu, MaxArm, cámara)
//       - y topic específico.
//   • Ofrece herramientas interactivas para:
//       - Filtrar mensajes por agente, tipo o palabra clave,
//       - Pausar y reanudar el flujo de mensajes en tiempo real,
//       - Exportar el historial a un archivo CSV,
//       - Limpiar completamente los registros visibles.
//
// Estructura general del componente:
//   1. Definición de interfaces:
//        - MqttMessage: representa cada mensaje recibido del broker.
//        - TopicSubscription: representa las suscripciones activas a los tópicos.
//   2. Estados React (useState):
//        - Conectividad WebSocket, pausa, lista de mensajes, suscripciones, filtros, etc.
//   3. Referencias (useRef):
//        - Permiten mantener actualizados ciertos valores dentro de callbacks asíncronos
//          sin generar cierres obsoletos (“stale closures”).
//   4. Conexión WebSocket:
//        - Conecta y desconecta el cliente del backend Django en el canal /ws/mqtt/.
//        - Procesa la recepción de tópicos y mensajes MQTT en formato JSON.
//   5. Mecanismo de suscripción:
//        - Permite suscribirse o desuscribirse a tópicos específicos desde la interfaz.
//   6. Filtros y utilidades:
//        - Búsqueda por texto, agente y tipo de mensaje.
//        - Limpieza y exportación de logs.
//   7. Renderizado:
//        - Encabezado con estado de conexión,
//        - Panel de suscripciones,
//        - Filtros,
//        - Panel de mensajes en tiempo real con actualización automática.
//
// En conjunto, este componente es esencial para la observabilidad del sistema Robotat,
// ya que ofrece una vista unificada de la comunicación MQTT entre los diferentes módulos.

// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ======================================================================================



import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  Wifi, 
  WifiOff, 
  Filter, 
  Search, 
  Download, 
  Trash2, 
  Play, 
  Pause,
  Bot,
  Camera,
  Settings,
  Globe,
  Zap
} from 'lucide-react';

// ============================
// Interfaces
// ============================
interface MqttMessage {
  id: string;
  timestamp: string;
  topic: string;
  agent: string;
  type: 'telemetry' | 'control';
  packet: any;  // Cambiado de payload = packet
  qos?: number;
  retained?: boolean;
}

interface TopicSubscription {
  topic: string;
  agent: string;
  type: 'telemetry' | 'control';
  isSubscribed: boolean;
}

// ============================
// Componente principal
// ============================
export function MqttLogs() {
  const [isConnected, setIsConnected] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [messages, setMessages] = useState<MqttMessage[]>([]);
  const [subscriptions, setSubscriptions] = useState<TopicSubscription[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAgent, setFilterAgent] = useState('all');
  const [filterType, setFilterType] = useState('all');

  const ws = useRef<WebSocket | null>(null);

  // ---------------------------------------------------------------------
  // Refs para evitar el "stale closure" dentro de onmessage del WebSocket
//    - subscriptionsRef: siempre apunta a la versión más reciente del estado 'subscriptions'
//    - isPausedRef: siempre apunta a la versión más reciente del estado 'isPaused'
// ---------------------------------------------------------------------
const subscriptionsRef = useRef<TopicSubscription[]>([]);  //  guarda suscripciones actuales
const isPausedRef = useRef<boolean>(false);                 //  guarda si está pausado o no


// ---------------------------------------------------------------------
//  Mantener sincronizados los refs con los estados React
// ---------------------------------------------------------------------
useEffect(() => {
  // Cada vez que cambie 'subscriptions', se actualiza ref
  subscriptionsRef.current = subscriptions;  //  evita cierres obsoletos en onmessage
}, [subscriptions]);

useEffect(() => {
  // Cada vez que cambie 'isPaused', se actualiza el ref
  isPausedRef.current = isPaused; //  evita cierres obsoletos en onmessage
}, [isPaused]);


  // ============================
  // Conectar al WebSocket (backend Django)
  // ============================
  const WS_URL = "ws://127.0.0.1:8000/ws/mqtt/";

  const connectWebSocket = () => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log(" Conectado al WebSocket MQTT");
      setIsConnected(true);
      ws.current?.send(JSON.stringify({ action: "list_topics" }));
    };

    ws.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // 🔹 Lista de tópicos desde backend
        if (data.type === "topics_list" && Array.isArray(data.topics)) {
          const mappedSubs: TopicSubscription[] = data.topics.map((t: string) => {
            const parts = t.split("/");
            const agent = parts[1] || "unknown";
            const type = parts[2] === "control" ? "control" : "telemetry";
            return { topic: t, agent, type, isSubscribed: false };
          });
          setSubscriptions(mappedSubs);
          return;
        }

            // Mensaje MQTT real recibido
    if (data.type === "mqtt_message") {
      // ---------------------------------------------------------------
      // Construimos el objeto 'message' con los datos entrantes
      // ---------------------------------------------------------------
      const message: MqttMessage = {
        id: Date.now().toString(),                         //  id único basado en timestamp
        timestamp: new Date().toLocaleTimeString(),        // hora local legible
        topic: data.topic,                                 //  topic completo recibido
        agent: data.topic.split("/")[1] || "unknown",      //  agente deducido por convención 'mocap/<agent>/...'
        type: data.topic.includes("control") ? "control" : "telemetry", //  clasifica por nombre del topic
        packet: data.packet,                               //  el contenido del paquete (ya estandarizado como 'packet')
      };

      // ---------------------------------------------------------------
      // FILTRO EN FRONTEND: solo pasar si el topic está suscrito
      // ---------------------------------------------------------------
      const isSubscribedToTopic = subscriptionsRef.current.some((sub) => {
        // 1) Si no está marcada la suscripción, ignorar
        if (!sub.isSubscribed) return false;

        // 2) Coincidencia exacta del topic
        if (sub.topic === message.topic) return true;

        // 3) Soporte básico para wildcard estilo MQTT: 'algo/#'
        if (sub.topic.endsWith("/#")) {
          const prefix = sub.topic.slice(0, -2); // ← remueve '/#'
          return message.topic.startsWith(prefix);
        }

        return false; // no coincide
      });

      // ---------------------------------------------------------------
      //  Si no está suscrito o está pausado, NO almacenar el mensaje
      //     * OJO: usarisPausedRef' para leer el estado actual
      // ---------------------------------------------------------------
      if (!isSubscribedToTopic || isPausedRef.current) {
        return; // No guardar el mensaje, descartarlo
      }

      // ---------------------------------------------------------------
      //  Si pasa el filtro, guardar mensaje (máximo 1000)
      // ---------------------------------------------------------------
      setMessages((prev) => [message, ...prev].slice(0, 1000));
    }



     
      } catch (err) {
        console.error("Error procesando mensaje WS:", err);
      }
    };

    ws.current.onclose = () => {
      console.log(" Desconectado del WebSocket MQTT");
      setIsConnected(false);
    };

    ws.current.onerror = (error) => {
      console.error("Error en WebSocket:", error);
      setIsConnected(false);
    };
  };

  // ============================
  // Desconectar del WebSocket
  // ============================
  const disconnectWebSocket = () => {
    if (ws.current) {
      ws.current.close();
      ws.current = null;
      setIsConnected(false);
      setSubscriptions([]);
      setMessages([]);
    }
  };

  // ============================
  // Manejo de suscripciones
  // ============================
  const toggleSubscription = (topic: string) => {
    setSubscriptions(prev =>
      prev.map(sub => {
        if (sub.topic === topic) {
          const newState = !sub.isSubscribed;
          if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(
              JSON.stringify({
                action: newState ? "subscribe" : "unsubscribe",
                topic: topic,
              })
            );
          }
          return { ...sub, isSubscribed: newState };
        }
        return sub;
      })
    );
  };

  // ============================
  // Limpiar / exportar mensajes
  // ============================
  const clearMessages = () => setMessages([]);

  const exportMessages = () => {
    const csvContent = [
      ['Timestamp', 'Topic', 'Agent', 'Type', 'Packet'],
      ...filteredMessages.map(msg => [
        msg.timestamp,
        msg.topic,
        msg.agent,
        msg.type,
        JSON.stringify(msg.packet),
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mqtt_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ============================
  // Filtros
  // ============================
  const filteredMessages = messages.filter(msg => {
    const matchesSearch = msg.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         msg.agent.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         JSON.stringify(msg.packet).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAgent = filterAgent === 'all' || msg.agent === filterAgent;
    const matchesType = filterType === 'all' || msg.type === filterType;
    return matchesSearch && matchesAgent && matchesType;
  });

  const getAgentIcon = (agent: string) => {
    if (agent.includes('pololu')) return <Bot className="w-4 h-4" />;
    if (agent.includes('maxarm')) return <Settings className="w-4 h-4" />;
    if (agent.includes('camera')) return <Camera className="w-4 h-4" />;
    return <Globe className="w-4 h-4" />;
  };

  const getTypeColor = (type: string) => {
    return type === 'telemetry'
      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      : 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
  };

  const uniqueAgents = [...new Set(subscriptions.map(sub => sub.agent))];

  // ============================
  // Render
  // ============================
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Logs MQTT</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Monitoreo en tiempo real de mensajes MQTT del sistema Robotat
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
            isConnected ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' :
            'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
          }`}>
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="text-sm font-medium">{isConnected ? 'Conectado' : 'Desconectado'}</span>
          </div>
          <button
            onClick={isConnected ? disconnectWebSocket : connectWebSocket}
            className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
              isConnected 
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-green-600 text-white hover:bg-green-700'
            }`}
          >
            {isConnected ? 'Desconectar' : 'Conectar'}
          </button>
        </div>
      </div>

      {/* Suscripciones */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Suscripciones a Topics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
          {subscriptions.map(sub => (
            <div
              key={sub.topic}
              className={`p-3 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                sub.isSubscribed
                  ? 'border-uvg-green-dark bg-uvg-green-light/10'
                  : 'border-gray-200 dark:border-gray-700 hover:border-uvg-green-light'
              }`}
              onClick={() => toggleSubscription(sub.topic)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getAgentIcon(sub.agent)}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{sub.agent}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{sub.topic}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(sub.type)}`}>
                  {sub.type}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar en mensajes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterAgent}
              onChange={(e) => setFilterAgent(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            >
              <option value="all">Todos los agentes</option>
              {uniqueAgents.map(agent => (
                <option key={agent} value={agent}>{agent}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            >
              <option value="all">Todos los tipos</option>
              <option value="telemetry">Telemetría</option>
              <option value="control">Control</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mensajes en tiempo real */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Mensajes en Tiempo Real</h3>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPaused(!isPaused)}
              disabled={!isConnected}
              className="inline-flex items-center gap-2 bg-uvg-yellow text-uvg-green-dark px-4 py-2 rounded-lg hover:bg-uvg-yellow/90 disabled:opacity-50"
            >
              {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              {isPaused ? 'Reanudar' : 'Pausar'}
            </button>
            <button
              onClick={clearMessages}
              className="inline-flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200"
            >
              <Trash2 className="w-4 h-4" />
              Limpiar
            </button>
            <button
              onClick={exportMessages}
              disabled={messages.length === 0}
              className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-lg hover:bg-blue-200 disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              Exportar CSV
            </button>
          </div>
        </div>

        <div className="h-96 overflow-y-auto">
          {filteredMessages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <Activity className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay mensajes para mostrar</p>
                <p className="text-sm">Suscríbete a un topic para ver mensajes</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredMessages.map((msg) => (
                <div key={msg.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getAgentIcon(msg.agent)}
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{msg.topic}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {msg.timestamp}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(msg.type)}`}>
                      {msg.type}
                    </span>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mt-2">
                    <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-x-auto">
                      {JSON.stringify(msg.packet, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
