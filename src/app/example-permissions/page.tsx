import React from 'react';
import { ProtectedComponent, useAuthState, useAuthActions } from '@/auth';
import { usePermissions } from '@/hooks/useManagement';

export default function ExamplePage() {
  const { user } = useAuthState();
  const { hasPermission, hasRole, hasAnyRole } = useAuthActions();
  const { 
    permissions,
    loading,
    hasPermission: hasUserPermission,
    isAdmin,
    isSuperAdmin 
  } = usePermissions();

  if (!user || loading) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Panel de Control</h1>
      
      {/* Información del usuario */}
      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-xl font-semibold mb-2">Información del Usuario</h2>
        <p><strong>Nombre:</strong> {user.first_name} {user.last_name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Roles:</strong> {user.roles?.map(role => role.name).join(', ') || 'Sin roles'}</p>
        <p><strong>Es Admin:</strong> {isAdmin() ? 'Sí' : 'No'}</p>
        <p><strong>Es Super Admin:</strong> {isSuperAdmin() ? 'Sí' : 'No'}</p>
      </div>

      {/* Acceso condicional con componente ProtectedComponent */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Panel de Administración - Solo para admins */}
        <ProtectedComponent adminOnly fallback={
          <div className="bg-gray-100 p-4 rounded-lg">
            <p>No tienes permisos para ver este panel</p>
          </div>
        }>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Panel de Administración</h3>
            <p>Contenido exclusivo para administradores</p>
          </div>
        </ProtectedComponent>

        {/* Gestión de Usuarios - Permiso específico */}
        <ProtectedComponent 
          permission="users.manage"
          fallback={
            <div className="bg-gray-100 p-4 rounded-lg">
              <p>No puedes gestionar usuarios</p>
            </div>
          }
        >
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Gestión de Usuarios</h3>
            <p>Crear, editar y eliminar usuarios</p>
          </div>
        </ProtectedComponent>

        {/* Reportes - Múltiples roles */}
        <ProtectedComponent 
          roles={['admin', 'manager']}
          fallback={
            <div className="bg-gray-100 p-4 rounded-lg">
              <p>No puedes ver reportes</p>
            </div>
          }
        >
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Reportes</h3>
            <p>Ver estadísticas y reportes del sistema</p>
          </div>
        </ProtectedComponent>

        {/* Super Admin - Solo super administradores */}
        <ProtectedComponent superAdminOnly>
          <div className="bg-red-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Super Admin</h3>
            <p>Configuración avanzada del sistema</p>
          </div>
        </ProtectedComponent>

        {/* Contenido Básico - Todos los usuarios autenticados */}
        <div className="bg-purple-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold mb-2">Mi Perfil</h3>
          <p>Editar información personal</p>
        </div>

        {/* Acceso condicional con hook */}
        {hasUserPermission('users_create') && (
          <div className="bg-indigo-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Panel de Usuarios</h3>
            <p>Gestión avanzada de usuarios (usando hook)</p>
          </div>
        )}
      </div>

      {/* Lista de permisos del usuario actual */}
      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Mis Permisos</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {permissions.map((permission) => (
            <span 
              key={permission} 
              className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
            >
              {permission}
            </span>
          ))}
        </div>
        {permissions.length === 0 && (
          <p className="text-gray-500">No tienes permisos específicos asignados</p>
        )}
      </div>

      {/* Ejemplos de verificaciones */}
      <div className="mt-8 bg-white p-4 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Verificaciones de Ejemplo</h2>
        <ul className="space-y-2">
          <li>✅ Puede acceder al dashboard: {hasUserPermission('dashboard_read') ? 'Sí' : 'No'}</li>
          <li>✅ Puede gestionar usuarios: {hasUserPermission('users_create') ? 'Sí' : 'No'}</li>
          <li>✅ Tiene rol 'admin': {hasRole('admin') ? 'Sí' : 'No'}</li>
          <li>✅ Tiene permiso 'users_create': {hasUserPermission('users_create') ? 'Sí' : 'No'}</li>
          <li>✅ Es administrador: {isAdmin() ? 'Sí' : 'No'}</li>
        </ul>
      </div>
    </div>
  );
}
