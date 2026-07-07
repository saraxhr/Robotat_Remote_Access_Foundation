// ======================================================================================
// Archivo: LabControl.tsx
// Descripción general:
// --------------------------------------------------------------------------------------
// Este componente React permite visualizar, controlar y administrar los dispositivos 
// del laboratorio Robotat (robots, cámaras y sensores). 
// Incluye controles de encendido/apagado, reinicio, monitoreo de estado en tiempo real
// y resumen visual de los dispositivos activos.
// ======================================================================================
// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT

import React, { useState } from 'react';
import { 
  Power, 
  PowerOff, 
  Settings, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  Clock,
  Bot,
  Camera
} from 'lucide-react';

interface Device {
  id: string;
  name: string;
  type: 'robot' | 'camera' | 'sensor';
  status: 'online' | 'offline' | 'maintenance' | 'error';
  location: string;
  lastPing: string;
  uptime: string;
}

export function LabControl() {
  const [devices, setDevices] = useState<Device[]>([
    {
      id: '1',
      name: 'Robot Pololu #1',
      type: 'robot',
      status: 'online',
      location: 'Mesa A',
      lastPing: '2 seg',
      uptime: '2h 45min'
    },
    {
      id: '2',
      name: 'MaxArm Robot',
      type: 'robot',
      status: 'online',
      location: 'Mesa B',
      lastPing: '1 seg',
      uptime: '1h 20min'
    },
    {
      id: '3',
      name: 'Cámara PTZ #1',
      type: 'camera',
      status: 'online',
      location: 'Esquina NO',
      lastPing: '3 seg',
      uptime: '5h 12min'
    },
    {
      id: '4',
      name: 'Cámara PTZ #2',
      type: 'camera',
      status: 'maintenance',
      location: 'Esquina NE',
      lastPing: '45 seg',
      uptime: '0min'
    },
    {
      id: '5',
      name: 'Robot Pololu #2',
      type: 'robot',
      status: 'offline',
      location: 'Mesa C',
      lastPing: '2 min',
      uptime: '0min'
    },
    {
      id: '6',
      name: 'Cámara Cenital',
      type: 'camera',
      status: 'error',
      location: 'Techo Central',
      lastPing: '1 min',
      uptime: '0min'
    }
  ]);

  const toggleDevice = (deviceId: string) => {
    setDevices(devices.map(device => {
      if (device.id === deviceId) {
        const newStatus = device.status === 'online' ? 'offline' : 'online';
        return { ...device, status: newStatus };
      }
      return device;
    }));
  };

  const restartDevice = (deviceId: string) => {
    setDevices(devices.map(device => {
      if (device.id === deviceId) {
        return { ...device, status: 'maintenance', uptime: '0min' };
      }
      return device;
    }));

    // Simulate restart completion
    setTimeout(() => {
      setDevices(prev => prev.map(device => {
        if (device.id === deviceId) {
          return { ...device, status: 'online', uptime: '0min', lastPing: '1 seg' };
        }
        return device;
      }));
    }, 3000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'offline':
        return <PowerOff className="w-5 h-5 text-gray-500" />;
      case 'maintenance':
        return <Settings className="w-5 h-5 text-yellow-500 animate-spin" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertTriangle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'offline':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'error':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'robot':
        return <Bot className="w-6 h-6" />;
      case 'camera':
        return <Camera className="w-6 h-6" />;
      default:
        return <Settings className="w-6 h-6" />;
    }
  };

  const statusCounts = devices.reduce((acc, device) => {
    acc[device.status] = (acc[device.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Control del Laboratorio
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Administra y controla todos los dispositivos del laboratorio
          </p>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.online || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">En Línea</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <PowerOff className="w-8 h-8 text-gray-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.offline || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Desconectados</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Settings className="w-8 h-8 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.maintenance || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Mantenimiento</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-red-500" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {statusCounts.error || 0}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Con Error</p>
            </div>
          </div>
        </div>
      </div>

      {/* Global Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Controles Globales
        </h3>
        <div className="flex flex-wrap gap-4">
          <button className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors duration-200">
            <Power className="w-4 h-4" />
            Encender Todo
          </button>
          <button className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors duration-200">
            <PowerOff className="w-4 h-4" />
            Apagar Todo
          </button>
          <button className="inline-flex items-center gap-2 bg-uvg-yellow text-uvg-green-dark px-4 py-2 rounded-lg hover:bg-uvg-yellow/90 transition-colors duration-200">
            <RefreshCw className="w-4 h-4" />
            Reiniciar Sistema
          </button>
          <button className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200">
            <Wifi className="w-4 h-4" />
            Test Conectividad
          </button>
        </div>
      </div>

      {/* Devices Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {devices.map((device) => (
          <div key={device.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-uvg-green-light/10 rounded-lg">
                  {getDeviceIcon(device.type)}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {device.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {device.location}
                  </p>
                </div>
              </div>
              {getStatusIcon(device.status)}
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Estado:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(device.status)}`}>
                  {device.status === 'online' ? 'En línea' :
                   device.status === 'offline' ? 'Desconectado' :
                   device.status === 'maintenance' ? 'Mantenimiento' : 'Error'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Último ping:</span>
                <span className="text-sm text-gray-900 dark:text-white">{device.lastPing}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">Tiempo activo:</span>
                <span className="text-sm text-gray-900 dark:text-white">{device.uptime}</span>
              </div>
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => toggleDevice(device.id)}
                className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                  device.status === 'online'
                    ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-300'
                    : 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-300'
                }`}
              >
                {device.status === 'online' ? (
                  <>
                    <PowerOff className="w-4 h-4" />
                    Apagar
                  </>
                ) : (
                  <>
                    <Power className="w-4 h-4" />
                    Encender
                  </>
                )}
              </button>
              <button
                onClick={() => restartDevice(device.id)}
                className="px-3 py-2 bg-uvg-yellow/10 text-uvg-green-dark hover:bg-uvg-yellow/20 rounded-lg transition-colors duration-200"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}