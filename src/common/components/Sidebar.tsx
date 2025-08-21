"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  HomeIcon,
  UserGroupIcon,
  CogIcon,
  DocumentTextIcon,
  ChartBarIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useAuthState } from '../../auth';
import { ModuleManagementService } from '../../services/management/modules.service';
import { Module } from '../../auth/domain/types/auth.interfaces';

interface SidebarProps {
  isOpen: boolean;
  onClose?: () => void;
}

interface ModuleItemProps {
  module: Module;
  level: number;
  isActive: boolean;
  onItemClick?: () => void;
}

// Mapeo de iconos por nombre de módulo
const moduleIcons: Record<string, React.ComponentType<any>> = {
  'dashboard': HomeIcon,
  'usuarios': UserGroupIcon,
  'user': UserGroupIcon,
  'users': UserGroupIcon,
  'perfil': UserIcon,
  'profile': UserIcon,
  'configuracion': CogIcon,
  'config': CogIcon,
  'settings': CogIcon,
  'reportes': ChartBarIcon,
  'reports': ChartBarIcon,
  'documentos': DocumentTextIcon,
  'documents': DocumentTextIcon,
  'empresa': BuildingOfficeIcon,
  'company': BuildingOfficeIcon,
  'organizacion': BuildingOfficeIcon,
};

const ModuleItem: React.FC<ModuleItemProps> = ({ module, level, isActive, onItemClick }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const hasChildren = module.children && module.children.length > 0;

  // Obtener el icono apropiado
  const IconComponent = moduleIcons[module.name.toLowerCase()] ||
    moduleIcons[module.icon?.toLowerCase() || ''] ||
    DocumentTextIcon;

  const handleClick = () => {
    if (hasChildren) {
      setIsExpanded(!isExpanded);
    } else if (module.path) {
      onItemClick?.();
    }
  };

  const paddingLeft = `${(level * 16) + 16}px`;

  return (
    <div>
      {module.path && !hasChildren ? (
        <Link
          href={module.path}
          className={`
            flex items-center w-full px-4 py-3 text-sm font-medium text-left transition-colors duration-200
            ${isActive
              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-600'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }
          `}
          style={{ paddingLeft }}
          onClick={onItemClick}
        >
          <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="flex-1">{module.name}</span>
        </Link>
      ) : (
        <button
          onClick={handleClick}
          className={`
            flex items-center w-full px-4 py-3 text-sm font-medium text-left transition-colors duration-200
            ${isActive
              ? 'bg-blue-50 text-blue-700'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
            }
          `}
          style={{ paddingLeft }}
        >
          <IconComponent className="w-5 h-5 mr-3 flex-shrink-0" />
          <span className="flex-1">{module.name}</span>
          {hasChildren && (
            <div className="ml-2">
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </div>
          )}
        </button>
      )}

      {hasChildren && isExpanded && (
        <div className="bg-gray-25">
          {module.children?.map((child) => (
            <ModuleItem
              key={child.id}
              module={child}
              level={level + 1}
              isActive={isActive}
              onItemClick={onItemClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, isInitialized } = useAuthState();
  const pathname = usePathname();
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  useEffect(() => {
    // Solo cargar módulos si el usuario cambió y la autenticación está inicializada
    if (isInitialized && user?.id !== lastUserId) {
      loadUserModules();
    }
  }, [user, isInitialized, lastUserId]);

  const loadUserModules = async () => {
    if (!user) {
      setModules([]);
      setLoading(false);
      setLastUserId(null);
      return;
    }

    // Evitar cargar si ya tenemos los módulos para este usuario
    if (user.id === lastUserId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Intentar obtener módulos del usuario con permisos
      let userModules = await ModuleManagementService.getUserAccessibleModules(user.id);

      // Si no hay módulos específicos, obtener módulos básicos
      if (userModules.length === 0) {
        console.log('No se encontraron módulos con permisos, cargando módulos básicos...');
        userModules = await ModuleManagementService.getModulesTree();

        // Si tampoco hay módulos en la BD, crear módulos por defecto
        if (userModules.length === 0) {
          userModules = getDefaultModules();
        }
      }

      setModules(userModules);
      setLastUserId(user.id);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
      // En caso de error, usar módulos por defecto
      setModules(getDefaultModules());
      setLastUserId(user.id);
    } finally {
      setLoading(false);
    }
  };

  const getDefaultModules = (): Module[] => {
    return [
      {
        id: 'dashboard',
        name: 'Dashboard',
        description: 'Panel principal',
        path: '/dashboard',
        icon: 'dashboard',
        is_active: true,
        sort_order: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'profile',
        name: 'Mi Perfil',
        description: 'Configuración de perfil',
        path: '/profile',
        icon: 'profile',
        is_active: true,
        sort_order: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 'users',
        name: 'Usuarios',
        description: 'Gestión de usuarios',
        path: '/users',
        icon: 'users',
        is_active: true,
        sort_order: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
  };

  const isModuleActive = (module: Module): boolean => {
    if (module.path && pathname === module.path) {
      return true;
    }

    // Verificar si algún hijo está activo
    if (module.children) {
      return module.children.some(child => isModuleActive(child));
    }

    return false;
  };

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0 lg:static lg:inset-0
      `}>
        {/* Header del sidebar */}
        <div className="flex items-center justify-between h-16 px-4 bg-white border-b border-gray-200">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">A</span>
            </div>
            <span className="ml-2 text-lg font-semibold text-gray-900">App</span>
          </div>

          {/* Botón cerrar para móvil */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Contenido del sidebar */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <nav className="mt-4">
              {modules.map((module) => (
                <ModuleItem
                  key={module.id}
                  module={module}
                  level={0}
                  isActive={isModuleActive(module)}
                  onItemClick={onClose}
                />
              ))}
            </nav>
          )}
        </div>

        {/* Footer del sidebar */}
        <div className="p-4 border-t border-gray-200">
          <Link href="/profile" className="flex items-center p-2 rounded-md hover:bg-gray-50 transition-colors duration-200">
            <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <span className="text-gray-600 text-sm font-medium">
                  {user?.first_name?.[0] || user?.email?.[0] || 'U'}
                </span>
              )}
            </div>
            <div className="ml-3 flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user?.first_name || user?.email?.split('@')[0] || 'Usuario'}
              </p>
              <p className="text-xs text-gray-500 truncate">
                Ver perfil
              </p>
            </div>
          </Link>

          <Link
            href="/logout"
            className="mt-3 w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-gray-50 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors duration-200"
          >
            Cerrar Sesión
          </Link>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
