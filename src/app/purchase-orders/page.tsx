"use client";
import React, { useState, useEffect } from 'react';
import { ProtectedRoute, ProtectedComponent } from '../../components/ProtectedComponent';
import { PurchaseOrderManagementService } from '../../services/management/purchase-orders.service';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { DataTable } from '../../components/ui/data-table';
import { TableSkeleton } from '../../components/ui/skeleton';
import { PurchaseOrderForm } from '../../components/forms/PurchaseOrderForm';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from '../../components/ui/dropdown-menu';
import { Search, Download, Settings2, Plus, ShoppingCart, Package, DollarSign, Clock } from 'lucide-react';
import { createPurchaseOrderColumns } from './columns';
import { PurchaseOrder } from '../../types/management.types';
import { useToast } from '../../common/hooks/useToast';

export default function PurchaseOrdersPage() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<PurchaseOrder | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Standard pattern state
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    order_number: true,
    'supplier.name': true,
    order_date: true,
    total_amount: true,
    status: true,
    actions: true
  });
  
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    amount: 0
  });

  const { success, error: showError, toast } = useToast();

  // Utility functions
  const loadStats = async () => {
    try {
      const allOrders = await PurchaseOrderManagementService.getPurchaseOrders(1, 1000);
      const totalOrders = allOrders.data?.length || 0;
      const pendingOrders = allOrders.data?.filter(o => o.status === 'pending')?.length || 0;
      const approvedOrders = allOrders.data?.filter(o => o.status === 'approved')?.length || 0;
      const totalAmount = allOrders.data?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0;

      setStats({
        total: totalOrders,
        pending: pendingOrders,
        approved: approvedOrders,
        amount: totalAmount
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
    if (purchaseOrders.length === 0) {
      toast({
        title: "No hay datos",
        description: "No hay órdenes de compra para exportar",
        variant: "error"
      });
      return;
    }

    const headers = ['Número Orden', 'Proveedor', 'Total', 'Estado', 'Fecha Orden', 'Fecha Creación'];
    const csvData = purchaseOrders.map(order => [
      order.order_number,
      order.supplier?.name || 'Sin proveedor',
      order.total_amount?.toString() || '0',
      order.status,
      new Date(order.order_date).toLocaleDateString(),
      new Date(order.created_at).toLocaleDateString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ordenes_compra_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Exportación exitosa",
      description: "Las órdenes de compra han sido exportadas a CSV",
      variant: "default"
    });
  };

  useEffect(() => {
    loadPurchaseOrders();
    loadStats();
  }, [currentPage]);

  const loadPurchaseOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await PurchaseOrderManagementService.getPurchaseOrders(currentPage, 10);
      setPurchaseOrders(result.data);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError('Error al cargar órdenes de compra');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrder = async (orderData: any) => {
    setLoading(true);
    try {
      const response = await PurchaseOrderManagementService.createPurchaseOrder(orderData);
      if (response.success) {
        setShowCreateForm(false);
        loadPurchaseOrders();
        success('Orden de compra creada exitosamente');
      } else {
        showError(response.error || 'Error al crear orden de compra');
      }
    } catch (err) {
      showError('Error al crear orden de compra');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateOrder = async (orderId: string, orderData: any) => {
    setLoading(true);
    try {
      const response = await PurchaseOrderManagementService.updatePurchaseOrder(orderId, orderData);
      if (response.success) {
        setSelectedOrder(null);
        loadPurchaseOrders();
        success('Orden de compra actualizada exitosamente');
      } else {
        showError(response.error || 'Error al actualizar orden de compra');
      }
    } catch (err) {
      showError('Error al actualizar orden de compra');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = (order: PurchaseOrder) => {
    setOrderToDelete(order);
  };

  const confirmDeleteOrder = async () => {
    if (!orderToDelete) return;
    setLoading(true);
    try {
      const response = await PurchaseOrderManagementService.deletePurchaseOrder(orderToDelete.id);
      if (response.success) {
        loadPurchaseOrders();
        setOrderToDelete(null);
        success('Orden de compra eliminada exitosamente');
      } else {
        showError(response.error || 'Error al eliminar orden de compra');
      }
    } catch (err) {
      showError('Error al eliminar orden de compra');
    } finally {
      setLoading(false);
    }
  };

  const allColumns = createPurchaseOrderColumns({
    onEdit: (order: PurchaseOrder) => setSelectedOrder(order),
    onDelete: handleDeleteOrder
  });

  // Filtrar columnas basado en visibilidad
  const columns = allColumns.filter(column => {
    const accessorKey = (column as any).accessorKey || (column as any).id;
    if (accessorKey === 'actions') return visibleColumns.actions;
    // Manejar accessorKeys anidados
    if (visibleColumns[accessorKey]) return visibleColumns[accessorKey];
    return visibleColumns[accessorKey as keyof typeof visibleColumns] ?? true;
  });

  return (
    <ProtectedRoute permissions={['purchase_orders_read']}>
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Órdenes de Compra</h1>
              <p className="mt-2 text-lg text-gray-600">Gestiona las órdenes de compra a proveedores</p>
            </div>
            <ProtectedComponent permissions={['purchase_orders_create']}>
              <Button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 sm:mt-0 bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Crear Orden
              </Button>
            </ProtectedComponent>
          </div>

          {/* Stats Section */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-500 rounded-lg text-white mr-4">
                    <ShoppingCart className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-800">{stats.total}</div>
                    <p className="text-sm text-blue-600">Total Órdenes</p>
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
                    <div className="text-2xl font-bold text-orange-800">{stats.pending}</div>
                    <p className="text-sm text-orange-600">Pendientes</p>
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
                    <div className="text-2xl font-bold text-green-800">{stats.approved}</div>
                    <p className="text-sm text-green-600">Aprobadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-500 rounded-lg text-white mr-4">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-800">${stats.amount.toLocaleString()}</div>
                    <p className="text-sm text-purple-600">Total Monto</p>
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
                      placeholder="Buscar por número de orden..."
                      value={searchTerm}
                      onChange={(e) => handleSearch(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-3">
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
                          {key === 'order_number' && 'Número Orden'}
                          {key === 'supplier.name' && 'Proveedor'}
                          {key === 'order_date' && 'Fecha Orden'}
                          {key === 'total_amount' && 'Total'}
                          {key === 'status' && 'Estado'}
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
              <CardTitle className="text-xl font-semibold text-gray-900">Lista de Órdenes de Compra</CardTitle>
              <CardDescription className="text-gray-600">
                Gestiona y administra todas las órdenes de compra del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading && purchaseOrders.length === 0 ? (
                <TableSkeleton rows={5} columns={6} />
              ) : (
                <DataTable
                  columns={columns}
                  data={purchaseOrders}
                />
              )}
            </CardContent>
          </Card>

        {showCreateForm && (
          <PurchaseOrderForm
            onSubmit={handleCreateOrder}
            onCancel={() => setShowCreateForm(false)}
            loading={loading}
            open={showCreateForm}
          />
        )}

        {selectedOrder && (
          <PurchaseOrderForm
            purchaseOrder={selectedOrder}
            onSubmit={(data) => handleUpdateOrder(selectedOrder.id, data)}
            onCancel={() => setSelectedOrder(null)}
            loading={loading}
            open={!!selectedOrder}
          />
        )}

        {orderToDelete && (
          <ConfirmDialog
            open={!!orderToDelete}
            title="Eliminar Orden de Compra"
            description={`¿Estás seguro de que quieres eliminar la orden "${orderToDelete.order_number}"?`}
            onConfirm={confirmDeleteOrder}
            onCancel={() => setOrderToDelete(null)}
            loading={loading}
          />
        )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
