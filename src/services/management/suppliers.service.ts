import { supabase } from '../../common/supabaseClient';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierFilters,
  PaginatedResponse,
  ApiResponse
} from '../../types/management.types';
import { ToastHelper } from '../../common/utils/toastHelper';

export class SupplierManagementService {
  /**
   * Obtener lista paginada de proveedores
   */
  static async getSuppliers(
    page: number = 1,
    limit: number = 10,
    filters?: SupplierFilters
  ): Promise<PaginatedResponse<Supplier>> {
    try {
      let query = supabase
        .from('suppliers')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,business_name.ilike.%${filters.search}%,contact_person.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      if (filters?.is_active !== undefined) {
        query = query.eq('is_active', filters.is_active);
      }

      if (filters?.city) {
        query = query.ilike('city', `%${filters.city}%`);
      }

      if (filters?.country) {
        query = query.ilike('country', `%${filters.country}%`);
      }

      if (filters?.created_from) {
        query = query.gte('created_at', filters.created_from);
      }

      if (filters?.created_to) {
        query = query.lte('created_at', filters.created_to);
      }

      // Paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Error al obtener proveedores: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error en getSuppliers:', error);
      throw error;
    }
  }

  /**
   * Obtener todos los proveedores activos (para selects)
   */
  static async getAllActiveSuppliers(): Promise<Pick<Supplier, 'id' | 'name' | 'business_name' | 'contact_person' | 'email' | 'phone'>[]> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, name, business_name, contact_person, email, phone')
        .eq('is_active', true)
        .order('name');

      if (error) {
        throw new Error(`Error al obtener proveedores activos: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      console.error('Error en getAllActiveSuppliers:', error);
      throw error;
    }
  }

  /**
   * Obtener proveedor por ID
   */
  static async getSupplierById(id: string): Promise<Supplier | null> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Error al obtener proveedor: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error en getSupplierById:', error);
      throw error;
    }
  }

  /**
   * Crear nuevo proveedor
   */
  static async createSupplier(supplierData: CreateSupplierRequest): Promise<ApiResponse<Supplier>> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .insert({
          ...supplierData,
          is_active: supplierData.is_active ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select('*')
        .single();

      if (error) {
        throw new Error(`Error al crear proveedor: ${error.message}`);
      }

      ToastHelper.success('Proveedor creado exitosamente', {
        title: 'Éxito',
        description: `${data.company_name} ha sido agregado`
      });

      return {
        success: true,
        data,
        message: 'Proveedor creado exitosamente'
      };
    } catch (error) {
      console.error('Error en createSupplier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      ToastHelper.error('Error al crear proveedor', {
        title: 'Error',
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Actualizar proveedor
   */
  static async updateSupplier(id: string, supplierData: UpdateSupplierRequest): Promise<ApiResponse<Supplier>> {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .update({
          ...supplierData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        throw new Error(`Error al actualizar proveedor: ${error.message}`);
      }

      ToastHelper.success('Proveedor actualizado exitosamente', {
        title: 'Éxito',
        description: `${data.company_name} ha sido actualizado`
      });

      return {
        success: true,
        data,
        message: 'Proveedor actualizado exitosamente'
      };
    } catch (error) {
      console.error('Error en updateSupplier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      ToastHelper.error('Error al actualizar proveedor', {
        title: 'Error',
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Eliminar proveedor (desactivar)
   */
  static async deleteSupplier(id: string): Promise<ApiResponse<void>> {
    try {
      const { error } = await supabase
        .from('suppliers')
        .update({
          is_active: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        throw new Error(`Error al eliminar proveedor: ${error.message}`);
      }

      ToastHelper.success('Proveedor desactivado exitosamente', {
        title: 'Éxito',
        description: 'El proveedor ha sido desactivado del sistema'
      });

      return {
        success: true,
        message: 'Proveedor eliminado exitosamente'
      };
    } catch (error) {
      console.error('Error en deleteSupplier:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      
      ToastHelper.error('Error al desactivar proveedor', {
        title: 'Error',
        description: errorMessage
      });

      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Verificar si un proveedor tiene órdenes de compra asociadas
   */
  static async hasAssociatedPurchaseOrders(supplierId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id')
        .eq('supplier_id', supplierId)
        .limit(1);

      if (error) {
        console.error('Error al verificar órdenes asociadas:', error);
        return false;
      }

      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error en hasAssociatedPurchaseOrders:', error);
      return false;
    }
  }

  /**
   * Obtener estadísticas de un proveedor
   */
  static async getSupplierStats(supplierId: string) {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select('id, total_amount, status, order_date')
        .eq('supplier_id', supplierId);

      if (error) {
        throw new Error(`Error al obtener estadísticas del proveedor: ${error.message}`);
      }

      const orders = data || [];
      const totalOrders = orders.length;
      const totalAmount = orders.reduce((sum, order) => sum + order.total_amount, 0);
      const averageOrderAmount = totalOrders > 0 ? totalAmount / totalOrders : 0;

      const ordersByStatus = orders.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const lastOrderDate = orders.length > 0 
        ? Math.max(...orders.map(order => new Date(order.order_date).getTime()))
        : null;

      return {
        totalOrders,
        totalAmount,
        averageOrderAmount,
        ordersByStatus,
        lastOrderDate: lastOrderDate ? new Date(lastOrderDate).toISOString() : null
      };
    } catch (error) {
      console.error('Error en getSupplierStats:', error);
      throw error;
    }
  }

  /**
   * Obtener estadísticas de proveedores
   */
  static async getStats() {
    try {
      const { count: total } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true });

      const { count: active } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      const { count: withEmail } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .not('email', 'is', null);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const { count: recentlyAdded } = await supabase
        .from('suppliers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString());

      return {
        total: total || 0,
        active: active || 0,
        withEmail: withEmail || 0,
        recentlyAdded: recentlyAdded || 0
      };
    } catch (error) {
      console.error('Error en getStats:', error);
      throw error;
    }
  }
}
