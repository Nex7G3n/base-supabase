"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Client, CreateClientRequest, UpdateClientRequest } from "@/types/management.types";
import { ClientsService } from "@/services/management/clients.service";
import { useToast } from "@/common/hooks/useToast";

interface ClientFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  client?: Client | null;
  onSuccess?: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  tax_id: string;
}

const initialFormData: FormData = {
  name: "",
  email: "",
  phone: "",
  address: "",
  tax_id: "",
};

export function ClientForm({ open, onOpenChange, client, onSuccess }: ClientFormProps) {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const { toast } = useToast();

  const isEditing = !!client;

  useEffect(() => {
    if (client) {
      setFormData({
        name: client.name || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        tax_id: client.tax_id || "",
      });
    } else {
      setFormData(initialFormData);
    }
    setErrors({});
  }, [client, open]);

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre es requerido";
    }

    if (formData.email && !isValidEmail(formData.email)) {
      newErrors.email = "El email no es válido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Verificar email duplicado
      if (formData.email) {
        const emailExists = await ClientsService.existsByEmail(
          formData.email,
          isEditing ? client.id : undefined
        );

        if (emailExists) {
          setErrors({ email: "Ya existe un cliente con este email" });
          setLoading(false);
          return;
        }
      }

      // Preparar datos
      const clientData = {
        name: formData.name.trim(),
        email: formData.email.trim() || undefined,
        phone: formData.phone.trim() || undefined,
        address: formData.address.trim() || undefined,
        tax_id: formData.tax_id.trim() || undefined,
      };

      let response;

      if (isEditing) {
        response = await ClientsService.update(client.id, clientData as UpdateClientRequest);
      } else {
        response = await ClientsService.create(clientData as CreateClientRequest);
      }

      if (response.success) {
        toast({
          title: "Éxito",
          description: response.message,
          variant: "default",
        });

        onOpenChange(false);
        onSuccess?.();
      } else {
        toast({
          title: "Error",
          description: response.error || response.message,
          variant: "error",
        });
      }
    } catch (error) {
      console.error("Error al guardar cliente:", error);
      toast({
        title: "Error",
        description: "Ocurrió un error inesperado",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Cliente" : "Nuevo Cliente"}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? "Modifica los datos del cliente seleccionado."
              : "Completa los datos para crear un nuevo cliente."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Nombre */}
            <div className="grid gap-2">
              <label htmlFor="name" className="text-sm font-medium">
                Nombre <span className="text-red-500">*</span>
              </label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nombre del cliente"
                disabled={loading}
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <span className="text-sm text-red-500">{errors.name}</span>
              )}
            </div>

            {/* Email */}
            <div className="grid gap-2">
              <label htmlFor="email" className="text-sm font-medium">
                Email
              </label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={loading}
                className={errors.email ? "border-red-500" : ""}
              />
              {errors.email && (
                <span className="text-sm text-red-500">{errors.email}</span>
              )}
            </div>

            {/* Teléfono */}
            <div className="grid gap-2">
              <label htmlFor="phone" className="text-sm font-medium">
                Teléfono
              </label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                placeholder="+57 300 123 4567"
                disabled={loading}
              />
            </div>

            {/* NIT/CC */}
            <div className="grid gap-2">
              <label htmlFor="tax_id" className="text-sm font-medium">
                NIT/CC
              </label>
              <Input
                id="tax_id"
                type="text"
                value={formData.tax_id}
                onChange={(e) => handleInputChange("tax_id", e.target.value)}
                placeholder="900123456-1"
                disabled={loading}
              />
            </div>

            {/* Dirección */}
            <div className="grid gap-2">
              <label htmlFor="address" className="text-sm font-medium">
                Dirección
              </label>
              <Input
                id="address"
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange("address", e.target.value)}
                placeholder="Calle 123 #45-67, Ciudad"
                disabled={loading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Guardando..." : isEditing ? "Actualizar" : "Crear"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}