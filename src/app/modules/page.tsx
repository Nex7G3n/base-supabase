"use client";
import React, { useState, useEffect } from 'react';
import { ProtectedRoute, ProtectedComponent } from '../../components/ProtectedComponent';
import { useModuleManagement } from '../../common/hooks/useManagement';
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
import { createModuleColumns } from './columns';
import { Module } from '../../types/management.types';

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [parentModules, setParentModules] = useState<Module[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);

  const { 
    getModules, 
    createModule, 
    updateModule, 
    deleteModule, 
    toggleModuleStatus,
    getAllActiveModules,
    reorderModules,
    loading, 
    error 
  } = useModuleManagement();

  // Cargar módulos cuando cambien los filtros
  useEffect(() => {
    loadModules();
  }, [currentPage, searchTerm, selectedParent]);

  // Cargar módulos padre solo una vez al montar el componente
  useEffect(() => {
    loadParentModules();
  }, []);

  const loadModules = async () => {
    try {
      const filters: any = {};
      if (searchTerm) filters.search = searchTerm;
      if (selectedParent) filters.parent_id = selectedParent;

      const response = await getModules(currentPage, 10, filters);
      setModules(response.data);
      setTotalPages(response.totalPages);
    } catch (error) {
      console.error('Error al cargar módulos:', error);
    }
  };

  const loadParentModules = async () => {
    try {
      const moduleList = await getAllActiveModules();
      // Filtrar solo módulos padre (sin parent_id)
      const parents = moduleList.filter(m => !m.parent_id);
      setParentModules(parents);
    } catch (error) {
      console.error('Error al cargar módulos padre:', error);
    }
  };

  const handleCreateModule = async (formData: FormData) => {
    try {
      const moduleData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        path: formData.get('path') as string || undefined,
        icon: formData.get('icon') as string || undefined,
        parent_id: formData.get('parent_id') as string || undefined,
        sort_order: parseInt(formData.get('sort_order') as string) || undefined,
        is_active: formData.get('is_active') === 'true'
      };

      const result = await createModule(moduleData);
      if (result.success) {
        setShowCreateForm(false);
        loadModules();
      }
    } catch (error) {
      console.error('Error al crear módulo:', error);
    }
  };

  const handleUpdateModule = async (formData: FormData) => {
    if (!selectedModule) return;

    try {
      const moduleData = {
        name: formData.get('name') as string,
        description: formData.get('description') as string,
        path: formData.get('path') as string || undefined,
        icon: formData.get('icon') as string || undefined,
        parent_id: formData.get('parent_id') as string || undefined,
        sort_order: parseInt(formData.get('sort_order') as string) || undefined,
        is_active: formData.get('is_active') === 'true'
      };

      const result = await updateModule(selectedModule.id, moduleData);
      if (result.success) {
        setSelectedModule(null);
        loadModules();
      }
    } catch (error) {
      console.error('Error al actualizar módulo:', error);
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este módulo?')) {
      try {
        const result = await deleteModule(id);
        if (result.success) {
          loadModules();
        }
      } catch (error) {
        console.error('Error al eliminar módulo:', error);
      }
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    try {
      const result = await toggleModuleStatus(id, !currentStatus);
      if (result.success) {
        loadModules();
      }
    } catch (error) {
      console.error('Error al cambiar estado del módulo:', error);
    }
  };

  const columns = createModuleColumns({
    onEdit: (module: Module) => setSelectedModule(module),
    onDelete: handleDeleteModule,
    onToggleStatus: handleToggleStatus
  });

  if (loading && modules.length === 0) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ProtectedRoute permissions={['modules_read']}>
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Gestión de Módulos</h1>
          <ProtectedComponent permissions={['modules_create']}>
            <Button onClick={() => setShowCreateForm(true)}>
              Crear Módulo
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Input
                placeholder="Buscar módulos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <select
                className="w-full p-2 border rounded"
                value={selectedParent}
                onChange={(e) => setSelectedParent(e.target.value)}
              >
                <option value="">Todos los módulos</option>
                <option value="null">Solo módulos padre</option>
                {parentModules.map((module) => (
                  <option key={module.id} value={module.id}>
                    Hijos de: {module.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedParent('');
                }}
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </Card>

        {/* Tabla */}
        {loading && modules.length === 0 ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <DataTable
            columns={columns}
            data={modules}
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
              <DialogTitle>Crear Nuevo Módulo</DialogTitle>
              <DialogDescription>
                Completa los datos para crear un nuevo módulo del sistema.
              </DialogDescription>
            </DialogHeader>
            <form action={handleCreateModule}>
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
                  <label htmlFor="path" className="text-right text-sm font-medium">
                    Ruta
                  </label>
                  <Input
                    id="path"
                    name="path"
                    placeholder="/ruta/del/modulo"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="icon" className="text-right text-sm font-medium">
                    Icono
                  </label>
                  <Input
                    id="icon"
                    name="icon"
                    placeholder="icon-name"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="parent_id" className="text-right text-sm font-medium">
                    Módulo Padre
                  </label>
                  <select name="parent_id" className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
                    <option value="">Sin módulo padre</option>
                    {parentModules.map((module) => (
                      <option key={module.id} value={module.id}>
                        {module.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <label htmlFor="sort_order" className="text-right text-sm font-medium">
                    Orden
                  </label>
                  <Input
                    id="sort_order"
                    name="sort_order"
                    type="number"
                    placeholder="1"
                    min="1"
                    className="col-span-3"
                  />
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
        <Dialog open={!!selectedModule} onOpenChange={(open) => !open && setSelectedModule(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Editar Módulo</DialogTitle>
              <DialogDescription>
                Modifica los datos del módulo seleccionado.
              </DialogDescription>
            </DialogHeader>
            {selectedModule && (
              <form action={handleUpdateModule}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-name" className="text-right text-sm font-medium">
                      Nombre
                    </label>
                    <Input
                      id="edit-name"
                      name="name"
                      defaultValue={selectedModule.name}
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
                      defaultValue={selectedModule.description}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-path" className="text-right text-sm font-medium">
                      Ruta
                    </label>
                    <Input
                      id="edit-path"
                      name="path"
                      defaultValue={selectedModule.path}
                      placeholder="/ruta/del/modulo"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-icon" className="text-right text-sm font-medium">
                      Icono
                    </label>
                    <Input
                      id="edit-icon"
                      name="icon"
                      defaultValue={selectedModule.icon}
                      placeholder="icon-name"
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-parent_id" className="text-right text-sm font-medium">
                      Módulo Padre
                    </label>
                    <select 
                      name="parent_id" 
                      className="col-span-3 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                      defaultValue={selectedModule.parent_id || ''}
                    >
                      <option value="">Sin módulo padre</option>
                      {parentModules.map((module) => (
                        <option key={module.id} value={module.id}>
                          {module.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <label htmlFor="edit-sort_order" className="text-right text-sm font-medium">
                      Orden
                    </label>
                    <Input
                      id="edit-sort_order"
                      name="sort_order"
                      type="number"
                      defaultValue={selectedModule.sort_order}
                      min="1"
                      className="col-span-3"
                    />
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
                          defaultChecked={selectedModule.is_active} 
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
                    onClick={() => setSelectedModule(null)}
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
