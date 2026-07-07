// ======================================================================================
// Archivo: UserManagement.tsx
// Descripción general:
// --------------------------------------------------------------------------------------
// Este componente React constituye el panel de administración de usuarios del sistema
// Robotat. Desde esta interfaz, los administradores pueden crear, editar y eliminar
// cuentas de usuario asociadas a los diferentes roles del laboratorio.
//
// Funcionalidades principales:
//   • Gestión completa de usuarios:
//       - Creación de nuevos usuarios mediante formulario (POST al endpoint Django).
//       - Edición de datos existentes, incluyendo nombre, correo, rol y estado (PATCH).
//       - Eliminación controlada de usuarios con confirmación previa (DELETE).
//   • Integración con backend:
//       - Conexión directa al endpoint `/api/usuarios/` del backend Django REST Framework.
//       - Envío de encabezados de autenticación JWT almacenados en `localStorage`.
//       - Sincronización del listado de usuarios mediante solicitudes HTTP (GET).
//   • Filtrado y búsqueda:
//       - Búsqueda dinámica por nombre o correo electrónico.
//       - Filtro por rol (administrador, estudiante, investigador).
//       - Indicadores visuales para usuarios activos e inactivos.
//   • Interfaz visual:
//       - Tarjetas de estadísticas generales (usuarios totales, activos, inactivos).
//       - Tabla responsive con colores de estado y acciones rápidas (editar/eliminar).
//       - Formularios modales con validación local y manejo de errores.
//       - Diseño consistente con el esquema visual de la plataforma (colores UVG).
//
// Estructura general del componente:
//   1. Definición de interfaces:
//        - User: representa un usuario dentro del sistema.
//        - NewUserForm y EditUserForm: definen la estructura de los formularios.
//   2. Variables globales y configuración:
//        - API_BASE y ENDPOINT_USERS determinan la URL del backend.
//   3. Estados React (useState):
//        - Controlan el listado de usuarios, formularios, errores, estados de carga, etc.
//   4. Efectos (useEffect):
//        - Realiza la carga inicial de usuarios al montar el componente.
//   5. Funciones CRUD:
//        - handleCreateSubmit: crea un nuevo usuario.
//        - handleEditSubmit: guarda cambios de un usuario existente.
//        - handleDelete: elimina un usuario tras confirmación.
//   6. Filtrado y estilos auxiliares:
//        - Filtros de búsqueda/rol y colores dinámicos de badges.
//   7. Renderizado:
//        - Encabezado con botón para crear usuario.
//        - Tarjetas de estadísticas.
//        - Tabla de usuarios con acciones rápidas.
//        - Modales independientes para creación, edición y eliminación.
//
// Este módulo centraliza la administración de credenciales del Robotat, garantizando que
// el acceso al sistema web sea controlado, seguro y organizado según los roles definidos
// en la arquitectura de autenticación (administrador, estudiante e investigador).

// ---------------------------------------------------------------------------
// Autora: Sara Hernández
// Colaborador: ChatGPT
// ======================================================================================


import React from 'react';                         //  añadido para tipado JSX.Element
import { useEffect, useState } from 'react';       // hooks de React
import {                                          // Íconos de lucide-react para botones y badges
  Users, Plus, Search, Edit3, Trash2, UserCheck, UserX, Filter, Download, X, AlertTriangle
} from 'lucide-react';

// -------------------------------
// Tipos e interfaces
// -------------------------------
interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'researcher';
  status: 'active' | 'inactive';
  lastLogin: string;
  sessionsCount: number;
}

interface NewUserForm {
  name: string;
  email: string;
  role: 'admin' | 'student' | 'researcher';
  active: boolean;
  password: string;
}

interface EditUserForm {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'student' | 'researcher';
  active: boolean;
}

// -------------------------------
// Config general (ajustar al entorno)
// -------------------------------
const API_BASE = "http://localhost:8000";
const ENDPOINT_USERS = `${API_BASE}/api/usuarios/`;

