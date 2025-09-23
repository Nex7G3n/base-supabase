"use client";

import React, { useState } from 'react';
import { ProtectedRoute } from '../../components/ProtectedComponent';
import { useAuthState } from '../../auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

export default function SettingsPage() {
  const { user } = useAuthState();
  const [activeTab, setActiveTab] = useState('profile');

  const tabs = [
    { id: 'profile', name: 'Perfil', icon: 'user' },
    { id: 'security', name: 'Seguridad', icon: 'shield' },
    { id: 'preferences', name: 'Preferencias', icon: 'settings' },
    { id: 'notifications', name: 'Notificaciones', icon: 'bell' }
  ];

  return (
    <ProtectedRoute permissions={['settings_read']}>
      <div className="page-container">
        <div className="content-wrapper">
          <div className="page-header">
            <div>
              <h1 className="page-title">Configuración</h1>
              <p className="page-description">
                Gestiona tu perfil, seguridad y preferencias del sistema
              </p>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar de navegación */}
            <div className="lg:w-64">
              <div className="base-card">
                <nav className="space-y-2">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors ${
                        activeTab === tab.id
                          ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-500'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {tab.icon === 'user' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        )}
                        {tab.icon === 'shield' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        )}
                        {tab.icon === 'settings' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        )}
                        {tab.icon === 'bell' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4.797-5.876l-.002-.015A2 2 0 0012 5c0-.598-.265-1.172-.726-1.566A2 2 0 0010 3H8.5a2 2 0 00-2 2v0c0 .898.374 1.75 1.037 2.35A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        )}
                      </svg>
                      {tab.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Contenido principal */}
            <div className="flex-1">
              {activeTab === 'profile' && (
                <div className="base-card">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-blue-100 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Información del Perfil</h3>
                      <p className="text-sm text-gray-500">Actualiza tu información personal</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
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
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 8 8">
                              <circle cx={4} cy={4} r={3} />
                            </svg>
                            Activo
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <Button className="bg-blue-600 hover:bg-blue-700">
                        Guardar Cambios
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'security' && (
                <div className="base-card">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-red-100 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Seguridad</h3>
                      <p className="text-sm text-gray-500">Gestiona tu contraseña y seguridad</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Cambiar Contraseña</h4>
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
                    </div>
                    <div className="flex justify-end">
                      <Button className="bg-red-600 hover:bg-red-700">
                        Actualizar Contraseña
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'preferences' && (
                <div className="base-card">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Preferencias</h3>
                      <p className="text-sm text-gray-500">Personaliza tu experiencia en el sistema</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
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
                  </div>
                </div>
              )}

              {activeTab === 'notifications' && (
                <div className="base-card">
                  <div className="flex items-center mb-6">
                    <div className="p-2 bg-yellow-100 rounded-lg mr-3">
                      <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4.797-5.876l-.002-.015A2 2 0 0012 5c0-.598-.265-1.172-.726-1.566A2 2 0 0010 3H8.5a2 2 0 00-2 2v0c0 .898.374 1.75 1.037 2.35A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                      <p className="text-sm text-gray-500">Configura cómo recibir las notificaciones</p>
                    </div>
                  </div>
                  
                  <div className="space-y-6">
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
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
