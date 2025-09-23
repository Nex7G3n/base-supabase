import { supabase } from '@/common/supabaseClient';
import { 
  Client, 
  CreateClientRequest, 
  UpdateClientRequest, 
  ClientFilters,
  ApiResponse 
} from '@/types/management.types';

export class ClientsService {
  /**
   * Obtiene todos los clientes con filtros opcionales
   */
  static async getAll(filters?: ClientFilters): Promise<ApiResponse<Client[]>> {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('created_at', { ascending: false });

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
      }

      if (filters?.created_from) {
        query = query.gte('created_at', filters.created_from);
      }

      if (filters?.created_to) {
        query = query.lte('created_at', filters.created_to);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al obtener clientes:', error);
        return {
          success: false,
          error: error.message,
          message: 'Error al obtener la lista de clientes'
        };
      }

      return {
        success: true,
        data: data || [],
        message: 'Clientes obtenidos exitosamente'
      };
    } catch (error) {
      console.error('Error inesperado al obtener clientes:', error);
      return {
        success: false,
        error: 'Error inesperado',
        message: 'Error inesperado al obtener los clientes'
      };
    }
  }

  /**
   * Obtiene un cliente por ID
   */
  static async getById(id: string): Promise<ApiResponse<Client>> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error al obtener cliente:', error);
        return {
          success: false,
          error: error.message,
          message: 'Error al obtener el cliente'
        };
      }

      return {
        success: true,
        data,
        message: 'Cliente obtenido exitosamente'
      };
    } catch (error) {
      console.error('Error inesperado al obtener cliente:', error);
      return {
        success: false,
        error: 'Error inesperado',
        message: 'Error inesperado al obtener el cliente'
      };
    }
  }

  /**
   * Crea un nuevo cliente
   */
  static async create(clientData: CreateClientRequest): Promise<ApiResponse<Client>> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .insert([clientData])
        .select()
        .single();

      if (error) {
        console.error('Error al crear cliente:', error);
        return {
          success: false,
          error: error.message,
          message: 'Error al crear el cliente'
        };
      }

      return {
        success: true,
        data,
        message: 'Cliente creado exitosamente'
      };
    } catch (error) {
      console.error('Error inesperado al crear cliente:', error);
      return {
        success: false,
        error: 'Error inesperado',
        message: 'Error inesperado al crear el cliente'
      };
    }
  }

  /**
   * Actualiza un cliente existente
   */
  static async update(id: string, clientData: UpdateClientRequest): Promise<ApiResponse<Client>> {
    try {
      const { data, error } = await supabase
        .from('clients')
        .update(clientData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error al actualizar cliente:', error);
        return {
          success: false,
          error: error.message,
          message: 'Error al actualizar el cliente'
        };
      }

      return {
        success: true,
        data,
        message: 'Cliente actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error inesperado al actualizar cliente:', error);
      return {
        success: false,
        error: 'Error inesperado',
        message: 'Error inesperado al actualizar el cliente'
      };
    }
  }

  /**
   * Elimina un cliente
   */
  static async delete(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error al eliminar cliente:', error);
        return {
          success: false,
          error: error.message,
          message: 'Error al eliminar el cliente'
        };
      }

      return {
        success: true,
        message: 'Cliente eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error inesperado al eliminar cliente:', error);
      return {
        success: false,
        error: 'Error inesperado',
        message: 'Error inesperado al eliminar el cliente'
      };
    }
  }

  /**
   * Verifica si existe un cliente con el email especificado
   */
  static async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('clients')
        .select('id')
        .eq('email', email);

      if (excludeId) {
        query = query.neq('id', excludeId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error al verificar email:', error);
        return false;
      }

      return (data && data.length > 0);
    } catch (error) {
      console.error('Error inesperado al verificar email:', error);
      return false;
    }
  }

  /**
   * Obtiene estadísticas básicas de clientes
   */
  static async getStats(): Promise<ApiResponse<{
    total: number;
    withEmail: number;
    withPhone: number;
    recentlyAdded: number;
  }>> {
    try {
      // Total de clientes
      const { count: total } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });

      // Clientes con email
      const { count: withEmail } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .not('email', 'is', null);

      // Clientes con teléfono
      const { count: withPhone } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .not('phone', 'is', null);

      // Clientes agregados en los últimos 30 días
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentlyAdded } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      return {
        success: true,
        data: {
          total: total || 0,
          withEmail: withEmail || 0,
          withPhone: withPhone || 0,
          recentlyAdded: recentlyAdded || 0
        },
        message: 'Estadísticas obtenidas exitosamente'
      };
    } catch (error) {
      console.error('Error al obtener estadísticas:', error);
      return {
        success: false,
        error: 'Error inesperado',
        message: 'Error al obtener las estadísticas'
      };
    }
  }
}