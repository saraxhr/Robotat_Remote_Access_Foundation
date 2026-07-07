// ============================================================================
// App.tsx — Ruteo principal con protección por token y por rol
// ----------------------------------------------------------------------------
// Este archivo define el punto central del enrutamiento del frontend. 
// Incluye el sistema de autenticación basado en tokens, validación de roles 
// (admin, student, researcher) y los proveedores globales de tema y sesión.

// Autora: Sara Hernández
// Colaborador: ChatGPT
// ============================================================================

// ---------------------------------------------------------------------------
// IMPORTACIONES PRINCIPALES
// ---------------------------------------------------------------------------

// Importamos React para usar JSX y los tipos de componentes
import React from 'react'

// Importamos herramientas del enrutador de React
//  - BrowserRouter: gestiona la historia del navegador (URLs)
//  - Routes / Route: definen las rutas y los componentes asociados
//  - Navigate: permite redirigir al usuario programáticamente
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'

// Importamos el contexto de autenticación (estado global del usuario)
//  - AuthProvider: provee contexto de autenticación a toda la app
//  - useAuth: hook que expone el usuario, rol y estado de carga
import { AuthProvider, useAuth } from './contexts/AuthContext'

// Importamos el contexto de tema (claro/oscuro) para mantener coherencia visual
import { ThemeProvider } from './contexts/ThemeContext'

// Importamos el layout base que contiene el sidebar, topbar y el contenido dinámico
import { Layout } from './components/Layout'

// ---------------------------------------------------------------------------
// IMPORTACIÓN DE PÁGINAS
// ---------------------------------------------------------------------------

// Páginas públicas (sin autenticación requerida)
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { VisitorExploration } from './pages/VisitorExploration'

// Páginas comunes protegidas (accesibles con sesión iniciada)
import { Dashboard } from './pages/Dashboard'

// Bloque ADMINISTRADOR
import { UserManagement } from './pages/admin/UserManagement'
import { LabControl } from './pages/admin/LabControl'
import { CameraMonitoring } from './pages/admin/CameraMonitoring'
import { AdminHistory } from './pages/admin/AdminHistory'
import { PololuControl } from './pages/admin/PololuControl'
import { DataAnalysis } from './pages/admin/DataAnalysis'

// Bloque ESTUDIANTE
import { StudentSession } from './pages/student/StudentSession'
import { StudentResults } from './pages/student/StudentResults'
import { StudyMaterials } from './pages/student/StudyMaterials'

// Bloque INVESTIGADOR 
// (Asegurarse que existan las carpetas y componentes correspondientes)
import { CameraMonitoring as ResearcherCameraMonitoring } from './pages/researcher/CameraMonitoring'
import { DataDownload } from './pages/researcher/DataDownload'
import { Experimentation } from './pages/researcher/Experimentation'
import { TestRegistry } from './pages/researcher/TestRegistry'

// Bloque LOGS MQTT (uno por rol, reutilizando el mismo componente con alias)
import { MqttLogs as AdminMqttLogs } from './pages/admin/MQTTLogs'
import { MqttLogs as ResearcherMqttLogs } from './pages/researcher/MQTTLogs'
import { MqttLogs as StudentMqttLogs } from './pages/student/MQTTLogs'

// ============================================================================
// COMPONENTE ProtectedRoute — Protege rutas según sesión y rol
// ============================================================================
// Este componente actúa como un "guard" que envuelve las rutas protegidas.
// Valida si el usuario está autenticado y si su rol tiene permiso para acceder.

function ProtectedRoute({
  element,         // Componente a renderizar
  allowedRoles,    // Lista opcional de roles permitidos
}: {
  element: React.ReactElement
  allowedRoles?: Array<'admin' | 'student' | 'researcher'>
}) {
  // Obtenemos el usuario actual y el estado de carga desde el AuthContext
  const { user, isLoading } = useAuth()

  // Si aún se está verificando la sesión, mostramos un spinner de carga
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
          {/* Spinner animado */}
          <div className="w-6 h-6 border-2 border-uvg-green-dark border-t-transparent rounded-full animate-spin" />
          <span>Verificando sesión…</span>
        </div>
      </div>
    )
  }

  // Si no existe un usuario autenticado, redirigimos a la página de login
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Si el usuario no tiene el rol adecuado para la ruta, redirigimos al dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  // Si pasa todas las validaciones, renderizamos el componente solicitado
  return element
}

