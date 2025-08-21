"use client";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "../../components/ui/button";
import { Permission } from "../../types/management.types";

interface PermissionColumnActions {
  onEdit: (permission: Permission) => void;
  onDelete: (id: string) => void;
  onToggleStatus: (id: string, currentStatus: boolean) => void;
}

export function createPermissionColumns(actions: PermissionColumnActions): ColumnDef<Permission>[] {
  return [
    {
      accessorKey: "name",
      header: "Nombre",
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <div>
            <div className="font-medium">{permission.name}</div>
            {permission.description && (
              <div className="text-sm text-gray-500">{permission.description}</div>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "module",
      header: "Módulo",
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <span className="text-sm">
            {permission.module?.name || 'Sin módulo'}
          </span>
        );
      },
    },
    {
      accessorKey: "action",
      header: "Acción",
      cell: ({ row }) => {
        const permission = row.original;
        const actionLabels: Record<string, string> = {
          create: 'Crear',
          read: 'Leer',
          update: 'Actualizar',
          delete: 'Eliminar',
          execute: 'Ejecutar'
        };
        return (
          <span
            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
          >
            {actionLabels[permission.action] || permission.action}
          </span>
        );
      },
    },
    {
      accessorKey: "is_active",
      header: "Estado",
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              permission.is_active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {permission.is_active ? "Activo" : "Inactivo"}
          </span>
        );
      },
    },
    {
      accessorKey: "created_at",
      header: "Fecha Creación",
      cell: ({ row }) => {
        const permission = row.original;
        return new Date(permission.created_at).toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: "Acciones",
      cell: ({ row }) => {
        const permission = row.original;
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onEdit(permission)}
            >
              Editar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => actions.onToggleStatus(permission.id, permission.is_active)}
            >
              {permission.is_active ? "Desactivar" : "Activar"}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => actions.onDelete(permission.id)}
            >
              Eliminar
            </Button>
          </div>
        );
      },
    },
  ];
}
