"use client";
import React, { useState, useEffect } from 'react';
import { ProtectedRoute, ProtectedComponent, PermissionButton } from '../../components/ProtectedComponent';
import { useUserManagement, useRoleManagement } from '../../common/hooks/useManagement';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { DataTable } from '../../components/ui/data-table';
import { TableSkeleton } from '../../components/ui/skeleton';
import { UserForm } from '../../components/forms/UserForm';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { createUserColumns } from './columns';
import { User, Role } from '../../types/management.types';

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const { getUsers, createUser, updateUser, deleteUser, assignRoles, loading, error } = useUserManagement();
  const { getAllActiveRoles } = useRoleManagement();

  // Cargar usuarios cuando cambie la página o búsqueda
  useEffect(() => {
    loadUsers();
  }, [currentPage, searchTerm]);

  // Cargar roles solo una vez al montar el componente
  useEffect(() => {
    loadRoles();
  }, []);

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
        // Si hay roles seleccionados, asignarlos
        if (userData.role_ids && userData.role_ids.length > 0 && response.data?.id) {
          await assignRoles(response.data.id, userData.role_ids);
        }
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
        // Si hay roles seleccionados, asignarlos
        if (userData.role_ids) {
          await assignRoles(userId, userData.role_ids);
        }
      }
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setUserToDelete(user);
    }
  };

  const confirmDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      const response = await deleteUser(userToDelete.id);
      if (response.success) {
        loadUsers();
        setUserToDelete(null);
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
    }
  };

  // Crear las columnas de la tabla
  const columns = createUserColumns({
    onEdit: (user: User) => setSelectedUser(user),
    onDelete: handleDeleteUser
  });

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

        {/* Búsqueda y tabla de usuarios */}
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
            <div className="p-6">
              {loading && users.length === 0 ? (
                <TableSkeleton rows={5} columns={6} />
              ) : (
                <DataTable
                  columns={columns}
                  data={users}
                  searchKey="email"
                  searchPlaceholder="Buscar por email..."
                />
              )}
            </div>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Formulario de crear usuario */}
        {showCreateForm && (
          <UserForm
            roles={roles}
            onSubmit={handleCreateUser}
            onCancel={() => setShowCreateForm(false)}
            loading={loading}
            open={showCreateForm}
          />
        )}

        {/* Formulario de editar usuario */}
        {selectedUser && (
          <UserForm
            user={selectedUser}
            roles={roles}
            onSubmit={(userData) => handleUpdateUser(selectedUser.id, userData)}
            onCancel={() => setSelectedUser(null)}
            loading={loading}
            open={!!selectedUser}
          />
        )}

        {/* Dialog de confirmación para eliminar */}
        {userToDelete && (
          <ConfirmDialog
            open={!!userToDelete}
            title="Eliminar Usuario"
            description={`¿Estás seguro de que quieres eliminar al usuario "${userToDelete.first_name} ${userToDelete.last_name}" (${userToDelete.email})? Esta acción no se puede deshacer.`}
            confirmText="Eliminar"
            cancelText="Cancelar"
            variant="destructive"
            onConfirm={confirmDeleteUser}
            onCancel={() => setUserToDelete(null)}
            loading={loading}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}