// ============================================================================
// COMPONENTE AppRoutes — Define todas las rutas de la aplicación
// ============================================================================
// Este bloque agrupa todas las rutas públicas y protegidas de la app,
// organizadas por perfil de usuario (admin, student, researcher).

function AppRoutes() {
  return (
    // El Layout define el contenedor visual con barra lateral y superior
    <Layout>
      {/* Declaración de las rutas principales */}
      <Routes>

        {/* RUTAS PÚBLICAS (sin autenticación) */}
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/explorar" element={<VisitorExploration />} />

        {/* RUTA GENERAL PROTEGIDA — accesible a cualquier usuario logueado */}
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />

        {/* --------------------------------------------------------------- */}
        {/* BLOQUE DE RUTAS — ADMINISTRADOR */}
        {/* --------------------------------------------------------------- */}
        <Route path="/admin/usuarios" element={<ProtectedRoute allowedRoles={['admin']} element={<UserManagement />} />} />
        <Route path="/admin/lab-control" element={<ProtectedRoute allowedRoles={['admin']} element={<LabControl />} />} />
        <Route path="/admin/monitoreo" element={<ProtectedRoute allowedRoles={['admin']} element={<CameraMonitoring />} />} />
        <Route path="/admin/historial" element={<ProtectedRoute allowedRoles={['admin']} element={<AdminHistory />} />} />
        <Route path="/admin/logs" element={<ProtectedRoute allowedRoles={['admin']} element={<AdminMqttLogs />} />} />
        <Route path="/admin/pololu" element={<ProtectedRoute allowedRoles={['admin']} element={<PololuControl />} />} />
        <Route path="/admin/analisis" element={<ProtectedRoute allowedRoles={['admin']} element={<DataAnalysis />} />} />

        {/* --------------------------------------------------------------- */}
        {/* BLOQUE DE RUTAS — ESTUDIANTE */}
        {/* --------------------------------------------------------------- */}
        <Route path="/estudiante/sesion" element={<ProtectedRoute allowedRoles={['student']} element={<StudentSession />} />} />
        <Route path="/estudiante/resultados" element={<ProtectedRoute allowedRoles={['student']} element={<StudentResults />} />} />
        <Route path="/estudiante/material" element={<ProtectedRoute allowedRoles={['student']} element={<StudyMaterials />} />} />
        <Route path="/estudiante/logs" element={<ProtectedRoute allowedRoles={['student']} element={<StudentMqttLogs />} />} />

        {/* --------------------------------------------------------------- */}
        {/* BLOQUE DE RUTAS — INVESTIGADOR (nuevo perfil) */}
        {/* --------------------------------------------------------------- */}
        <Route path="/investigador/monitoreo" element={<ProtectedRoute allowedRoles={['researcher']} element={<ResearcherCameraMonitoring />} />} />
        <Route path="/investigador/datos" element={<ProtectedRoute allowedRoles={['researcher']} element={<DataDownload />} />} />
        <Route path="/investigador/experimentacion" element={<ProtectedRoute allowedRoles={['researcher']} element={<Experimentation />} />} />
        <Route path="/investigador/registro" element={<ProtectedRoute allowedRoles={['researcher']} element={<TestRegistry />} />} />
        <Route path="/investigador/logs" element={<ProtectedRoute allowedRoles={['researcher']} element={<ResearcherMqttLogs />} />} />

        {/* --------------------------------------------------------------- */}
        {/* RUTA POR DEFECTO — Redirección si no se encuentra coincidencia */}
        {/* --------------------------------------------------------------- */}
        <Route path="*" element={<Navigate to="/" replace />} />

      </Routes>
    </Layout>
  )
}

// ============================================================================
// COMPONENTE PRINCIPAL — App
// ============================================================================
// Este componente raíz encapsula los proveedores globales y el router.
// Aquí se combinan los contextos de tema, autenticación y enrutamiento.

function App() {
  return (
    // ThemeProvider aplica el modo claro/oscuro a toda la aplicación
    <ThemeProvider>

      {/* AuthProvider mantiene el estado global del usuario y token */}
      <AuthProvider>

        {/* Router permite la navegación entre páginas mediante rutas declarativas */}
        <Router>
          <AppRoutes />
        </Router>

      </AuthProvider>
    </ThemeProvider>
  )
}

// Exportamos App como el componente raíz que será montado en index.tsx
export default App
