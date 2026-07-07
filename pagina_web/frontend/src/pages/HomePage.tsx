// ============================================================================
// Archivo: HomePage.tsx
// Descripción: Página principal pública de la aplicación. Presenta la
//              introducción general, las características del laboratorio,
//              los equipos disponibles y el pie de página institucional.
// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ============================================================================

import React from 'react'
import { Link } from 'react-router-dom'
import { Logo } from '../components/Logo'
import { Bot, Camera, Shield, Users, Lock, MailCheck } from 'lucide-react'

// ============================================================================
// Componente principal: HomePage
// ============================================================================
// Renderiza el contenido visible para usuarios no autenticados. Contiene
// secciones de introducción, características y equipos, con navegación
// hacia el login o exploración libre.
export function HomePage() {
  // -------------------------------------------------------------------------
  // Lista de características para la sección “¿Qué ofrece Robotat?”
  // Cada entrada contiene un ícono, título y descripción.
  // -------------------------------------------------------------------------
  const features = [
    {
      icon: Bot,
      title: 'Robots disponibles',
      description: 'Acceso a robots Pololu, MaxArm y otros equipos especializados',
    },
    {
      icon: Camera,
      title: 'Cámaras AMCREST',
      description: 'Visualización en tiempo real con controles PTZ',
    },
    {
      icon: Lock,
      title: 'Infraestructura local segura',
      description: 'Red cerrada exclusiva que garantiza una comunicación estable',
    },
    {
      icon: MailCheck,
      title: 'Acceso institucional',
      description: 'Inicio de sesión autorizado mediante correo institucional UVG',
    },
  ]

  // -------------------------------------------------------------------------
  // Render principal de la página
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen bg-gradient-to-br from-uvg-green-light/10 via-white to-uvg-yellow/10 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* ---------------------------------------------------------------------
         Sección Hero: introducción principal y botones de navegación
      ----------------------------------------------------------------------*/}
      <div className="relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <Logo size="lg" animate={true} />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-6">
              Laboratorio de robótica
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Plataforma innovadora que permite a estudiantes e investigadores de la Universidad del Valle de Guatemala acceder a equipos de robótica avanzados para experimentación y aprendizaje.
            </p>

            {/* Botones de acción: login y exploración */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/login"
                className="inline-flex items-center px-8 py-4 bg-uvg-yellow text-uvg-green-dark font-semibold rounded-lg shadow-lg hover:bg-uvg-yellow/90 hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                <Shield className="w-5 h-5 mr-2" />
                Iniciar sesión
              </Link>

              <Link
                to="/explorar"
                className="inline-flex items-center px-8 py-4 bg-white dark:bg-gray-800 text-uvg-green-dark dark:text-white border-2 border-uvg-green-dark dark:border-uvg-green-light font-semibold rounded-lg hover:bg-uvg-green-dark hover:text-white dark:hover:bg-uvg-green-light dark:hover:text-uvg-green-dark transition-all duration-300"
              >
                <Users className="w-5 h-5 mr-2" />
                Explorar como visitante
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
         Sección de características (¿Qué ofrece Robotat?)
      ----------------------------------------------------------------------*/}
      <div className="py-16 bg-white/50 dark:bg-gray-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              ¿Qué ofrece Robotat?
            </h3>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Tecnología de vanguardia al alcance de todos los estudiantes
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-2 transition-all duration-300"
                >
                  <div className="w-12 h-12 bg-uvg-green-light/20 dark:bg-uvg-green-dark/20 rounded-lg flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-uvg-green-dark dark:text-uvg-green-light" />
                  </div>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {feature.description}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
         Sección de equipos disponibles
      ----------------------------------------------------------------------*/}
      <div className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Equipos disponibles
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Pololu 3pi+ */}
            <div className="bg-gradient-to-br from-uvg-green-light/10 to-uvg-yellow/10 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl">
              <div className="w-16 h-16 bg-uvg-yellow rounded-full flex items-center justify-center mb-4 mx-auto">
                <Bot className="w-8 h-8 text-uvg-green-dark" />
              </div>
              <h4 className="text-xl font-semibold text-center mb-4 text-gray-900 dark:text-white">
                Robot Pololu 3pi+
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Robot móvil ideal para aprendizaje de programación y navegación autónoma.
              </p>
            </div>

            {/* Brazo MaxArm */}
            <div className="bg-gradient-to-br from-uvg-green-light/10 to-uvg-yellow/10 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl">
              <div className="w-16 h-16 bg-uvg-yellow rounded-full flex items-center justify-center mb-4 mx-auto">
                <Bot className="w-8 h-8 text-uvg-green-dark" />
              </div>
              <h4 className="text-xl font-semibold text-center mb-4 text-gray-900 dark:text-white">
                Brazo MaxArm
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Brazo robótico de 6 grados de libertad para manipulación de objetos.
              </p>
            </div>

            {/* Cámaras Amcrest */}
            <div className="bg-gradient-to-br from-uvg-green-light/10 to-uvg-yellow/10 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl">
              <div className="w-16 h-16 bg-uvg-yellow rounded-full flex items-center justify-center mb-4 mx-auto">
                <Camera className="w-8 h-8 text-uvg-green-dark" />
              </div>
              <h4 className="text-xl font-semibold text-center mb-4 text-gray-900 dark:text-white">
                Cámaras Amcrest
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Sistema de cámaras con control de panorámica, inclinación y zoom.
              </p>
            </div>

            {/* Sistema OptiTrack */}
            <div className="bg-gradient-to-br from-uvg-green-light/10 to-uvg-yellow/10 dark:from-gray-800 dark:to-gray-700 p-8 rounded-xl">
              <div className="w-16 h-16 bg-uvg-yellow rounded-full flex items-center justify-center mb-4 mx-auto">
                <Camera className="w-8 h-8 text-uvg-green-dark" />
              </div>
              <h4 className="text-xl font-semibold text-center mb-4 text-gray-900 dark:text-white">
                Sistema OptiTrack
              </h4>
              <p className="text-gray-600 dark:text-gray-300 text-center">
                Seis cámaras infrarrojas para capturar movimiento con alta precisión en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
         Pie de página institucional
      ----------------------------------------------------------------------*/}
      <footer className="bg-uvg-green-dark text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Logo size="sm" />
            </div>
            <div className="text-center md:text-right">
              <p className="text-uvg-green-light">
                Universidad del Valle de Guatemala
              </p>
              <p className="text-sm text-uvg-green-light/80">
                Departamento de Ingeniería en Mecatrónica
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
