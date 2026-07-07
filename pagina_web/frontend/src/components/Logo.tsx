// ============================================================================
// Archivo: Logo.tsx
// Descripción: Componente visual del logotipo del sistema, que combina un ícono
//              dinámico con el texto "Robotat - Laboratorio UVG".
// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ============================================================================

// Importación del núcleo de React para utilizar JSX y definir el componente funcional
import React from 'react'

// Importación del ícono "Bot" desde la librería lucide-react
// Este ícono representa un robot, usado como símbolo del laboratorio
import { Bot } from 'lucide-react'

// ---------------------------------------------------------------------------
// Definición de la interfaz de propiedades que recibe el componente Logo
// ---------------------------------------------------------------------------
interface LogoProps {
  size?: 'sm' | 'md' | 'lg'    // Tamaño del logotipo: pequeño, mediano o grande
  animate?: boolean            // Bandera opcional para activar la animación
}

// ---------------------------------------------------------------------------
// Definición del componente principal Logo
// ---------------------------------------------------------------------------
// Este componente muestra el ícono del robot y el texto descriptivo del laboratorio.
// El tamaño y la animación se ajustan mediante las props proporcionadas.
export function Logo({ size = 'md', animate = false }: LogoProps) {
  // Mapeo de clases CSS según el tamaño seleccionado
  const sizeClasses = {
    sm: 'text-2xl',   // Pequeño
    md: 'text-4xl',   // Mediano (por defecto)
    lg: 'text-6xl'    // Grande
  }

  // Retorno del JSX que define la estructura visual del logo
  return (
    <div className="flex items-center gap-3">
      {/* Contenedor del ícono del robot */}
      <div className={`relative ${animate ? 'animate-pulse' : ''}`}>
        {/* Ícono principal del robot, con color y tamaño adaptativo */}
        <Bot
          className={`${sizeClasses[size]} text-uvg-green-dark dark:text-uvg-green-light transition-colors duration-300`}
        />
        {/* Si la animación está activa, se agrega un halo pulsante detrás del ícono */}
        {animate && (
          <div className="absolute inset-0 bg-uvg-yellow opacity-20 rounded-full animate-ping"></div>
        )}
      </div>

      {/* Contenedor del texto del logotipo */}
      <div className="flex flex-col">
        {/* Título principal "Robotat", con tamaño variable según la prop 'size' */}
        <h1
          className={`font-bold text-uvg-green-dark dark:text-white transition-colors duration-300 ${
            size === 'sm'
              ? 'text-xl'
              : size === 'md'
              ? 'text-3xl'
              : 'text-5xl'
          }`}
        >
          Robotat
        </h1>

        {/* Subtítulo "Laboratorio UVG", también dependiente del tamaño */}
        <p
          className={`text-uvg-green-light dark:text-gray-300 transition-colors duration-300 ${
            size === 'sm'
              ? 'text-xs'
              : size === 'md'
              ? 'text-sm'
              : 'text-base'
          }`}
        >
          Laboratorio UVG
        </p>
      </div>
    </div>
  )
}
