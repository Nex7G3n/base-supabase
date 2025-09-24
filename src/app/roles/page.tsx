"use client";
import React, { useState, useEffect } from 'react';
import { Search, Download, Settings2, Plus, Shield, Users, Settings, Clock } from 'lucide-react';
import { ProtectedRoute, ProtectedComponent } from '../../components/ProtectedComponent';
import { useRoleManagement, usePermissionManagement } from '../../common/hooks/useManagement';
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
} from '../../components/ui/dropdown-menu';
import { createRoleColumns } from './columns';
import { Role, Permission } from '../../types/management.types';
import { useToast } from '../../common/hooks/useToast';

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    is_active: true,
    is_default: true,
    created_at: true,
    actions: true
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    default: 0,
    recentlyAdded: 0
  });

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
    loadStats();
  }, [currentPage, searchTerm]);

  useEffect(() => {
    loadPermissions();
  }, []); // Solo cargar permisos una vez al montar el componente

  useEffect(() => {
    loadStats();
  }, [roles]); // Actualizar stats cuando cambien los roles

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

  const { toast } = useToast();

  const loadStats = async () => {
    try {
      const totalRoles = roles.length;
      const activeRoles = roles.filter(role => role.is_active).length;
      const defaultRoles = roles.filter(role => role.is_default).length;
      const recentRoles = roles.filter(role => {
        const roleDate = new Date(role.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return roleDate > thirtyDaysAgo;
      }).length;

      setStats({
        total: totalRoles,
        active: activeRoles,
        default: defaultRoles,
        recentlyAdded: recentRoles
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
    if (roles.length === 0) {
      toast({
        title: "Información",
        description: "No hay datos para exportar",
        variant: "info",
      });
      return;
    }

    const headers = ["Nombre", "Descripción", "Estado", "Por Defecto", "Fecha de Registro"];
    const csvContent = [
      headers.join(","),
      ...roles.map(role => [
        `"${role.name}"`,
        `"${role.description || ""}"`,
        role.is_active ? "Activo" : "Inactivo",
        role.is_default ? "Sí" : "No",
        `"${new Date(role.created_at).toLocaleDateString()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `roles_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Éxito",
      description: "Archivo CSV descargado correctamente",
      variant: "success",
    });
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

  // Crear columnas con filtrado por visibilidad
  const allColumns = createRoleColumns({
    onEdit: (role: Role) => setSelectedRole(role),
    onDelete: handleDeleteRole,
    onToggleStatus: handleToggleStatus,
    onManagePermissions: handleManagePermissions
  });
  const columns = allColumns.filter(column => {
    const accessorKey = (column as any).accessorKey || (column as any).id;
    if (accessorKey === 'actions') return visibleColumns.actions;
    return visibleColumns[accessorKey as keyof typeof visibleColumns] ?? true;
  });

  if (loading && roles.length === 0) {
    return <div className="flex justify-center items-center h-64">Cargando...</div>;
  }

  return (
    <ProtectedRoute permissions={['roles_read']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Roles</h1>
              <p className="mt-2 text-lg text-gray-600">Administra los roles y permisos del sistema</p>
            </div>
            <ProtectedComponent permissions={['roles_create']}>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Rol
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
                    <p className="text-sm text-blue-600">Total Roles</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-500 rounded-lg text-white mr-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-800">{stats.active}</div>
                    <p className="text-sm text-green-600">Roles Activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-500 rounded-lg text-white mr-4">
                    <Settings className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-800">{stats.default}</div>
                    <p className="text-sm text-orange-600">Roles por Defecto</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-500 rounded-lg text-white mr-4">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-800">{stats.recentlyAdded}</div>
                    <p className="text-sm text-purple-600">Últimos 30 días</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters Section - FUERA DE LA CARD */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Barra de búsqueda */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar roles por nombre..."
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            
            {/* Botones de acción */}
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2"
                  >
                    <Settings2 className="h-4 w-4" />
                    Columnas
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.name}
                    onCheckedChange={() => toggleColumn('name')}
                  >
                    Nombre
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.is_active}
                    onCheckedChange={() => toggleColumn('is_active')}
                  >
                    Estado
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.is_default}
                    onCheckedChange={() => toggleColumn('is_default')}
                  >
                    Por Defecto
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.created_at}
                    onCheckedChange={() => toggleColumn('created_at')}
                  >
                    Fecha de Registro
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.actions}
                    onCheckedChange={() => toggleColumn('actions')}
                  >
                    Acciones
                  </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Exportar
              </Button>
            </div>
          </div>

          {/* Table Section - DENTRO DE CARD */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Roles</CardTitle>
              <CardDescription>
                Visualiza y administra todos los roles del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && roles.length === 0 ? (
                <TableSkeleton rows={5} columns={5} />
              ) : (
                <DataTable
                  columns={columns}
                  data={roles}
                />
              )}
            </CardContent>
          </Card>

          {/* Error display */}
          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <p className="text-sm text-red-600">{error}</p>
              </CardContent>
            </Card>
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
      </div>
    </ProtectedRoute>
  );
}
