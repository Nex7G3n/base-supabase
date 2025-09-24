"use client";
import React, { useState, useEffect } from 'react';
import { Search, Download, Settings2, Plus, Shield, Lock, Settings, Clock } from 'lucide-react';
import { ProtectedRoute, ProtectedComponent } from '../../components/ProtectedComponent';
import { usePermissionManagement, useModuleManagement } from '../../common/hooks/useManagement';
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
import { createPermissionColumns } from './columns';
import { Permission, Module } from '../../types/management.types';
import { useToast } from '../../common/hooks/useToast';

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
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    module: true,
    action: true,
    is_active: true,
    created_at: true,
    actions: true
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    byModule: 0,
    recentlyAdded: 0
  });

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

  useEffect(() => {
    loadStats();
  }, [permissions]); // Actualizar stats cuando cambien los permisos

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

  const { toast } = useToast();

  const loadStats = async () => {
    try {
      const totalPermissions = permissions.length;
      const activePermissions = permissions.filter(permission => permission.is_active).length;
      const permissionsByModule = new Set(permissions.map(p => p.module_id)).size;
      const recentPermissions = permissions.filter(permission => {
        const permissionDate = new Date(permission.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return permissionDate > thirtyDaysAgo;
      }).length;

      setStats({
        total: totalPermissions,
        active: activePermissions,
        byModule: permissionsByModule,
        recentlyAdded: recentPermissions
      });
    } catch (error) {
      console.error('Error al cargar estadísticas:', error);
    }
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset a la primera página al buscar
  };

  const toggleColumn = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey as keyof typeof prev]
    }));
  };

  const exportToCSV = () => {
    if (permissions.length === 0) {
      toast({
        title: "Información",
        description: "No hay datos para exportar",
        variant: "info",
      });
      return;
    }

    const headers = ["Nombre", "Módulo", "Acción", "Estado", "Fecha de Registro"];
    const csvContent = [
      headers.join(","),
      ...permissions.map(permission => [
        `"${permission.name}"`,
        `"${permission.module?.name || ""}"`,
        `"${permission.action}"`,
        permission.is_active ? "Activo" : "Inactivo",
        `"${new Date(permission.created_at).toLocaleDateString()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `permisos_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Éxito",
      description: "Archivo CSV descargado correctamente",
      variant: "success",
    });
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

  const allColumns = createPermissionColumns({
    onEdit: (permission: Permission) => setSelectedPermission(permission),
    onDelete: handleDeletePermission,
    onToggleStatus: handleToggleStatus
  });

  // Filtrar columnas basado en visibilidad
  const columns = allColumns.filter(column => {
    const accessorKey = (column as any).accessorKey || (column as any).id;
    if (accessorKey === 'actions') return visibleColumns.actions;
    return visibleColumns[accessorKey as keyof typeof visibleColumns] ?? true;
  });

  if (loading && permissions.length === 0) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ProtectedRoute permissions={['permissions_read']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Permisos</h1>
              <p className="mt-2 text-lg text-gray-600">Administra los permisos y accesos del sistema</p>
            </div>
            <ProtectedComponent permissions={['permissions_create']}>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Permiso
              </Button>
            </ProtectedComponent>
          </div>

          {/* Stats Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-500 rounded-lg text-white mr-4">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
                    <p className="text-sm text-blue-600">Total Permisos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-500 rounded-lg text-white mr-4">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-800">{stats.active}</div>
                    <p className="text-sm text-green-600">Permisos Activos</p>
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
                    <div className="text-2xl font-bold text-purple-800">{stats.byModule}</div>
                    <p className="text-sm text-purple-600">Por Módulo</p>
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
                    <div className="text-2xl font-bold text-orange-800">{stats.recentlyAdded}</div>
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
                      placeholder="Buscar permisos..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

                  <select
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                          {key === 'module' && 'Módulo'}
                          {key === 'action' && 'Acción'}
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
              <CardTitle className="text-xl font-semibold text-gray-900">Lista de Permisos</CardTitle>
              <CardDescription className="text-gray-600">
                Gestiona y administra todos los permisos del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && permissions.length === 0 ? (
                <TableSkeleton rows={5} columns={5} />
              ) : (
                <DataTable
                  columns={columns}
                  data={permissions}
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
      </div>
    </ProtectedRoute>
  );
}
