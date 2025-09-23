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
      <div className="page-container">
        <div className="content-wrapper">
          {/* Header */}
          <div className="page-header">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="page-title">Gestión de Usuarios</h1>
                <p className="page-description">Administra los usuarios del sistema y sus permisos</p>
              </div>
              <ProtectedComponent permissions={['users_create']}>
                <Button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-blue-600 hover:bg-blue-700 px-6 py-3 text-base font-medium"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Crear Usuario
                </Button>
              </ProtectedComponent>
            </div>
          </div>

          {/* Contenido principal */}
          {loading ? (
            <div className="loading-container">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-500">Cargando usuarios...</p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden">
              {loading && users.length === 0 ? (
                <TableSkeleton rows={5} columns={6} />
              ) : (
                <DataTable
                  columns={columns}
                  data={users}
                  searchKey="email"
                  searchPlaceholder="Buscar por email, nombre o apellido..."
                />
              )}
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
      </div>
    </ProtectedRoute>
  );
}
