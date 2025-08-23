"use client";

import React from 'react';

export default function DebugPage() {
  // Importar stores directamente para debugging
  const authStore = React.useMemo(() => {
    try {
      const { useAuthStore } = require('@/auth');
      return useAuthStore.getState();
    } catch (error: any) {
      return { error: error?.message || 'Error desconocido' };
    }
  }, []);

  const permissionsStore = React.useMemo(() => {
    try {
      const { usePermissionsStore } = require('@/auth');
      return usePermissionsStore.getState();
    } catch (error: any) {
      return { error: error?.message || 'Error desconocido' };
    }
  }, []);

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Debug - Estado de Stores</h1>
      
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Auth Store</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(authStore, null, 2)}
        </pre>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Permissions Store</h2>
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {JSON.stringify(permissionsStore, null, 2)}
        </pre>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold mb-4">localStorage</h2>
        <div className="space-y-2">
          <div>
            <strong>auth-storage:</strong>
            <pre className="bg-gray-100 p-2 rounded text-xs mt-1">
              {localStorage.getItem('auth-storage') || 'No data'}
            </pre>
          </div>
          <div>
            <strong>permissions-storage:</strong>
            <pre className="bg-gray-100 p-2 rounded text-xs mt-1">
              {localStorage.getItem('permissions-storage') || 'No data'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
