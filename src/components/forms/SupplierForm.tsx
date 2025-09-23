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
import { Supplier } from '../../types/management.types';

interface SupplierFormProps {
  supplier?: Supplier | null;
  onSubmit: (supplierData: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  open: boolean;
}

export function SupplierForm({ supplier, onSubmit, onCancel, loading = false, open }: SupplierFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    business_name: '',
    ruc: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: 'Perú',
    is_active: true
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (supplier) {
      setFormData({
        name: supplier.name || '',
        business_name: supplier.business_name || '',
        ruc: supplier.ruc || '',
        contact_person: supplier.contact_person || '',
        email: supplier.email || '',
        phone: supplier.phone || '',
        address: supplier.address || '',
        city: supplier.city || '',
        country: supplier.country || 'Perú',
        is_active: supplier.is_active ?? true
      });
    } else {
      // Reset form for new supplier
      setFormData({
        name: '',
        business_name: '',
        ruc: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        country: 'Perú',
        is_active: true
      });
    }
    setFormErrors({});
  }, [supplier, open]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.name.trim()) {
      errors.name = 'El nombre es requerido';
    }

    if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }

    if (formData.ruc && formData.ruc.length !== 11) {
      errors.ruc = 'El RUC debe tener 11 dígitos';
    }

    if (formData.phone && formData.phone.length < 7) {
      errors.phone = 'El teléfono debe tener al menos 7 dígitos';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Limpiar campos vacíos opcionales
      const cleanData = Object.fromEntries(
        Object.entries(formData).filter(([key, value]) => {
          if (key === 'is_active') return true;
          return value !== '';
        })
      );

      await onSubmit(cleanData);
    } catch (error) {
      console.error('Error al enviar formulario:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Limpiar error del campo cuando el usuario empiece a escribir
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {supplier ? 'Editar Proveedor' : 'Crear Proveedor'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={formErrors.name ? 'border-red-500' : ''}
                placeholder="Nombre del proveedor"
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
              )}
            </div>

            {/* Razón Social */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón Social
              </label>
              <Input
                type="text"
                value={formData.business_name}
                onChange={(e) => handleInputChange('business_name', e.target.value)}
                placeholder="Razón social"
              />
            </div>

            {/* RUC */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RUC
              </label>
              <Input
                type="text"
                value={formData.ruc}
                onChange={(e) => handleInputChange('ruc', e.target.value.replace(/\D/g, '').slice(0, 11))}
                className={formErrors.ruc ? 'border-red-500' : ''}
                placeholder="12345678901"
                maxLength={11}
              />
              {formErrors.ruc && (
                <p className="text-red-500 text-xs mt-1">{formErrors.ruc}</p>
              )}
            </div>

            {/* Persona de Contacto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Persona de Contacto
              </label>
              <Input
                type="text"
                value={formData.contact_person}
                onChange={(e) => handleInputChange('contact_person', e.target.value)}
                placeholder="Nombre del contacto"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={formErrors.email ? 'border-red-500' : ''}
                placeholder="proveedor@ejemplo.com"
              />
              {formErrors.email && (
                <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
              )}
            </div>

            {/* Teléfono */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={formErrors.phone ? 'border-red-500' : ''}
                placeholder="+51 999 999 999"
              />
              {formErrors.phone && (
                <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
              )}
            </div>

            {/* Ciudad */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ciudad
              </label>
              <Input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                placeholder="Lima"
              />
            </div>

            {/* País */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                País
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="Perú">Perú</option>
                <option value="Colombia">Colombia</option>
                <option value="Ecuador">Ecuador</option>
                <option value="Bolivia">Bolivia</option>
                <option value="Chile">Chile</option>
                <option value="Argentina">Argentina</option>
                <option value="Brasil">Brasil</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Dirección completa del proveedor"
            />
          </div>

          {/* Estado */}
          <div>
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => handleInputChange('is_active', e.target.checked)}
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Proveedor activo</span>
            </label>
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
            {loading ? 'Guardando...' : (supplier ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
