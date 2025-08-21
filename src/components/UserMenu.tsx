"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useAuthSimple } from '../auth/application/hooks/useAuthSimple';
import { User, Settings, LogOut, ChevronDown } from 'lucide-react';

export default function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, logout, getUserName, getUserInitials } = useAuthSimple();

  // Cerrar el menú cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      setIsOpen(false);
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Botón del usuario */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {/* Avatar */}
        <div className="relative">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt="Avatar"
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center border-2 border-gray-200">
              <span className="text-white text-sm font-medium">
                {getUserInitials()}
              </span>
            </div>
          )}
        </div>

        {/* Información del usuario (solo en desktop) */}
        <div className="hidden md:flex flex-col items-start">
          <span className="text-sm font-medium text-gray-900">
            {getUserName()}
          </span>
          <span className="text-xs text-gray-500">
            {user?.email}
          </span>
        </div>

        {/* Icono de flecha */}
        <ChevronDown 
          className={`w-4 h-4 text-gray-400 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`} 
        />
      </button>

      {/* Menú desplegable */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* Información del usuario en móvil */}
          <div className="md:hidden px-4 py-3 border-b border-gray-100">
            <div className="flex items-center space-x-3">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getUserInitials()}
                  </span>
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {getUserName()}
                </div>
                <div className="text-xs text-gray-500">
                  {user?.email}
                </div>
              </div>
            </div>
          </div>

          {/* Opciones del menú */}
          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <User className="w-4 h-4 mr-3 text-gray-400" />
              Mi Perfil
            </Link>

            <Link
              href="/settings"
              className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4 mr-3 text-gray-400" />
              Configuración
            </Link>

            <div className="border-t border-gray-100 my-1"></div>

            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
