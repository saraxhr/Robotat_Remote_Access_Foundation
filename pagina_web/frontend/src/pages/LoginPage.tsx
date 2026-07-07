// ============================================================================
// Archivo: LoginPage.tsx
// Descripción: Página de inicio de sesión con validación institucional,
//              manejo de errores, recordatorio de sesión y modal de cambio
//              de contraseña con validaciones avanzadas y soporte dark mode.
// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ============================================================================

import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Logo } from '../components/Logo'
import { Mail, Lock, Eye, EyeOff, AlertCircle, Key, X, CheckCircle, Info } from 'lucide-react'

// ============================================================================
// Componente principal: LoginPage
// ============================================================================
// Renderiza el formulario de inicio de sesión con validación de dominio
// institucional UVG, persistencia opcional y un modal para cambio de contraseña.
export function LoginPage() {
  // -------------------------------------------------------------------------
  // Estados principales del formulario de login
  // -------------------------------------------------------------------------
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  // -------------------------------------------------------------------------
  // Estados del modal de cambio de contraseña
  // -------------------------------------------------------------------------
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [passwordChangeData, setPasswordChangeData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
  })
  const [passwordChangeErrors, setPasswordChangeErrors] = useState<{ [key: string]: string }>({})
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  // -------------------------------------------------------------------------
  // Contexto de autenticación y navegación
  // -------------------------------------------------------------------------
  const { login, isLoading } = useAuth()
  const navigate = useNavigate()

  // -------------------------------------------------------------------------
  // Handler para envío del formulario principal
  // -------------------------------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validación de dominio institucional
    if (!email.endsWith('@uvg.edu.gt')) {
      setError('Debe usar su correo institucional')
      return
    }

    // Llamada al contexto de autenticación
    const success = await login(email, password, remember)
    if (success) {
      navigate('/dashboard')
    } else {
      setError('Credenciales incorrectas.')
    }
  }

  // -------------------------------------------------------------------------
  // Validación de campos para el cambio de contraseña
  // -------------------------------------------------------------------------
  const validatePasswordChange = (): boolean => {
    const newErrors: { [key: string]: string } = {}

    if (!passwordChangeData.email.trim()) {
      newErrors.email = 'El correo electrónico es requerido'
    } else if (!passwordChangeData.email.endsWith('@uvg.edu.gt')) {
      newErrors.email = 'Debe usar su correo institucional @uvg.edu.gt'
    }

    if (!passwordChangeData.currentPassword) {
      newErrors.currentPassword = 'La contraseña actual es requerida'
    }

    if (!passwordChangeData.newPassword) {
      newErrors.newPassword = 'La nueva contraseña es requerida'
    } else {
      const hasMinLength = passwordChangeData.newPassword.length >= 8
      const hasNumber = /\d/.test(passwordChangeData.newPassword)
      if (!hasMinLength) {
        newErrors.newPassword = 'La nueva contraseña debe tener mínimo 8 caracteres'
      } else if (!hasNumber) {
        newErrors.newPassword = 'La nueva contraseña debe contener al menos un número'
      }
    }

    if (
      passwordChangeData.currentPassword &&
      passwordChangeData.newPassword &&
      passwordChangeData.currentPassword === passwordChangeData.newPassword
    ) {
      newErrors.newPassword = 'La nueva contraseña debe ser diferente a la actual'
    }

    setPasswordChangeErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // -------------------------------------------------------------------------
  // Envío del formulario del modal de cambio de contraseña
  // -------------------------------------------------------------------------
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validatePasswordChange()) return

    setIsChangingPassword(true)
    setPasswordChangeSuccess(false)

    try {
      const res = await fetch('http://localhost:8000/api/auth/password/change-direct/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: passwordChangeData.email.trim().toLowerCase(),
          old_password: passwordChangeData.currentPassword,
          new_password: passwordChangeData.newPassword,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        const detail = data?.detail || data?.old_password?.[0] || data?.new_password?.[0]
        throw new Error(detail || 'No se pudo cambiar la contraseña.')
      }

      setPasswordChangeSuccess(true)
      setEmail(passwordChangeData.email)
      setPassword(passwordChangeData.newPassword)

      setTimeout(() => {
        setShowPasswordChange(false)
        setPasswordChangeData({ email: '', currentPassword: '', newPassword: '' })
        setPasswordChangeErrors({})
        setPasswordChangeSuccess(false)
      }, 2000)
    } catch (err: any) {
      setPasswordChangeErrors((prev) => ({
        ...prev,
        general: err?.message || 'Error al cambiar la contraseña.',
      }))
    } finally {
      setIsChangingPassword(false)
    }
  }

  // -------------------------------------------------------------------------
  // Actualiza campos del modal y limpia errores específicos al escribir
  // -------------------------------------------------------------------------
  const handlePasswordChangeInputChange = (field: keyof typeof passwordChangeData, value: string) => {
    setPasswordChangeData((prev) => ({ ...prev, [field]: value }))
    if (passwordChangeErrors[field]) {
      setPasswordChangeErrors((prev) => ({ ...prev, [field]: '' }))
    }
  }

  // -------------------------------------------------------------------------
  // Render principal del componente (formulario + modal condicional)
  // -------------------------------------------------------------------------
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Tarjeta principal */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 transition-colors duration-300">
          {/* Encabezado con logo y subtítulo */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-6">
              <Logo size="md" animate={true} />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Iniciar Sesión
            </h2>
            <p className="text-gray-600 dark:text-gray-300">Accede a tu laboratorio</p>
          </div>

          {/* Formulario principal */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
              </div>
            )}

            {/* Campo de correo */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Correo Institucional
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@uvg.edu.gt"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
              </div>
            </div>

            {/* Campo de contraseña */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Ingrese su contraseña"
                  className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Checkbox recordar sesión */}
            <div className="flex items-center">
              <input
                id="remember"
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 text-uvg-green-dark bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-uvg-green-light focus:ring-2"
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-600 dark:text-gray-300">
                Recordar sesión
              </label>
            </div>

            {/* Botón principal */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-uvg-yellow text-uvg-green-dark font-semibold py-3 px-4 rounded-lg hover:bg-uvg-yellow/90 focus:ring-4 focus:ring-uvg-yellow/20 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-uvg-green-dark border-t-transparent rounded-full animate-spin"></div>
                  Iniciando sesión...
                </div>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>

          {/* Enlaces secundarios */}
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowPasswordChange(true)}
              className="text-sm text-uvg-green-dark dark:text-uvg-green-light hover:underline mr-4"
            >
              Cambiar mi contraseña
            </button>
            <Link
              to="/"
              className="text-sm text-uvg-green-dark dark:text-uvg-green-light hover:underline"
            >
              ← Volver al inicio
            </Link>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------
         Modal de cambio de contraseña (condicional)
      ----------------------------------------------------------------------*/}
      {showPasswordChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Key className="w-6 h-6 text-uvg-green-dark" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Cambiar Contraseña
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setShowPasswordChange(false)
                    setPasswordChangeData({ email: '', currentPassword: '', newPassword: '' })
                    setPasswordChangeErrors({})
                    setPasswordChangeSuccess(false)
                  }}
                  className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Recuadro informativo */}
              <div className="mb-6 rounded-lg border bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-200">
                <div className="flex items-start gap-3 p-4">
                  <Info className="w-5 h-5 mt-0.5" />
                  <div>
                    <p className="font-semibold">Información importante:</p>
                    <ul className="list-disc pl-5 mt-1 space-y-1 text-sm">
                      <li>La nueva contraseña debe ser diferente a la actual</li>
                      <li>Debe contener al menos 8 caracteres y un número</li>
                      <li>El cambio será efectivo inmediatamente</li>
                    </ul>
                  </div>
                </div>
              </div>

              {passwordChangeSuccess && (
                <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <div>
                    <p className="text-green-700 dark:text-green-300 font-medium">
                      ¡Contraseña actualizada exitosamente!
                    </p>
                    <p className="text-green-600 dark:text-green-400 text-sm">
                      Ya puedes usar tu nueva contraseña para iniciar sesión.
                    </p>
                  </div>
                </div>
              )}

              {!passwordChangeSuccess && (
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  {/* Campo email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Correo Institucional *
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="email"
                        value={passwordChangeData.email}
                        onChange={(e) => handlePasswordChangeInputChange('email', e.target.value)}
                        placeholder="usuario@uvg.edu.gt"
                        className={`w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg ${
                          passwordChangeErrors.email
                            ? 'border-red-300 dark:border-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                        } focus:ring-2 focus:ring-uvg-green-light focus:border-transparent text-gray-900 dark:text-white`}
                        required
                      />
                    </div>
                    {passwordChangeErrors.email && (
                      <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {passwordChangeErrors.email}
                      </div>
                    )}
                  </div>

                  {/* Campo contraseña actual */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Contraseña Actual *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showCurrentPassword ? 'text' : 'password'}
                        value={passwordChangeData.currentPassword}
                        onChange={(e) =>
                          handlePasswordChangeInputChange('currentPassword', e.target.value)
                        }
                        placeholder="Ingrese su contraseña actual"
                        className={`w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg ${
                          passwordChangeErrors.currentPassword
                            ? 'border-red-300 dark:border-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                        } focus:ring-2 focus:ring-uvg-green-light focus:border-transparent text-gray-900 dark:text-white`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordChangeErrors.currentPassword && (
                      <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {passwordChangeErrors.currentPassword}
                      </div>
                    )}
                  </div>

                  {/* Campo nueva contraseña */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Nueva Contraseña *
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        value={passwordChangeData.newPassword}
                        onChange={(e) =>
                          handlePasswordChangeInputChange('newPassword', e.target.value)
                        }
                        placeholder="Ingrese su nueva contraseña"
                        className={`w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-700 border rounded-lg ${
                          passwordChangeErrors.newPassword
                            ? 'border-red-300 dark:border-red-600'
                            : 'border-gray-300 dark:border-gray-600'
                        } focus:ring-2 focus:ring-uvg-green-light focus:border-transparent text-gray-900 dark:text-white`}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {passwordChangeErrors.newPassword && (
                      <div className="mt-1 flex items-center gap-1 text-red-600 dark:text-red-400 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {passwordChangeErrors.newPassword}
                      </div>
                    )}
                    {!passwordChangeErrors.newPassword && passwordChangeData.newPassword && (
                      <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Requisitos: mínimo 8 caracteres y al menos un número
                      </div>
                    )}
                  </div>

                  {/* Error general */}
                  {passwordChangeErrors.general && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2 text-sm text-red-700 dark:text-red-300">
                      <AlertCircle className="w-4 h-4" />
                      {passwordChangeErrors.general}
                    </div>
                  )}

                  {/* Botones del modal */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowPasswordChange(false)
                        setPasswordChangeData({ email: '', currentPassword: '', newPassword: '' })
                        setPasswordChangeErrors({})
                      }}
                      className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={isChangingPassword}
                      className="flex-1 px-4 py-3 bg-uvg-yellow text-uvg-green-dark rounded-lg hover:bg-uvg-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isChangingPassword ? (
                        <>
                          <div className="w-4 h-4 border-2 border-uvg-green-dark border-t-transparent rounded-full animate-spin"></div>
                          Cambiando...
                        </>
                      ) : (
                        <>
                          <Key className="w-4 h-4" />
                          Cambiar Contraseña
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
