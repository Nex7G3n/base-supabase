"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { PurchaseOrder, Supplier, CreatePurchaseOrderItemRequest } from '../../types/management.types';
import { SupplierManagementService } from '../../services/management/suppliers.service';

interface PurchaseOrderFormProps {
  purchaseOrder?: PurchaseOrder | null;
  onSubmit: (orderData: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  open: boolean;
}

export function PurchaseOrderForm({ purchaseOrder, onSubmit, onCancel, loading = false, open }: PurchaseOrderFormProps) {
  const [formData, setFormData] = useState({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    status: 'draft',
    notes: '',
    items: [] as CreatePurchaseOrderItemRequest[]
  });
  const [suppliers, setSuppliers] = useState<Pick<Supplier, 'id' | 'name'>[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    loadSuppliers();
  }, []);

  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        supplier_id: purchaseOrder.supplier_id || '',
        order_date: purchaseOrder.order_date ? new Date(purchaseOrder.order_date).toISOString().split('T')[0] : '',
        expected_delivery_date: purchaseOrder.expected_delivery_date ? new Date(purchaseOrder.expected_delivery_date).toISOString().split('T')[0] : '',
        status: purchaseOrder.status || 'draft',
        notes: purchaseOrder.notes || '',
        items: purchaseOrder.purchase_order_items?.map(item => ({
          product_name: item.product_name,
          description: item.description,
          quantity: item.quantity,
          unit_price: item.unit_price
        })) || []
      });
    } else {
      // Reset form for new order
      setFormData({
        supplier_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        status: 'draft',
        notes: '',
        items: []
      });
    }
    setFormErrors({});
  }, [purchaseOrder, open]);

  const loadSuppliers = async () => {
    try {
      const activeSuppliers = await SupplierManagementService.getAllActiveSuppliers();
      setSuppliers(activeSuppliers);
    } catch (error) {
      console.error('Error al cargar proveedores:', error);
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.supplier_id) {
      errors.supplier_id = 'Debe seleccionar un proveedor';
    }

    if (!formData.order_date) {
      errors.order_date = 'La fecha de orden es requerida';
    }

    if (formData.items.length === 0) {
      errors.items = 'Debe agregar al menos un producto';
    }

    formData.items.forEach((item, index) => {
      if (!item.product_name.trim()) {
        errors[`item_${index}_product_name`] = 'El nombre del producto es requerido';
      }
      if (item.quantity <= 0) {
        errors[`item_${index}_quantity`] = 'La cantidad debe ser mayor a 0';
      }
      if (item.unit_price <= 0) {
        errors[`item_${index}_unit_price`] = 'El precio debe ser mayor a 0';
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));

    if (formErrors[`item_${index}_${field}`]) {
      setFormErrors(prev => ({ ...prev, [`item_${index}_${field}`]: '' }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { product_name: '', quantity: 1, unit_price: 0, description: '' }]
    }));
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const calculateTotal = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const tax = subtotal * 0.18;
    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: (subtotal + tax).toFixed(2)
    };
  };

  const totals = calculateTotal();

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {purchaseOrder ? 'Editar Orden de Compra' : 'Crear Orden de Compra'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Proveedor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Proveedor *
              </label>
              <select
                value={formData.supplier_id}
                onChange={(e) => handleInputChange('supplier_id', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm ${formErrors.supplier_id ? 'border-red-500' : 'border-gray-300'}`}
              >
                <option value="">Seleccione un proveedor</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>{supplier.name}</option>
                ))}
              </select>
              {formErrors.supplier_id && (
                <p className="text-red-500 text-xs mt-1">{formErrors.supplier_id}</p>
              )}
            </div>

            {/* Fecha de Orden */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Orden *
              </label>
              <Input
                type="date"
                value={formData.order_date}
                onChange={(e) => handleInputChange('order_date', e.target.value)}
                className={formErrors.order_date ? 'border-red-500' : ''}
              />
              {formErrors.order_date && (
                <p className="text-red-500 text-xs mt-1">{formErrors.order_date}</p>
              )}
            </div>

            {/* Fecha de Entrega */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de Entrega Esperada
              </label>
              <Input
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => handleInputChange('expected_delivery_date', e.target.value)}
              />
            </div>
          </div>

          {/* Items de la Orden */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Items</h3>
            <div className="space-y-2">
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start p-2 border rounded-md">
                  {/* Nombre Producto */}
                  <div className="col-span-4">
                    <label className="text-xs text-gray-600">Producto *</label>
                    <Input
                      type="text"
                      value={item.product_name}
                      onChange={(e) => handleItemChange(index, 'product_name', e.target.value)}
                      className={formErrors[`item_${index}_product_name`] ? 'border-red-500' : ''}
                      placeholder="Nombre del producto"
                    />
                  </div>
                  {/* Cantidad */}
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600">Cantidad *</label>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                      className={formErrors[`item_${index}_quantity`] ? 'border-red-500' : ''}
                      min="1"
                    />
                  </div>
                  {/* Precio Unitario */}
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600">Precio U. *</label>
                    <Input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(index, 'unit_price', parseFloat(e.target.value) || 0)}
                      className={formErrors[`item_${index}_unit_price`] ? 'border-red-500' : ''}
                      min="0.01"
                      step="0.01"
                    />
                  </div>
                  {/* Total Item */}
                  <div className="col-span-2 flex items-end">
                    <p className="text-sm font-medium">
                      S/ {(item.quantity * item.unit_price).toFixed(2)}
                    </p>
                  </div>
                  {/* Botón Eliminar */}
                  <div className="col-span-2 flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => removeItem(index)}
                    >
                      Eliminar
                    </Button>
                  </div>
                  {/* Descripción */}
                  <div className="col-span-12">
                    <textarea
                      value={item.description}
                      onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                      className="w-full px-2 py-1 border rounded-md text-sm"
                      rows={1}
                      placeholder="Descripción (opcional)"
                    />
                  </div>
                </div>
              ))}
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="mt-2"
            >
              + Agregar Producto
            </Button>
            {formErrors.items && (
              <p className="text-red-500 text-xs mt-1">{formErrors.items}</p>
            )}
          </div>

          {/* Totales y Notas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Notas */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={4}
                placeholder="Notas adicionales sobre la orden"
              />
            </div>

            {/* Totales */}
            <div className="space-y-2 p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span className="font-medium">S/ {totals.subtotal}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">IGV (18%):</span>
                <span className="font-medium">S/ {totals.tax}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>S/ {totals.total}</span>
              </div>
            </div>
          </div>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleSubmit}
          >
            {loading ? 'Guardando...' : (purchaseOrder ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
