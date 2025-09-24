"use client";
import React, { useState, useEffect } from 'react';
import { ProtectedRoute, ProtectedComponent } from '../../components/ProtectedComponent';
import { useModuleManagement } from '../../common/hooks/useManagement';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
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
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import { Search, Download, Settings2, Plus, Layers, Package, Settings, Clock } from 'lucide-react';
import { createModuleColumns } from './columns';
import { Module } from '../../types/management.types';
import { useToast } from '../../common/hooks/useToast';

export default function ModulesPage() {
  const [modules, setModules] = useState<Module[]>([]);
  const [parentModules, setParentModules] = useState<Module[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParent, setSelectedParent] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  
  // Standard pattern state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    name: true,
    parent_id: true,
    sort_order: true,
    is_active: true,
    created_at: true,
    actions: true
  });
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    parent: 0,
    recent: 0
  });

  const { toast } = useToast();

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

  // Utility functions
  const loadStats = async () => {
    try {
      const allModules = await getModules(1, 1000, '');
      const totalModules = allModules.data?.length || 0;
      const activeModules = allModules.data?.filter(m => m.is_active)?.length || 0;
      const parentModules = allModules.data?.filter(m => !m.parent_id)?.length || 0;
      const today = new Date();
      const thirtyDaysAgo = new Date(today.getTime() - (30 * 24 * 60 * 60 * 1000));
      const recentModules = allModules.data?.filter(m => 
        new Date(m.created_at) >= thirtyDaysAgo
      )?.length || 0;

      setStats({
        total: totalModules,
        active: activeModules,
        parent: parentModules,
        recent: recentModules
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const exportToCSV = () => {
    if (modules.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay módulos para exportar",
        variant: "error"
      });
      return;
    }

    const headers = ['Nombre', 'Descripción', 'Módulo Padre', 'Estado', 'Fecha Creación'];
    const csvData = modules.map(module => [
      module.name,
      module.description || '',
      parentModules.find(p => p.id === module.parent_id)?.name || 'Sin padre',
      module.is_active ? 'Activo' : 'Inactivo',
      new Date(module.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `modulos_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportación exitosa",
      description: "Los módulos han sido exportados a CSV",
      variant: "default"
    });
  };

  // Cargar módulos cuando cambien los filtros
  useEffect(() => {
    loadModules();
  }, [currentPage, searchTerm, selectedParent]);

  // Cargar módulos padre solo una vez al montar el componente
  useEffect(() => {
    loadParentModules();
    loadStats();
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

  const allColumns = createModuleColumns({
    onEdit: (module: Module) => setSelectedModule(module),
    onDelete: handleDeleteModule,
    onToggleStatus: handleToggleStatus
  });

  // Filtrar columnas basado en visibilidad
  const columns = allColumns.filter(column => {
    const accessorKey = (column as any).accessorKey || (column as any).id;
    if (accessorKey === 'actions') return visibleColumns.actions;
    return visibleColumns[accessorKey as keyof typeof visibleColumns] ?? true;
  });

  if (loading && modules.length === 0) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ProtectedRoute permissions={['modules_read']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Módulos</h1>
              <p className="mt-2 text-lg text-gray-600">Administra los módulos del sistema y su jerarquía</p>
            </div>
            <ProtectedComponent permissions={['modules_create']}>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Módulo
              </Button>
            </ProtectedComponent>
          </div>

          {/* Stats Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-500 rounded-lg text-white mr-4">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
                    <p className="text-sm text-blue-600">Total Módulos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-500 rounded-lg text-white mr-4">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-800">{stats.active}</div>
                    <p className="text-sm text-green-600">Módulos Activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-500 rounded-lg text-white mr-4">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-800">{stats.parent}</div>
                    <p className="text-sm text-purple-600">Módulos Padre</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-500 rounded-lg text-white mr-4">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-800">{stats.recent}</div>
                    <p className="text-sm text-orange-600">Recientes</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters and Actions */}
          <Card className="shadow-sm">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <Input
                      placeholder="Buscar módulos..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="whitespace-nowrap">
                        <Settings2 className="w-4 h-4 mr-2" />
                        Columnas
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[200px]">
                      <DropdownMenuLabel>Columnas visibles</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {Object.entries(visibleColumns).map(([key, value]) => (
                        <DropdownMenuCheckboxItem
                          key={key}
                          className="capitalize"
                          checked={value}
                          onCheckedChange={(checked) => toggleColumn(key)}
                        >
                          {key === 'name' && 'Nombre'}
                          {key === 'parent_id' && 'Módulo Padre'}
                          {key === 'sort_order' && 'Orden'}
                          {key === 'is_active' && 'Estado'}
                          {key === 'created_at' && 'Fecha Creación'}
                          {key === 'actions' && 'Acciones'}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    variant="outline"
                    onClick={() => exportToCSV()}
                    className="whitespace-nowrap"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-red-600">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Data Table */}
          <Card className="shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">Lista de Módulos</CardTitle>
              <CardDescription className="text-gray-600">
                Gestiona y administra todos los módulos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && modules.length === 0 ? (
                <TableSkeleton rows={5} columns={6} />
              ) : (
                <DataTable
                  columns={columns}
                  data={modules}
                />
              )}
            </CardContent>
          </Card>

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
      </div>
    </ProtectedRoute>
  );
}
