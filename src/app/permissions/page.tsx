"use client";
import React, { useState, useEffect } from 'react';
import { ProtectedRoute, ProtectedComponent } from '../../components/ProtectedComponent';
import { usePermissionManagement, useModuleManagement } from '../../hooks/useManagement';
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
import { createPermissionColumns } from './columns';
import { Permission, Module } from '../../types/management.types';

export default function PermissionsPage() {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [selectedAction, setSelectedAction] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<Permission | null>(null);

  const { 
    getPermissions, 
    createPermission, 
    updatePermission, 
    deletePermission, 
    togglePermissionStatus,
    getAvailableActions,
    loading, 
    error 
  } = usePermissionManagement();
  
  const { getAllActiveModules } = useModuleManagement();

  const availableActions = getAvailableActions();

  // Cargar permisos cuando cambien los filtros
  useEffect(() => {
    loadPermissions();
  }, [currentPage, searchTerm, selectedModule, selectedAction]);

  // Cargar módulos solo una vez al montar el componente
  useEffect(() => {
    loadModules();
  }, []);

  const loadPermissions = async () => {
    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedModule) filters.module_id = selectedModule;
      if (selectedAction) filters.action = selectedAction;

      const response = await getPermissions(currentPage, 10, filters);
      setPermissions(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error al cargar permisos:', error);
    }
  };

  const loadModules = async () => {
    try {
      const moduleList = await getAllActiveModules();
      setModules(moduleList);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
    }
  };

  const handleCreatePermission = async (formData: FormData) => {
    try {
      const permissionData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        module_id: formData.get('module_id') as string || undefined,
        action: formData.get('action') as 'create' | 'read' | 'update' | 'delete' | 'execute',
        is_active: formData.get('is_active') === 'true'
      };

      const result = await createPermission(permissionData);
      if (result.success) {
        setShowCreateForm(false);
        loadPermissions();
      }
    } catch (error) {
      console.error('Error al crear permiso:', error);
    }
  };

  const handleUpdatePermission = async (formData: FormData) => {
    if (!selectedPermission) return;

    try {
      const permissionData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        module_id: formData.get('module_id') as string || undefined,
        action: formData.get('action') as 'create' | 'read' | 'update' | 'delete' | 'execute',
        is_active: formData.get('is_active') === 'true'
      };

      const result = await updatePermission(selectedPermission.id, permissionData);
      if (result.success) {
        setSelectedPermission(null);
        loadPermissions();
      }
    } catch (error) {
      console.error('Error al actualizar permiso:', error);
    }
  };

  const handleDeletePermission = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este permiso?')) {
      try {
        const result = await deletePermission(id);
        if (result.success) {
          loadPermissions();
        }
      } catch (error) {
        console.error('Error al eliminar permiso:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const result = await togglePermissionStatus(id, !currentStatus);
      if (result.success) {
        loadPermissions();
      }
    } catch (error) {
      console.error('Error al cambiar estado del permiso:', error);
    }
  };

  const columns = createPermissionColumns({
    onEdit: (permission: Permission) => setSelectedPermission(permission),
    onDelete: handleDeletePermission,
    onToggleStatus: handleToggleStatus
  });

  if (loading && permissions.length === 0) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ProtectedRoute permissions={['permissions.read']}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Permisos</h1>
          <ProtectedComponent permissions={['permissions.create']}>
            <Button onClick={() => setShowCreateForm(true)}>
              Crear Permiso
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Input
                placeholder="Buscar permisos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full p-2 border rounded"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
              >
                <option value="">Todos los módulos</option>
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <select
                className="w-full p-2 border rounded"
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
              >
                <option value="">Todas las acciones</option>
                {availableActions.map((action) => (
                  <option key={action.value} value={action.value}>
                    {action.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedModule('');
                  setSelectedAction('');
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabla */}
        {loading && permissions.length === 0 ? (
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <DataTable
            columns={columns}
            data={permissions}
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
              <DialogTitle>Crear Nuevo Permiso</DialogTitle>
              <DialogDescription>
                Completa los datos para crear un nuevo permiso del sistema.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreatePermission}>
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
                  <label htmlFor="module_id" className="text-right text-sm font-medium">
                    Módulo
                  </label>
                  <select name="module_id" className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="">Sin módulo</option>
                    {modules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="action" className="text-right text-sm font-medium">
                    Acción
                  </label>
                  <select name="action" className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" required>
                    <option value="">Seleccionar acción</option>
                    {availableActions.map((action) => (
                      <option key={action.value} value={action.value}>
                        {action.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label className="text-right text-sm font-medium">
                    Estado
                  </label>
                  <div className="col-span-3">
                    <label className="flex items-center">
                      <input type="checkbox" name="is_active" value="true" defaultChecked />
                      <span className="ml-2 text-sm">Activo</span>
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
        <Dialog open={!!selectedPermission} onOpenChange={(open) => !open && setSelectedPermission(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Permiso</DialogTitle>
              <DialogDescription>
                Modifica los datos del permiso seleccionado.
              </DialogDescription>
            </DialogHeader>
            {selectedPermission && (
              <form action={handleUpdatePermission}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-name" className="text-right text-sm font-medium">
                      Nombre
                    </label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={selectedPermission.name}
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
                      defaultValue={selectedPermission.description}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-module_id" className="text-right text-sm font-medium">
                      Módulo
                    </label>
                    <select 
                      name="module_id" 
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      defaultValue={selectedPermission.module_id || ''}
                    >
                      <option value="">Sin módulo</option>
                      {modules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-action" className="text-right text-sm font-medium">
                      Acción
                    </label>
                    <select 
                      name="action" 
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background" 
                      defaultValue={selectedPermission.action}
                      required
                    >
                      <option value="">Seleccionar acción</option>
                      {availableActions.map((action) => (
                        <option key={action.value} value={action.value}>
                          {action.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label className="text-right text-sm font-medium">
                      Estado
                    </label>
                    <div className="col-span-3">
                      <label className="flex items-center">
                        <input 
                          type="checkbox" 
                          name="is_active" 
                          value="true" 
                          defaultChecked={selectedPermission.is_active} 
                        />
                        <span className="ml-2 text-sm">Activo</span>
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
                    onClick={() => setSelectedPermission(null)}
                  >
                    Cancelar
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}
