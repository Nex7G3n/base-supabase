"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, MoreHorizontal } from "lucide-react";
import { Button } from "../../components/ui/button";
import { ProtectedComponent } from "../../components/ProtectedComponent";
import { User } from "../../types/management.types";

interface UserColumnsProps {
  onEdit: (user: User) => void;
  onDelete: (userId: string) => void;
}

export const createUserColumns = ({ onEdit, onDelete }: UserColumnsProps): ColumnDef<User>[] => [
  {
    accessorKey: "first_name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Nombre
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="flex items-center">
          <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center mr-3 overflow-hidden">
            {user.avatar_url ? (
              <img 
                src={user.avatar_url} 
                alt={`${user.first_name} ${user.last_name}`}
                className="h-full w-full object-cover rounded-full"
                onError={(e) => {
                  // Si la imagen falla al cargar, mostrar iniciales
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = `<span class="text-sm font-medium text-gray-700">${user.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}</span>`;
                  }
                }}
              />
            ) : (
              <span className="text-sm font-medium text-gray-700">
                {user.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
              </span>
            )}
          </div>
          <div>
            <div className="font-medium">{user.first_name} {user.last_name}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
  },
  {
    id: "roles",
    header: "Roles",
    cell: ({ row }) => {
      const user = row.original;
      const roles = user.user_roles?.map((ur: any) => {
        // La estructura correcta es ur.roles.name según la consulta del servicio
        return ur.roles?.name || ur.role?.name;
      }).filter(Boolean) || [];
      
      return (
        <div className="flex flex-wrap gap-1">
          {roles.length > 0 ? (
            roles.map((role: any, index: number) => (
              <span
                key={index}
                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
              >
                {role}
              </span>
            ))
          ) : (
            <span className="text-sm text-gray-500">Sin rol</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "is_active",
    header: "Estado",
    cell: ({ row }) => {
      const isActive = row.getValue("is_active");
      return (
        <span
          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
            isActive
              ? "bg-green-100 text-green-800"
              : "bg-red-100 text-red-800"
          }`}
        >
          {isActive ? "Activo" : "Inactivo"}
        </span>
      );
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-auto p-0 font-medium"
        >
          Fecha de Creación
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue("created_at"));
      return <div>{date.toLocaleDateString()}</div>;
    },
  },
  {
    id: "actions",
    header: "Acciones",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <div className="flex items-center space-x-2">
          <ProtectedComponent permissions={["users_update"]}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onEdit(user)}
            >
              Editar
            </Button>
          </ProtectedComponent>
          <ProtectedComponent permissions={["users_delete"]}>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDelete(user.id)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-300"
            >
              Eliminar
            </Button>
          </ProtectedComponent>
        </div>
      );
    },
  },
];
