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
import { User, Role } from '../../types/management.types';

interface UserFormProps {
  user?: User | null;
  roles: Role[];
  onSubmit: (userData: any) => Promise<void>;
  onCancel: () => void;
  loading?: boolean;
  open: boolean;
}

export function UserForm({ user, roles, onSubmit, onCancel, loading = false, open }: UserFormProps) {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    is_active: true,
    role_ids: [] as string[]
  });

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        password: '',
        is_active: user.is_active ?? true,
        role_ids: user.user_roles?.map((ur: any) => ur.role_id) || []
      });
    }
  }, [user]);

  const validateForm = () => {
    const errors: { [key: string]: string } = {};

    if (!formData.first_name.trim()) {
      errors.first_name = 'El nombre es requerido';
    }

    // Solo validar email si estamos creando un usuario (no editando)
    if (!user) {
      if (!formData.email.trim()) {
        errors.email = 'El email es requerido';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        errors.email = 'El email no es válido';
      }
    }

    if (!user && !formData.password.trim()) {
      errors.password = 'La contraseña es requerida';
    } else if (formData.password && formData.password.length < 6) {
      errors.password = 'La contraseña debe tener al menos 6 caracteres';
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
      if (user) {
        // En modo edición, no incluir email
        const { email: _email, password, ...editData } = formData;
        
        // Solo incluir password si no está vacío
        const submitData = password ? { ...editData, password } : editData;
        
        await onSubmit(submitData);
      } else {
        // En modo creación, incluir todos los datos
        await onSubmit(formData);
      }
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

  const handleRoleChange = (roleId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      role_ids: checked 
        ? [...prev.role_ids, roleId]
        : prev.role_ids.filter(id => id !== roleId)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onCancel()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {user ? 'Editar Usuario' : 'Crear Usuario'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <Input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleInputChange('first_name', e.target.value)}
              className={formErrors.first_name ? 'border-red-500' : ''}
              placeholder="Ingresa el nombre"
            />
            {formErrors.first_name && (
              <p className="text-red-500 text-xs mt-1">{formErrors.first_name}</p>
            )}
          </div>

          {/* Apellido */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apellido
            </label>
            <Input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleInputChange('last_name', e.target.value)}
              placeholder="Ingresa el apellido"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email {!user ? '*' : ''}
            </label>
            {user ? (
              // En modo edición, mostrar email como solo lectura
              <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md text-gray-600">
                {formData.email || 'No especificado'}
              </div>
            ) : (
              // En modo creación, input editable
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className={formErrors.email ? 'border-red-500' : ''}
                placeholder="usuario@ejemplo.com"
              />
            )}
            {formErrors.email && (
              <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {user ? 'Nueva Contraseña (opcional)' : 'Contraseña *'}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={formErrors.password ? 'border-red-500' : ''}
              placeholder={user ? 'Dejar vacío para mantener actual' : 'Mínimo 6 caracteres'}
            />
            {formErrors.password && (
              <p className="text-red-500 text-xs mt-1">{formErrors.password}</p>
            )}
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
              <span className="ml-2 text-sm text-gray-700">Usuario activo</span>
            </label>
          </div>

          {/* Roles */}
          {roles.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Roles
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto border border-gray-200 rounded p-2">
                {roles.map((role) => (
                  <label key={role.id} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.role_ids.includes(role.id)}
                      onChange={(e) => handleRoleChange(role.id, e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      {role.name}
                      {role.description && (
                        <span className="text-gray-500 text-xs block">
                          {role.description}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
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
            {loading ? 'Guardando...' : (user ? 'Actualizar' : 'Crear')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
