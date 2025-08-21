"use client";

import React, { useState, useEffect } from 'react';
import { useAuthSimple } from '../auth/application/hooks/useAuthSimple';
import { PageSkeleton } from './ui/skeleton';
import Sidebar from '../common/components/Sidebar';

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

  // Log para debugging
  useEffect(() => {
    console.log('🔄 ConditionalLayout - Estado:', {
      user: !!user,
      loading,
      isInitialized,
      isAuthenticated,
      debug
    });
  }, [user, loading, isInitialized, isAuthenticated, debug]);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  // Mostrar skeleton mientras se inicializa
  if (!isInitialized || loading) {
    return <PageSkeleton isAuthenticated={isAuthenticated} />;
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
            <div className="flex items-center space-x-4">
              <div className="hidden md:flex items-center text-sm text-gray-600">
                <span>Hola, {getUserName()}</span>
              </div>
              
              {/* Avatar del usuario */}
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {getUserInitials()}
                </span>
              </div>
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
      '/config/roles': 'Roles',
      '/config/permissions': 'Permisos',
      '/config/modules': 'Módulos',
      '/example-permissions': 'Ejemplo de Permisos',
    };
    
    return titleMap[path] || 'Dashboard';
  }
};

export default ConditionalLayout;
