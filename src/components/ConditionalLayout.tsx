"use client";

import React, { useState, useEffect } from 'react';
import { useAuthSimple } from '../auth/application/hooks/useAuthSimple';
import Sidebar from '../common/components/Sidebar';
import UserMenu from './UserMenu';

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

const ConditionalLayout: React.FC<ConditionalLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Usar el hook simplificado de autenticación que maneja todo
  const { 
    user, 
    loading, 
    isInitialized, 
    isAuthenticated,
    getUserName,
    getUserInitials,
    debug
  } = useAuthSimple();

  // Log para debugging (solo cambios importantes)
  useEffect(() => {
    if (!isInitialized && !loading) {
      console.log('🔄 ConditionalLayout - Inicializando...');
    } else if (isInitialized && !loading) {
      console.log('🔄 ConditionalLayout - Inicializado:', {
        user: !!user,
        isAuthenticated
      });
    }
  }, [isInitialized, loading, user, isAuthenticated]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Mostrar skeleton mientras se inicializa
  if (!isInitialized || loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="animate-pulse">
          <div className="bg-white shadow">
            <div className="h-16 bg-gray-200" />
          </div>
          <div className="flex">
            <div className="w-64 h-screen bg-gray-200" />
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-1/2" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Si no está autenticado, renderizar sin layout
  if (!isAuthenticated) {
    return <>{children}</>;
  }

  // Si está autenticado, renderizar con sidebar
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
          <div className="flex items-center justify-between px-4 py-4">
            {/* Botón de menú para móvil */}
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Título dinámico */}
            <div className="flex-1 lg:ml-4">
              <h1 className="text-xl font-semibold text-gray-900">
                {getPageTitle()}
              </h1>
            </div>

            {/* Información del usuario */}
            <div className="flex items-center">
              <UserMenu />
            </div>
          </div>
        </header>

        {/* Contenido de la página */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );

  function getPageTitle(): string {
    if (typeof window === 'undefined') return 'Dashboard';
    
    const path = window.location.pathname;
    const titleMap: Record<string, string> = {
      '/': 'Inicio',
      '/dashboard': 'Dashboard',
      '/users': 'Usuarios',
      '/profile': 'Mi Perfil',
      '/config/roles': 'Roles',
      '/config/permissions': 'Permisos',
      '/config/modules': 'Módulos',
      '/example-permissions': 'Ejemplo de Permisos',
    };
    
    return titleMap[path] || 'Dashboard';
  }
};

export default ConditionalLayout;
