"use client";
import React from 'react';
import { ProtectedRoute } from '../../components/ProtectedComponent';
import { useAuthState } from '../../auth';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import Link from 'next/link';

export default function DashboardPage() {
  const { user } = useAuthState();
  
  return (
    <ProtectedRoute permissions={['dashboard_read']}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            ¡Bienvenido, {user?.first_name || user?.email?.split('@')[0]}!
          </h2>
          <p className="text-gray-600">
            Este es tu panel de control principal
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Tarjeta de usuarios */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Usuarios</h3>
                <p className="text-sm text-gray-600">Gestionar usuarios del sistema</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/users">
                <Button className="w-full">
                  Ver Usuarios
                </Button>
              </Link>
            </div>
          </Card>

          {/* Tarjeta de configuración */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
                <p className="text-sm text-gray-600">Ajustes del sistema</p>
              </div>
            </div>
            <div className="mt-4">
              <Button variant="outline" className="w-full">
                Configurar
              </Button>
            </div>
          </Card>

          {/* Tarjeta de permisos */}
          <Card className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-purple-100 text-purple-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Permisos</h3>
                <p className="text-sm text-gray-600">Ver ejemplo de permisos</p>
              </div>
            </div>
            <div className="mt-4">
              <Link href="/example-permissions">
                <Button variant="outline" className="w-full">
                  Ver Ejemplo
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Información adicional */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Información de la Cuenta
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Nombre</label>
              <p className="mt-1 text-sm text-gray-900">
                {user?.first_name || 'No especificado'} {user?.last_name || ''}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Estado</label>
              <p className="mt-1 text-sm text-green-600">Activo</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Último acceso</label>
              <p className="mt-1 text-sm text-gray-900">
                {user?.last_login ? new Date(user.last_login).toLocaleString() : 'No disponible'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
