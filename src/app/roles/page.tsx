"use client";
import React, { useState, useEffect } from 'react';
import { ProtectedRoute, ProtectedComponent } from '../../components/ProtectedComponent';
import { useRoleManagement, usePermissionManagement } from '../../hooks/useManagement';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { DataTable } from '../../components/ui/data-table';
import { TableSkeleton } from '../../components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { createRoleColumns } from './columns';
import { Role, Permission } from '../../types/management.types';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  const { 
    getRoles, 
    createRole, 
    updateRole, 
    deleteRole, 
    toggleRoleStatus,
    getRolePermissions,
    assignPermissionsToRole,
    loading, 
    error 
  } = useRoleManagement();
  
  const { getAllActivePermissions } = usePermissionManagement();

  // Separar efectos para evitar múltiples cargas
  useEffect(() => {
    loadRoles();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    loadPermissions();
  }, []); // Solo cargar permisos una vez al montar el componente

  const loadRoles = async () => {
    try {
      const filters = searchTerm ? { search: searchTerm } : undefined;
      const response = await getRoles(currentPage, 10, filters);
      setRoles(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error al cargar roles:', error);
    }
  };

  const loadPermissions = async () => {
    try {
      const perms = await getAllActivePermissions();
      setPermissions(perms);
    } catch (error) {
      console.error('Error al cargar permisos:', error);
    }
  };

  const handleCreateRole = async (formData: FormData) => {
    try {
      const roleData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        is_active: formData.get('is_active') === 'true',
        is_default: formData.get('is_default') === 'true'
      };

      const result = await createRole(roleData);
      if (result.success) {
        setShowCreateForm(false);
        loadRoles();
      }
    } catch (error) {
      console.error('Error al crear rol:', error);
    }
  };

  const handleUpdateRole = async (formData: FormData) => {
    if (!selectedRole) return;

    try {
      const roleData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        is_active: formData.get('is_active') === 'true',
        is_default: formData.get('is_default') === 'true'
      };

      const result = await updateRole(selectedRole.id, roleData);
      if (result.success) {
        setSelectedRole(null);
        loadRoles();
      }
    } catch (error) {
      console.error('Error al actualizar rol:', error);
    }
  };

  const handleDeleteRole = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este rol?')) {
      try {
        const result = await deleteRole(id);
        if (result.success) {
          loadRoles();
        }
      } catch (error) {
        console.error('Error al eliminar rol:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const result = await toggleRoleStatus(id, !currentStatus);
      if (result.success) {
        loadRoles();
      }
    } catch (error) {
      console.error('Error al cambiar estado del rol:', error);
    }
  };

  const handleManagePermissions = async (role: Role) => {
    setSelectedRole(role);
    setShowPermissions(true);
  };

  const handleAssignPermissions = async (permissionIds: string[]) => {
    if (!selectedRole) return;

    try {
      const result = await assignPermissionsToRole(selectedRole.id, permissionIds);
      if (result.success) {
        setShowPermissions(false);
        setSelectedRole(null);
      }
    } catch (error) {
      console.error('Error al asignar permisos:', error);
    }
  };

  const columns = createRoleColumns({
    onEdit: (role: Role) => setSelectedRole(role),
    onDelete: handleDeleteRole,
    onToggleStatus: handleToggleStatus,
    onManagePermissions: handleManagePermissions
  });

  if (loading && roles.length === 0) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ProtectedRoute permissions={['roles_read']}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Roles</h1>
          <ProtectedComponent permissions={['roles_create']}>
            <Button onClick={() => setShowCreateForm(true)}>
              Crear Rol
            </Button>
          </ProtectedComponent>
        </div>

        {error && (
          <Card className="p-4 mb-4 bg-red-50 border-red-200">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {/* Filtros */}
        <Card className="p-4 mb-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder="Buscar roles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </Card>

        {/* Tabla */}
        {loading && roles.length === 0 ? (
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <DataTable
            columns={columns}
            data={roles}
          />
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1 || loading}
            >
              Anterior
            </Button>
            <span className="flex items-center px-4">
              Página {currentPage} de {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages || loading}
            >
              Siguiente
            </Button>
          </div>
        )}

        {/* Modal de creación */}
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Crear Nuevo Rol</DialogTitle>
              <DialogDescription>
                Completa los datos para crear un nuevo rol del sistema.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateRole}>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="name" className="text-right text-sm font-medium">
                    Nombre
                  </label>
                  <Input
                    id="name"
                    name="name"
                    className="col-span-3"
                    required
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="description" className="text-right text-sm font-medium">
                    Descripción
                  </label>
                  <Input
                    id="description"
                    name="description"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium">
                    Opciones
                  </label>
                  <div className="col-span-3 space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" name="is_active" value="true" defaultChecked />
                      <span className="ml-2 text-sm">Activo</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" name="is_default" value="true" />
                      <span className="ml-2 text-sm">Por defecto</span>
                    </label>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={loading}>
                  Crear
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setShowCreateForm(false)}
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Modal de edición */}
        <Dialog open={!!selectedRole && !showPermissions} onOpenChange={(open) => !open && setSelectedRole(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Rol</DialogTitle>
              <DialogDescription>
                Modifica los datos del rol seleccionado.
              </DialogDescription>
            </DialogHeader>
            {selectedRole && (
              <form action={handleUpdateRole}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-name" className="text-right text-sm font-medium">
                      Nombre
                    </label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={selectedRole.name}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-description" className="text-right text-sm font-medium">
                      Descripción
                    </label>
                    <Input
                      id="edit-description"
                      name="description"
                      defaultValue={selectedRole.description}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">
                      Opciones
                    </label>
                    <div className="col-span-3 space-y-2">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          name="is_active" 
                          value="true" 
                          defaultChecked={selectedRole.is_active} 
                        />
                        <span className="ml-2 text-sm">Activo</span>
                      </label>
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          name="is_default" 
                          value="true" 
                          defaultChecked={selectedRole.is_default} 
                        />
                        <span className="ml-2 text-sm">Por defecto</span>
                      </label>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={loading}>
                    Actualizar
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setSelectedRole(null)}
                  >
                    Cancelar
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* Modal de gestión de permisos */}
        <Dialog open={showPermissions} onOpenChange={(open) => {
          if (!open) {
            setShowPermissions(false);
            setSelectedRole(null);
          }
        }}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                Gestionar Permisos - {selectedRole?.name}
              </DialogTitle>
              <DialogDescription>
                Selecciona los permisos que se asignarán a este rol.
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-96 overflow-y-auto py-4">
              <div className="space-y-2">
                {permissions.map((permission) => (
                  <label key={permission.id} className="flex items-start p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      value={permission.id}
                      className="mt-1 mr-3"
                    />
                    <div className="flex-1">
                      <span className="font-medium">{permission.name}</span>
                      {permission.description && (
                        <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">
                        Módulo: {permission.module?.name || 'Sin módulo'} | Acción: {permission.action}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button 
                onClick={() => {
                  const checkedPermissions = Array.from(
                    document.querySelectorAll('input[type="checkbox"]:checked')
                  ).map((input: any) => input.value);
                  handleAssignPermissions(checkedPermissions);
                }}
                disabled={loading}
              >
                Asignar Permisos
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setShowPermissions(false);
                  setSelectedRole(null);
                }}
              >
                Cancelar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
