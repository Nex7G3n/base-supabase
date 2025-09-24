"use client";

import React, { useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedComponent';
import { useAuthState } from '../../auth';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { User, Shield, Settings, Bell, Database, Monitor, Palette, Globe } from 'lucide-react';
import { useToast } from '../../common/hooks/useToast';

export default function SettingsPage() {
  const { user } = useAuthState();
  const { toast } = useToast();
  
  // Estados para las configuraciones
  const [profileData, setProfileData] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
    phone: ''
  });
  
  const [systemPreferences, setSystemPreferences] = useState({
    theme: 'light',
    language: 'es',
    timezone: 'America/Lima',
    notifications: true
  });

  // Stats para las cards
  const stats = {
    totalUsers: 125,
    activeConnections: 3,
    systemHealth: 98,
    dataBackup: 'Actualizado'
  };

  // Handlers
  const handleProfileSave = () => {
    toast({
      title: "Perfil actualizado",
      description: "Los cambios han sido guardados correctamente",
      variant: "success"
    });
  };

  const handleSystemSave = () => {
    toast({
      title: "Configuración guardada",
      description: "Las preferencias del sistema han sido actualizadas",
      variant: "success"
    });
  };

  return (
    <ProtectedRoute permissions={['settings_read']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Configuración</h1>
              <p className="mt-2 text-lg text-gray-600">Gestiona tu perfil, seguridad y preferencias del sistema</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="bg-white">
                <Settings className="w-4 h-4 mr-2" />
                Exportar Config
              </Button>
              <Button className="bg-blue-600 hover:bg-blue-700">
                Aplicar Cambios
              </Button>
            </div>
          </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-500 rounded-lg text-white mr-4">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-800">
                    {user?.first_name || user?.email?.split('@')[0] || 'Usuario'}
                  </div>
                  <p className="text-sm text-blue-600">Usuario Actual</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-500 rounded-lg text-white mr-4">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-800">Activo</div>
                  <p className="text-sm text-green-600">Estado de Cuenta</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-purple-500 rounded-lg text-white mr-4">
                  <Settings className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-800">{user?.role || 'Usuario'}</div>
                  <p className="text-sm text-purple-600">Rol del Sistema</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 bg-orange-500 rounded-lg text-white mr-4">
                  <Bell className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-800">Activas</div>
                  <p className="text-sm text-orange-600">Notificaciones</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Profile Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Perfil de Usuario
            </CardTitle>
            <CardDescription>
              Información básica de tu cuenta
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="bg-gray-50"
                />
                <p className="text-xs text-gray-500 mt-1">El email no se puede modificar</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <Input
                  type="text"
                  value={user?.first_name || ''}
                  placeholder="Tu nombre"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido
                </label>
                <Input
                  type="text"
                  value={user?.last_name || ''}
                  placeholder="Tu apellido"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <div className="flex items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Activo
                  </span>
                </div>
              </div>
            </div>
            <div className="flex justify-end">
              <Button 
                onClick={handleProfileSave}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Guardar Cambios
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Security Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Seguridad
            </CardTitle>
            <CardDescription>
              Configuración de seguridad y contraseña
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña Actual
                </label>
                <Input type="password" placeholder="Ingresa tu contraseña actual" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nueva Contraseña
                </label>
                <Input type="password" placeholder="Ingresa tu nueva contraseña" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Nueva Contraseña
                </label>
                <Input type="password" placeholder="Confirma tu nueva contraseña" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button className="bg-red-600 hover:bg-red-700">
                Actualizar Contraseña
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Preferencias
            </CardTitle>
            <CardDescription>
              Configuración de la interfaz y comportamiento
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Tema oscuro</h4>
                <p className="text-sm text-gray-500">Cambiar apariencia del sistema</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Sonidos del sistema</h4>
                <p className="text-sm text-gray-500">Reproducir sonidos para notificaciones</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        {/* Notifications Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notificaciones
            </CardTitle>
            <CardDescription>
              Gestiona tus preferencias de notificaciones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Notificaciones por email</h4>
                <p className="text-sm text-gray-500">Recibir actualizaciones importantes por correo</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-medium text-gray-900">Notificaciones push</h4>
                <p className="text-sm text-gray-500">Notificaciones en tiempo real en el navegador</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>
        
        </div>
      </div>
    </ProtectedRoute>
  );
}
