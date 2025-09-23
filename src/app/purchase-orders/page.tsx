"use client";
import React, { useState, useEffect } from 'react';
import { ProtectedRoute, ProtectedComponent } from '../../components/ProtectedComponent';
import { PurchaseOrderManagementService } from '../../services/management/purchase-orders.service';
import { Button } from '../../components/ui/button';
import { DataTable } from '../../components/ui/data-table';
import { TableSkeleton } from '../../components/ui/skeleton';
import { PurchaseOrderForm } from '../../components/forms/PurchaseOrderForm';
import { ConfirmDialog } from '../../components/ui/confirm-dialog';
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
  const { success, error: showError } = useToast();

  useEffect(() => {
    loadPurchaseOrders();
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

  const columns = createPurchaseOrderColumns({
    onEdit: (order: PurchaseOrder) => setSelectedOrder(order),
    onDelete: handleDeleteOrder
  });

  return (
    <ProtectedRoute permissions={['purchase_orders_read']}>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">Órdenes de Compra</h2>
            <p className="text-gray-600">Gestiona las órdenes de compra a proveedores</p>
          </div>
          <ProtectedComponent permissions={['purchase_orders_create']}>
            <Button onClick={() => setShowCreateForm(true)}>
              Crear Orden
            </Button>
          </ProtectedComponent>
        </div>

        {loading && purchaseOrders.length === 0 ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <DataTable
            columns={columns}
            data={purchaseOrders}
            searchKey="order_number"
            searchPlaceholder="Buscar por número de orden..."
          />
        )}

        {error && <p className="text-red-500 mt-4">{error}</p>}

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
    </ProtectedRoute>
  );
}
