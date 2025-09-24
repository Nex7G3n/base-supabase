"use client";
import React, { useState, useEffect } from 'react';
import { Search, Download, Settings2, Plus, Users, Mail, Phone, Shield, Clock } from 'lucide-react';
import { ProtectedRoute, ProtectedComponent } from '../../components/ProtectedComponent';
import { SupplierManagementService } from '../../services/management/suppliers.service';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { DataTable } from '../../components/ui/data-table';
import { TableSkeleton } from '../../components/ui/skeleton';
import { SupplierForm } from '../../components/forms/SupplierForm';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { createSupplierColumns } from './columns';
import { Supplier } from '../../types/management.types';
import { useToast } from '../../common/hooks/useToast';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    name: true,
    contact_person: true,
    email: true,
    phone: true,
    is_active: true,
    created_at: true,
    actions: true
  });
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    withEmail: 0,
    recentlyAdded: 0
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSuppliers();
    loadStats();
  }, [currentPage]);

  useEffect(() => {
    loadSuppliers();
  }, [searchTerm]);

  const loadSuppliers = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await SupplierManagementService.getSuppliers(currentPage, 10);
      setSuppliers(result.data);
      setTotalPages(result.totalPages);
      
      // Actualizar stats después de cargar suppliers
      setTimeout(() => {
        loadStats();
      }, 100);
    } catch (err) {
      setError('Error al cargar proveedores');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const totalSuppliers = suppliers.length;
      const activeSuppliers = suppliers.filter(supplier => supplier.is_active).length;
      const suppliersWithEmail = suppliers.filter(supplier => supplier.email).length;
      const recentSuppliers = suppliers.filter(supplier => {
        const supplierDate = new Date(supplier.created_at);
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        return supplierDate > thirtyDaysAgo;
      }).length;

      setStats({
        total: totalSuppliers,
        active: activeSuppliers,
        withEmail: suppliersWithEmail,
        recentlyAdded: recentSuppliers
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
    if (suppliers.length === 0) {
      toast({
        title: "Información",
        description: "No hay datos para exportar",
        variant: "info",
      });
      return;
    }

    const headers = ["Nombre", "Contacto", "Email", "Teléfono", "Estado", "Fecha de Registro"];
    const csvContent = [
      headers.join(","),
      ...suppliers.map(supplier => [
        `"${supplier.name}"`,
        `"${supplier.contact_person || ""}"`,
        `"${supplier.email || ""}"`,
        `"${supplier.phone || ""}"`,
        supplier.is_active ? "Activo" : "Inactivo",
        `"${new Date(supplier.created_at).toLocaleDateString()}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `proveedores_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast({
      title: "Éxito",
      description: "Archivo CSV descargado correctamente",
      variant: "success",
    });
  };

  const handleCreateSupplier = async (supplierData: any) => {
    setLoading(true);
    try {
      const response = await SupplierManagementService.createSupplier(supplierData);
      if (response.success) {
        setShowCreateForm(false);
        loadSuppliers();
        toast({
          title: "Éxito",
          description: "Proveedor creado exitosamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al crear proveedor",
          variant: "error",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al crear proveedor",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSupplier = async (supplierId: string, supplierData: any) => {
    setLoading(true);
    try {
      const response = await SupplierManagementService.updateSupplier(supplierId, supplierData);
      if (response.success) {
        setSelectedSupplier(null);
        loadSuppliers();
        toast({
          title: "Éxito",
          description: "Proveedor actualizado exitosamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al actualizar proveedor",
          variant: "error",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al actualizar proveedor",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
  };

  const confirmDeleteSupplier = async () => {
    if (!supplierToDelete) return;
    setLoading(true);
    try {
      const response = await SupplierManagementService.deleteSupplier(supplierToDelete.id);
      if (response.success) {
        loadSuppliers();
        setSupplierToDelete(null);
        toast({
          title: "Éxito",
          description: "Proveedor eliminado exitosamente",
          variant: "success",
        });
      } else {
        toast({
          title: "Error",
          description: response.error || "Error al eliminar proveedor",
          variant: "error",
        });
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error al eliminar proveedor",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Crear columnas con filtrado por visibilidad
  const allColumns = createSupplierColumns({
    onEdit: (supplier: Supplier) => setSelectedSupplier(supplier),
    onDelete: handleDeleteSupplier
  });
  const columns = allColumns.filter(column => {
    const accessorKey = (column as any).accessorKey || (column as any).id;
    if (accessorKey === 'actions') return visibleColumns.actions;
    return visibleColumns[accessorKey as keyof typeof visibleColumns] ?? true;
  });

  return (
    <ProtectedRoute permissions={['suppliers_read']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Proveedores</h1>
              <p className="mt-2 text-lg text-gray-600">Administra los proveedores del sistema</p>
            </div>
            <ProtectedComponent permissions={['suppliers_create']}>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Proveedor
              </Button>
            </ProtectedComponent>
          </div>

          {/* Stats Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-500 rounded-lg text-white mr-4">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
                    <p className="text-sm text-blue-600">Total Proveedores</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-green-500 rounded-lg text-white mr-4">
                    <Shield className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-800">{stats.active}</div>
                    <p className="text-sm text-green-600">Proveedores Activos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-orange-500 rounded-lg text-white mr-4">
                    <Mail className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-orange-800">{stats.withEmail}</div>
                    <p className="text-sm text-orange-600">Con Email</p>
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
                  placeholder="Buscar proveedores por nombre o contacto..."
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
                    checked={visibleColumns.contact_person}
                    onCheckedChange={() => toggleColumn('contact_person')}
                  >
                    Contacto
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.email}
                    onCheckedChange={() => toggleColumn('email')}
                  >
                    Email
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.phone}
                    onCheckedChange={() => toggleColumn('phone')}
                  >
                    Teléfono
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={visibleColumns.is_active}
                    onCheckedChange={() => toggleColumn('is_active')}
                  >
                    Estado
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
              <CardTitle>Lista de Proveedores</CardTitle>
              <CardDescription>
                Visualiza y administra todos los proveedores registrados en el sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && suppliers.length === 0 ? (
                <TableSkeleton rows={5} columns={6} />
              ) : (
                <DataTable
                  columns={columns}
                  data={suppliers}
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

        {showCreateForm && (
          <SupplierForm
            onSubmit={handleCreateSupplier}
            onCancel={() => setShowCreateForm(false)}
            loading={loading}
            open={showCreateForm}
          />
        )}

        {selectedSupplier && (
          <SupplierForm
            supplier={selectedSupplier}
            onSubmit={(data) => handleUpdateSupplier(selectedSupplier.id, data)}
            onCancel={() => setSelectedSupplier(null)}
            loading={loading}
            open={!!selectedSupplier}
          />
        )}

        {supplierToDelete && (
          <ConfirmDialog
            open={!!supplierToDelete}
            title="Eliminar Proveedor"
            description={`¿Estás seguro de que quieres eliminar al proveedor "${supplierToDelete.name}"?`}
            onConfirm={confirmDeleteSupplier}
            onCancel={() => setSupplierToDelete(null)}
            loading={loading}
          />
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
