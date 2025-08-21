"use client";

import React from 'react';
import { useAuthSimple } from '@/auth/application/hooks/useAuthSimple';

export default function ExamplePage() {
  const {
    user,
    loading,
    permissions,
    modules,
    accessibleModules,
    permissionsLoaded,
    hasPermission,
    hasRole,
    hasAnyRole,
    isAdmin,
    isSuperAdmin,
    getUserName,
    getUserInitials,
    debug
  } = useAuthSimple();

  if (loading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Cargando...</h1>
        <div className="bg-yellow-50 rounded-lg p-4">
          <h3 className="font-medium text-yellow-800">Debug Info:</h3>
          <pre className="text-xs mt-2 text-yellow-700">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Sistema de Permisos - Versión Simplificada
        </h1>
        
        {/* Información del usuario */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-2">
            Información del Usuario
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div><span className="font-medium">Email:</span> {user?.email}</div>
            <div><span className="font-medium">Nombre:</span> {getUserName()}</div>
            <div><span className="font-medium">Iniciales:</span> {getUserInitials()}</div>
            <div>
              <span className="font-medium">Es Admin:</span> 
              <span className={`ml-2 px-2 py-1 rounded ${isAdmin() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isAdmin() ? 'Sí' : 'No'}
              </span>
            </div>
            <div>
              <span className="font-medium">Es Super Admin:</span> 
              <span className={`ml-2 px-2 py-1 rounded ${isSuperAdmin() ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {isSuperAdmin() ? 'Sí' : 'No'}
              </span>
            </div>
          </div>
        </div>

        {/* Estado de permisos */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Estado de Permisos</h2>
          <div className="text-sm text-gray-600">
            <span className={`px-2 py-1 rounded ${permissionsLoaded ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              {permissionsLoaded ? 'Permisos Cargados' : 'Permisos No Cargados'}
            </span>
            <span className="ml-4">Total permisos: {permissions.length}</span>
            <span className="ml-4">Módulos: {modules.length}</span>
            <span className="ml-4">Módulos accesibles: {accessibleModules.length}</span>
          </div>
        </div>

        {/* Roles del usuario */}
        {user?.roles && user.roles.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-purple-900 mb-2">Roles del Usuario</h2>
            <div className="flex flex-wrap gap-2">
              {user.roles.map(role => (
                <span key={role.id} className="px-3 py-1 bg-purple-200 text-purple-800 rounded-full text-sm">
                  {role.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Verificaciones de permisos específicos */}
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-green-900 mb-2">Verificaciones de Permisos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <PermissionCheck permission="users.create" hasPermission={hasPermission('users.create')} />
            <PermissionCheck permission="users.read" hasPermission={hasPermission('users.read')} />
            <PermissionCheck permission="users.update" hasPermission={hasPermission('users.update')} />
            <PermissionCheck permission="users.delete" hasPermission={hasPermission('users.delete')} />
            <PermissionCheck permission="dashboard.read" hasPermission={hasPermission('dashboard.read')} />
            <PermissionCheck permission="reports.read" hasPermission={hasPermission('reports.read')} />
          </div>
        </div>

        {/* Verificaciones de roles */}
        <div className="bg-yellow-50 rounded-lg p-4 mb-6">
          <h2 className="text-lg font-semibold text-yellow-900 mb-2">Verificaciones de Roles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <RoleCheck role="admin" hasRole={hasRole('admin')} />
            <RoleCheck role="user" hasRole={hasRole('user')} />
            <RoleCheck role="manager" hasRole={hasRole('manager')} />
            <RoleCheck role="super_admin" hasRole={hasRole('super_admin')} />
          </div>
        </div>

        {/* Lista de permisos */}
        {permissions.length > 0 && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Todos los Permisos ({permissions.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {permissions.map(permission => (
                <span key={permission} className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs">
                  {permission}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Información de debug */}
        <div className="bg-orange-50 rounded-lg p-4">
          <h2 className="text-lg font-semibold text-orange-900 mb-2">Debug Information</h2>
          <pre className="text-xs bg-white p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(debug, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

// Componente para mostrar verificación de permisos
interface PermissionCheckProps {
  permission: string;
  hasPermission: boolean;
}

const PermissionCheck: React.FC<PermissionCheckProps> = ({ permission, hasPermission }) => (
  <div className="flex items-center">
    <span className={`w-3 h-3 rounded-full mr-2 ${hasPermission ? 'bg-green-500' : 'bg-red-500'}`}></span>
    <span className="font-medium">{permission}:</span>
    <span className={`ml-1 ${hasPermission ? 'text-green-600' : 'text-red-600'}`}>
      {hasPermission ? 'Permitido' : 'Denegado'}
    </span>
  </div>
);

// Componente para mostrar verificación de roles
interface RoleCheckProps {
  role: string;
  hasRole: boolean;
}

const RoleCheck: React.FC<RoleCheckProps> = ({ role, hasRole }) => (
  <div className="flex items-center">
    <span className={`w-3 h-3 rounded-full mr-2 ${hasRole ? 'bg-blue-500' : 'bg-gray-400'}`}></span>
    <span className="font-medium">{role}:</span>
    <span className={`ml-1 ${hasRole ? 'text-blue-600' : 'text-gray-600'}`}>
      {hasRole ? 'Asignado' : 'No asignado'}
    </span>
  </div>
);
