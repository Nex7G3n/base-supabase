"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/auth/application/hooks/useAuthComplete';
import { UserManagementService } from '@/services/management/users.service';
import { UpdateUserRequest } from '@/types/management.types';
import { Role } from '@/auth/domain/types/auth.interfaces';
import { supabase } from '@/common/supabaseClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Upload, User, Mail, Phone, Calendar, Save, X } from 'lucide-react';
import { useToast } from '@/providers/ToastProvider';

export default function ProfilePage() {
  const { user, refreshUserData } = useAuth();
  const { success, error: showError } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState<UpdateUserRequest>({
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || ''
      });
    }
  }, [user]);

  const handleInputChange = (field: keyof UpdateUserRequest, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await UserManagementService.updateUser(user.id, formData);
      
      if (response.success) {
        await refreshUserData();
        setIsEditing(false);
        success('Perfil actualizado', 'Tu información se ha guardado correctamente');
      } else {
        showError('Error al actualizar', response.error || 'No se pudo actualizar el perfil');
      }
    } catch (error) {
      console.error('Error al actualizar perfil:', error);
      showError('Error inesperado', 'Ocurrió un error al actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        phone: user.phone || '',
        avatar_url: user.avatar_url || ''
      });
    }
    setIsEditing(false);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      showError('Archivo inválido', 'Por favor selecciona un archivo de imagen válido');
      return;
    }

    // Validar tamaño (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      showError('Archivo muy grande', 'El archivo debe ser menor a 5MB');
      return;
    }

    setUploadingAvatar(true);
    try {
      // Crear nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      // Subir archivo a Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('public')
        .getPublicUrl(filePath);

      // Actualizar el avatar en la base de datos
      const response = await UserManagementService.updateUser(user.id, {
        avatar_url: publicUrl
      });

      if (response.success) {
        await refreshUserData();
        setFormData(prev => ({ ...prev, avatar_url: publicUrl }));
        success('Avatar actualizado', 'Tu foto de perfil se ha actualizado correctamente');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Error al subir avatar:', error);
      showError('Error al subir imagen', 'No se pudo actualizar tu foto de perfil');
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Mi Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gestiona tu información personal y configuración de cuenta
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Tarjeta de Avatar */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Foto de Perfil
            </CardTitle>
            <CardDescription>
              Actualiza tu foto de perfil
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                {formData.avatar_url ? (
                  <img
                    src={formData.avatar_url}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-muted-foreground" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90 transition-colors">
                <Upload className="h-4 w-4" />
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            {uploadingAvatar && (
              <p className="text-sm text-muted-foreground">Subiendo imagen...</p>
            )}
          </CardContent>
        </Card>

        {/* Tarjeta de Información Personal */}
        <Card className="md:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Información Personal</CardTitle>
                <CardDescription>
                  Tu información básica de perfil
                </CardDescription>
              </div>
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleCancel}
                      disabled={loading}
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancelar
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleSave}
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-1" />
                      {loading ? 'Guardando...' : 'Guardar'}
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(true)}
                  >
                    Editar
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nombre
                </label>
                {isEditing ? (
                  <Input
                    value={formData.first_name}
                    onChange={(e) => handleInputChange('first_name', e.target.value)}
                    placeholder="Ingresa tu nombre"
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {user.first_name || 'No especificado'}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Apellido
                </label>
                {isEditing ? (
                  <Input
                    value={formData.last_name}
                    onChange={(e) => handleInputChange('last_name', e.target.value)}
                    placeholder="Ingresa tu apellido"
                  />
                ) : (
                  <p className="text-sm py-2 px-3 bg-muted rounded-md">
                    {user.last_name || 'No especificado'}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Correo Electrónico
              </label>
              <p className="text-sm py-2 px-3 bg-muted rounded-md text-muted-foreground">
                {user.email}
                <span className="ml-2 text-xs">(No se puede modificar)</span>
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Teléfono
              </label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="Ingresa tu teléfono"
                  type="tel"
                />
              ) : (
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {user.phone || 'No especificado'}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Miembro desde
              </label>
              <p className="text-sm py-2 px-3 bg-muted rounded-md">
                {new Date(user.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
            </div>

            {user.last_login && (
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Último acceso
                </label>
                <p className="text-sm py-2 px-3 bg-muted rounded-md">
                  {new Date(user.last_login).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Información adicional sobre roles */}
      {user.roles && user.roles.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Roles y Permisos</CardTitle>
            <CardDescription>
              Información sobre tus roles en el sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <label className="text-sm font-medium">Roles asignados</label>
              <div className="flex flex-wrap gap-2">
                {user.roles.map((role: Role) => (
                  <span
                    key={role.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary"
                  >
                    {role.name}
                  </span>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
