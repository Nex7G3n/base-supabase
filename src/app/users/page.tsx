"use client";
import React, { useState, useEffect } from 'react';
import { ProtectedRoute, ProtectedComponent, PermissionButton } from '../../components/ProtectedComponent';
import { useUserManagement, useRoleManagement } from '../../hooks/useManagement';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { User, Role } from '../../types/management.types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { getUsers, createUser, updateUser, deleteUser, assignRoles, loading, error } = useUserManagement();
  const { getAllActiveRoles } = useRoleManagement();

  // Cargar datos solo cuando sea necesario
  useEffect(() => {
    let mounted = true;
    
    const loadData = async () => {
      if (!mounted) return;
      
      try {
        await Promise.all([
          loadUsers(),
          loadRoles()
        ]);
      } catch (error) {
        console.error('Error al cargar datos:', error);
      }
    };

    loadData();

    return () => {
      mounted = false;
    };
  }, [currentPage, searchTerm]);

  const loadUsers = async () => {
    try {
      const filters = searchTerm ? { search: searchTerm } : undefined;
      const result = await getUsers(currentPage, 10, filters);
      setUsers(result.data);
      setTotalPages(Math.ceil(result.total / 10));
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
    }
  };

  const loadRoles = async () => {
    try {
      const rolesData = await getAllActiveRoles();
      setRoles(rolesData);
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  };

  const handleCreateUser = async (userData: any) => {
    try {
      const response = await createUser(userData);
      if (response.success) {
        setShowCreateForm(false);
        loadUsers();
      }
    } catch (error) {
      console.error('Error al crear usuario:', error);
    }
  };

  const handleUpdateUser = async (userId: string, userData: any) => {
    try {
      const response = await updateUser(userId, userData);
      if (response.success) {
        setSelectedUser(null);
        loadUsers();
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      try {
        const response = await deleteUser(userId);
        if (response.success) {
          loadUsers();
        }
      } catch (error) {
        console.error('Error al eliminar usuario:', error);
      }
    }
  };

  return (
    <ProtectedRoute permissions={['users_read']}>
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Usuarios</h2>
              <p className="text-gray-600">Gestiona los usuarios del sistema</p>
            </div>
            <ProtectedComponent permissions={['users_create']}>
              <Button 
                onClick={() => setShowCreateForm(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Crear Usuario
              </Button>
            </ProtectedComponent>
          </div>
        </div>

        {/* Búsqueda */}
        <div className="mb-6">
          <div className="max-w-md">
            <Input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Lista de usuarios */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="bg-white shadow-sm rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Lista de Usuarios ({users.length})
              </h3>
            </div>
            
            <div className="divide-y divide-gray-200">
              {users.length === 0 ? (
                <div className="px-6 py-8 text-center">
                  <p className="text-gray-500">No se encontraron usuarios</p>
                </div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <span className="text-sm font-medium text-gray-700">
                            {user.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                          <div className="text-xs text-gray-400">
                            {user.user_roles?.map(ur => ur.role?.name).join(', ') || 'Sin rol'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          user.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                        
                        <ProtectedComponent permissions={['users_update']}>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedUser(user)}
                          >
                            Editar
                          </Button>
                        </ProtectedComponent>
                        
                        <ProtectedComponent permissions={['users_delete']}>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
                          >
                            Eliminar
                          </Button>
                        </ProtectedComponent>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              
              <span className="px-4 py-2 text-sm text-gray-700">
                Página {currentPage} de {totalPages}
              </span>
              
              <Button
                variant="outline"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Siguiente
              </Button>
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