// export function UserManagement(): JSX.Element { //  Firma opcional explícita
export function UserManagement(): JSX.Element { // tipado explícito evita () => void
  const [users, setUsers] = useState<User[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newUser, setNewUser] = useState<NewUserForm>({
    name: '',
    email: '',
    role: 'student',
    active: true,
    password: ''
  });

  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [showEditForm, setShowEditForm] = useState(false);
  const [editUser, setEditUser] = useState<EditUserForm | null>(null);
  const [editing, setEditing] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Si usas JWT desde el AuthContext, normalmente quedó guardado como 'robotat_token'
  const accessToken = localStorage.getItem('robotat_token') || '';

  // -------------------------------
  // Carga inicial de usuarios (GET)
  // -------------------------------
  useEffect(() => {
    fetch(ENDPOINT_USERS, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      }
    })
      .then(res => res.json())
      .then((data: any[]) => {
        const formatted = data.map((user: any) => ({
          id: String(user.id),
          name: user.nombre,
          email: user.email,
          role: String(user.rol).toLowerCase(),
          status: user.is_active ? 'active' : 'inactive',
          lastLogin: user.last_login || 'N/A',
          sessionsCount: 0
        })) as User[];
        setUsers(formatted);
      })
      .catch(err => console.error("Error al cargar usuarios:", err));
  }, [accessToken]);

  // -------------------------------
  // Filtrado local por búsqueda/rol
  // -------------------------------
  const filteredUsers = users.filter(user => {
    const text = `${user.name} ${user.email}`.toLowerCase();
    const matchesSearch = text.includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  // -------------------------------
  // Helpers de estilos (badges)
  // -------------------------------
  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      case 'student': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'researcher': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    return status === 'active'
      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
  };

  // -------------------------------
  // Crear usuario (POST)
  // -------------------------------
  const handleNewChange = (field: keyof NewUserForm, value: string | boolean) => {
    setNewUser(prev => ({ ...prev, [field]: value }));
  };

  const resetCreateForm = () => {
    setNewUser({ name: '', email: '', role: 'student', active: true, password: '' });
    setCreateError(null);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);
    if (!newUser.name || !newUser.email || !newUser.password) {
      setCreateError('Por favor completa nombre, email y contraseña.');
      return;
    }
    setCreating(true);
    try {
      const payload = {
        nombre: newUser.name,
        email: newUser.email,
        rol: newUser.role,
        is_active: newUser.active,
        password: newUser.password
      };
      const res = await fetch(ENDPOINT_USERS, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'No se pudo crear el usuario.');
      }
      const created = await res.json();
      const createdUser: User = {
        id: String(created.id ?? crypto.randomUUID()),
        name: created.nombre ?? newUser.name,
        email: created.email ?? newUser.email,
        role: String((created.rol ?? newUser.role)).toLowerCase() as User['role'],
        status: (created.is_active ?? newUser.active) ? 'active' : 'inactive',
        lastLogin: created.last_login || 'N/A',
        sessionsCount: 0
      };
      setUsers(prev => [createdUser, ...prev]);
      resetCreateForm();
      setShowCreateForm(false);
    } catch (err: any) {
      setCreateError(err.message || 'Error desconocido al crear.');
    } finally {
      setCreating(false);
    }
  };

  // -------------------------------
  // Abrir modal de edición con datos
  // -------------------------------
  const openEditModal = (u: User) => {
    setEditError(null);
    setEditUser({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      active: u.status === 'active'
    });
    setShowEditForm(true);
  };

  const handleEditChange = (field: keyof EditUserForm, value: string | boolean) => {
    setEditUser(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // -------------------------------
  // Enviar edición (PATCH)
  // -------------------------------
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUser) return;
    setEditError(null);
    setEditing(true);
    try {
      const url = `${ENDPOINT_USERS}${editUser.id}/`;
      const payload = {
        nombre: editUser.name,
        email: editUser.email,
        rol: editUser.role,
        is_active: editUser.active
      };
      const res = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'No se pudo actualizar el usuario.');
      }
      const updated = await res.json();
      setUsers(prev => prev.map(u => (
        u.id === editUser.id
          ? {
              id: String(updated.id ?? editUser.id),
              name: updated.nombre ?? editUser.name,
              email: updated.email ?? editUser.email,
              role: String((updated.rol ?? editUser.role)).toLowerCase() as User['role'],
              status: (updated.is_active ?? editUser.active) ? 'active' : 'inactive',
              lastLogin: updated.last_login || u.lastLogin,
              sessionsCount: u.sessionsCount
            }
          : u
      )));
      setShowEditForm(false);
      setEditUser(null);
    } catch (err: any) {
      setEditError(err.message || 'Error desconocido al actualizar.');
    } finally {
      setEditing(false);
    }
  };

  // -------------------------------
  // Confirmar y eliminar (DELETE)
  // -------------------------------
  const requestDelete = (id: string) => {
    setDeleteError(null);
    setConfirmDeleteId(id);
  };

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    setDeleting(true);
    const url = `${ENDPOINT_USERS}${confirmDeleteId}/`;
    const previous = users;
    setUsers(prev => prev.filter(u => u.id !== confirmDeleteId));
    try {
      const res = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        }
      });
      if (!res.ok && res.status !== 204) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.detail || 'No se pudo eliminar el usuario.');
      }
      setConfirmDeleteId(null);
    } catch (err: any) {
      setUsers(previous);
      setDeleteError(err.message || 'Error desconocido al eliminar.');
    } finally {
      setDeleting(false);
    }
  };

  // -------------------------------
  // Render principal
  // -------------------------------
  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Usuarios</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Administra usuarios del sistema Robotat</p>
        </div>
        <button
          onClick={() => { setShowCreateForm(true); setCreateError(null); }}
          className="inline-flex items-center gap-2 bg-uvg-yellow text-uvg-green-dark px-4 py-2 rounded-lg hover:bg-uvg-yellow/90 transition-colors duration-200"
        >
          <Plus className="w-4 h-4" />
          Crear Usuario
        </button>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Users className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{users.length}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Usuarios</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <UserCheck className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter(u => u.status === 'active').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Activos</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <UserX className="w-8 h-8 text-orange-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {users.filter(u => u.status === 'inactive').length}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Inactivos</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
          <div className="flex items-center gap-3">
            <Download className="w-8 h-8 text-purple-600" />
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">—</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">Sesiones Hoy</p>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador y filtro por rol */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
            >
              <option value="all">Todos los roles</option>
              <option value="admin">Administrador</option>
              <option value="student">Estudiante</option>
              <option value="researcher">Investigador</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabla de usuarios */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Usuario</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Último Acceso</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Sesiones</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-uvg-green-dark rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                          {u.name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{u.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(u.role)}`}>
                      {u.role === 'admin' ? 'Administrador' : u.role === 'student' ? 'Estudiante' : 'Investigador'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusBadgeColor(u.status)}`}>
                      {u.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{u.lastLogin}</td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">{u.sessionsCount}</td>
                  <td className="px-6 py-4 text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEditModal(u)}
                        className="text-uvg-green-dark hover:text-uvg-green-light"
                        title="Editar usuario"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => requestDelete(u.id)}
                        className="text-red-600 hover:text-red-700"
                        title="Eliminar usuario"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No hay usuarios que coincidan con la búsqueda/filtrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================== */}
      {/* Modal de creación de usuario   */}
      {/* ============================== */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { setShowCreateForm(false); resetCreateForm(); }}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Crear nuevo usuario</h2>
              <button
                onClick={() => { setShowCreateForm(false); resetCreateForm(); }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {createError && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-lg p-3">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={newUser.name}
                  onChange={(e) => handleNewChange('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
                  placeholder="Ej. María López"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email UVG</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => handleNewChange('email', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
                  placeholder="nombre@uvg.edu.gt"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                  <select
                    value={newUser.role}
                    onChange={(e) => handleNewChange('role', e.target.value as NewUserForm['role'])}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
                  >
                    <option value="admin">Administrador</option>
                    <option value="student">Estudiante</option>
                    <option value="researcher">Investigador</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-6 sm:mt-8">
                  <input
                    id="active"
                    type="checkbox"
                    checked={newUser.active}
                    onChange={(e) => handleNewChange('active', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="active" className="text-sm text-gray-700 dark:text-gray-300">Usuario activo</label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña temporal</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => handleNewChange('password', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
                  placeholder="Mínimo 8 caracteres"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowCreateForm(false); resetCreateForm(); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className={`px-4 py-2 rounded-lg text-uvg-green-dark bg-uvg-yellow hover:bg-uvg-yellow/90 transition-colors duration-200 ${creating ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {creating ? 'Creando...' : 'Crear usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================== */}
      {/* Modal de edición de usuario    */}
      {/* ============================== */}
      {showEditForm && editUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => { setShowEditForm(false); setEditUser(null); }}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Editar usuario</h2>
              <button
                onClick={() => { setShowEditForm(false); setEditUser(null); }}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-lg p-3">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre completo</label>
                <input
                  type="text"
                  value={editUser.name}
                  onChange={(e) => handleEditChange('name', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email UVG</label>
                <input
                  type="email"
                  value={editUser.email}
                  onChange={(e) => handleEditChange('email', e.target.value)}
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rol</label>
                  <select
                    value={editUser.role}
                    onChange={(e) => handleEditChange('role', e.target.value as EditUserForm['role'])}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-uvg-green-light focus:border-transparent"
                  >
                    <option value="admin">Administrador</option>
                    <option value="student">Estudiante</option>
                    <option value="researcher">Investigador</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 mt-6 sm:mt-8">
                  <input
                    id="active-edit"
                    type="checkbox"
                    checked={editUser.active}
                    onChange={(e) => handleEditChange('active', e.target.checked)}
                    className="h-4 w-4"
                  />
                  <label htmlFor="active-edit" className="text-sm text-gray-700 dark:text-gray-300">Usuario activo</label>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowEditForm(false); setEditUser(null); }}
                  className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className={`px-4 py-2 rounded-lg text-white bg-uvg-green-dark hover:bg-uvg-green-dark/90 transition-colors duration-200 ${editing ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  {editing ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================== */}
      {/* Modal de confirmación para eliminar */}
      {/* =================================== */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setConfirmDeleteId(null)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-3">
              <AlertTriangle className="w-6 h-6 text-red-600" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Eliminar usuario</h3>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
              Esta acción no se puede deshacer. ¿Seguro que deseas eliminar este usuario?
            </p>
            {deleteError && (
              <div className="mb-4 text-sm text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-lg p-3">
                {deleteError}
              </div>
            )}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className={`px-4 py-2 rounded-lg text-white bg-red-600 hover:bg-red-700 transition-colors duration-200 ${deleting ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
