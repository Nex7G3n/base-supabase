import { supabase } from '../../common/supabaseClient';
import {
  PurchaseOrder,
  PurchaseOrderItem,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  PurchaseOrderFilters,
  PurchaseReport,
  PurchaseReportFilters,
  PaginatedResponse,
  ApiResponse
} from '../../types/management.types';

export class PurchaseOrderManagementService {
  /**
   * Generar número de orden único
   */
  private static async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    
    // Obtener el último número de orden del mes actual
    const { data, error } = await supabase
      .from('purchase_orders')
      .select('order_number')
      .like('order_number', `PO-${year}${month}%`)
      .order('order_number', { ascending: false })
      .limit(1);

    if (error) {
      console.error('Error al obtener último número de orden:', error);
    }

    let nextNumber = 1;
    if (data && data.length > 0) {
      const lastOrderNumber = data[0].order_number;
      const lastNumber = parseInt(lastOrderNumber.split('-')[1].slice(6));
      nextNumber = lastNumber + 1;
    }

    return `PO-${year}${month}${String(nextNumber).padStart(4, '0')}`;
  }

  /**
   * Obtener lista paginada de órdenes de compra
   */
  static async getPurchaseOrders(
    page: number = 1,
    limit: number = 10,
    filters?: PurchaseOrderFilters
  ): Promise<PaginatedResponse<PurchaseOrder>> {
    try {
      let query = supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers!supplier_id (
            id,
            name,
            business_name,
            contact_person,
            email,
            phone
          )
        `, { count: 'exact' });

      // Aplicar filtros
      if (filters?.search) {
        query = query.or(`order_number.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`);
      }

      if (filters?.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      if (filters?.status) {
        query = query.eq('status', filters.status);
      }

      if (filters?.order_date_from) {
        query = query.gte('order_date', filters.order_date_from);
      }

      if (filters?.order_date_to) {
        query = query.lte('order_date', filters.order_date_to);
      }

      // Paginación
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) {
        throw new Error(`Error al obtener órdenes de compra: ${error.message}`);
      }

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error en getPurchaseOrders:', error);
      throw error;
    }
  }

  /**
   * Obtener orden de compra por ID con items
   */
  static async getPurchaseOrderById(id: string): Promise<PurchaseOrder | null> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .select(`
          *,
          supplier:suppliers!supplier_id (
            id,
            name,
            business_name,
            contact_person,
            email,
            phone,
            address,
            city,
            country
          ),
          purchase_order_items (
            id,
            product_name,
            description,
            quantity,
            unit_price,
            total_price,
            received_quantity,
            created_at,
            updated_at
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw new Error(`Error al obtener orden de compra: ${error.message}`);
      }

      return data;
    } catch (error) {
      console.error('Error en getPurchaseOrderById:', error);
      throw error;
    }
  }

  /**
   * Crear nueva orden de compra
   */
  static async createPurchaseOrder(orderData: CreatePurchaseOrderRequest): Promise<ApiResponse<PurchaseOrder>> {
    try {
      // Obtener el usuario actual
      const { data: currentUser } = await supabase.auth.getUser();
      
      if (!currentUser.user) {
        throw new Error('Usuario no autenticado');
      }

      // Generar número de orden
      const orderNumber = await this.generateOrderNumber();

      // Calcular totales
      const subtotal = orderData.items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
      const taxAmount = subtotal * 0.18; // IGV 18%
      const totalAmount = subtotal + taxAmount;

      // Crear la orden de compra
      const { data: order, error: orderError } = await supabase
        .from('purchase_orders')
        .insert({
          order_number: orderNumber,
          supplier_id: orderData.supplier_id,
          order_date: orderData.order_date,
          expected_delivery_date: orderData.expected_delivery_date,
          status: orderData.status || 'draft',
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          notes: orderData.notes,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (orderError) {
        throw new Error(`Error al crear orden de compra: ${orderError.message}`);
      }

      // Crear los items de la orden
      const orderItems = orderData.items.map(item => ({
        purchase_order_id: order.id,
        product_name: item.product_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.quantity * item.unit_price,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }));

      const { error: itemsError } = await supabase
        .from('purchase_order_items')
        .insert(orderItems);

      if (itemsError) {
        // Si falla la creación de items, eliminar la orden
        await supabase.from('purchase_orders').delete().eq('id', order.id);
        throw new Error(`Error al crear items de la orden: ${itemsError.message}`);
      }

      // Obtener la orden completa con relaciones
      const completeOrder = await this.getPurchaseOrderById(order.id);

      return {
        success: true,
        data: completeOrder!,
        message: 'Orden de compra creada exitosamente'
      };
    } catch (error) {
      console.error('Error en createPurchaseOrder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Actualizar orden de compra
   */
  static async updatePurchaseOrder(id: string, orderData: UpdatePurchaseOrderRequest): Promise<ApiResponse<PurchaseOrder>> {
    try {
      // Calcular nuevos totales si se actualizan los items
      let updateData: any = {
        ...orderData,
        updated_at: new Date().toISOString()
      };

      if (orderData.items) {
        const subtotal = orderData.items.reduce((sum, item) => sum + ((item.quantity || 0) * (item.unit_price || 0)), 0);
        const taxAmount = subtotal * 0.18;
        const totalAmount = subtotal + taxAmount;

        updateData = {
          ...updateData,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount
        };

        // Eliminar items existentes
        await supabase
          .from('purchase_order_items')
          .delete()
          .eq('purchase_order_id', id);

        // Crear nuevos items
        const orderItems = orderData.items.map(item => ({
          purchase_order_id: id,
          product_name: item.product_name!,
          description: item.description,
          quantity: item.quantity!,
          unit_price: item.unit_price!,
          total_price: item.quantity! * item.unit_price!,
          received_quantity: item.received_quantity,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }));

        const { error: itemsError } = await supabase
          .from('purchase_order_items')
          .insert(orderItems);

        if (itemsError) {
          throw new Error(`Error al actualizar items: ${itemsError.message}`);
        }
      }

      // Actualizar la orden
      const { data, error } = await supabase
        .from('purchase_orders')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al actualizar orden de compra: ${error.message}`);
      }

      // Obtener la orden completa
      const completeOrder = await this.getPurchaseOrderById(id);

      return {
        success: true,
        data: completeOrder!,
        message: 'Orden de compra actualizada exitosamente'
      };
    } catch (error) {
      console.error('Error en updatePurchaseOrder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Aprobar orden de compra
   */
  static async approvePurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al aprobar orden de compra: ${error.message}`);
      }

      const completeOrder = await this.getPurchaseOrderById(id);

      return {
        success: true,
        data: completeOrder!,
        message: 'Orden de compra aprobada exitosamente'
      };
    } catch (error) {
      console.error('Error en approvePurchaseOrder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Marcar orden como recibida
   */
  static async receivePurchaseOrder(id: string, receivedItems?: { itemId: string; receivedQuantity: number }[]): Promise<ApiResponse<PurchaseOrder>> {
    try {
      // Actualizar cantidades recibidas si se especifican
      if (receivedItems && receivedItems.length > 0) {
        for (const item of receivedItems) {
          await supabase
            .from('purchase_order_items')
            .update({
              received_quantity: item.receivedQuantity,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.itemId);
        }
      }

      // Actualizar estado de la orden
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'received',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al marcar orden como recibida: ${error.message}`);
      }

      const completeOrder = await this.getPurchaseOrderById(id);

      return {
        success: true,
        data: completeOrder!,
        message: 'Orden marcada como recibida exitosamente'
      };
    } catch (error) {
      console.error('Error en receivePurchaseOrder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Cancelar orden de compra
   */
  static async cancelPurchaseOrder(id: string): Promise<ApiResponse<PurchaseOrder>> {
    try {
      const { data, error } = await supabase
        .from('purchase_orders')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new Error(`Error al cancelar orden de compra: ${error.message}`);
      }

      const completeOrder = await this.getPurchaseOrderById(id);

      return {
        success: true,
        data: completeOrder!,
        message: 'Orden de compra cancelada exitosamente'
      };
    } catch (error) {
      console.error('Error en cancelPurchaseOrder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Generar reporte de compras por proveedor
   */
  static async generatePurchaseReport(filters: PurchaseReportFilters): Promise<PurchaseReport[]> {
    try {
      let query = supabase
        .from('purchase_orders')
        .select(`
          supplier_id,
          total_amount,
          status,
          order_date,
          supplier:suppliers!supplier_id (
            name
          )
        `)
        .gte('order_date', filters.date_from)
        .lte('order_date', filters.date_to);

      if (filters.supplier_id) {
        query = query.eq('supplier_id', filters.supplier_id);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      const { data, error } = await query;

      if (error) {
        throw new Error(`Error al generar reporte: ${error.message}`);
      }

      // Agrupar por proveedor
      const supplierStats = new Map<string, {
        supplier_id: string;
        supplier_name: string;
        total_orders: number;
        total_amount: number;
        orders_by_status: Record<string, number>;
        last_order_date?: string;
      }>();

      data?.forEach((order: any) => {
        const supplierId = order.supplier_id;
        const supplierName = order.supplier?.name || 'Sin nombre';

        if (!supplierStats.has(supplierId)) {
          supplierStats.set(supplierId, {
            supplier_id: supplierId,
            supplier_name: supplierName,
            total_orders: 0,
            total_amount: 0,
            orders_by_status: {
              draft: 0,
              pending: 0,
              approved: 0,
              received: 0,
              cancelled: 0
            },
            last_order_date: order.order_date
          });
        }

        const stats = supplierStats.get(supplierId)!;
        stats.total_orders += 1;
        stats.total_amount += order.total_amount;
        stats.orders_by_status[order.status] += 1;

        // Actualizar última fecha de orden
        if (!stats.last_order_date || order.order_date > stats.last_order_date) {
          stats.last_order_date = order.order_date;
        }
      });

      // Convertir a array y calcular promedios
      return Array.from(supplierStats.values()).map(stats => ({
        supplier_id: stats.supplier_id,
        supplier_name: stats.supplier_name,
        total_orders: stats.total_orders,
        total_amount: stats.total_amount,
        average_order_amount: stats.total_orders > 0 ? stats.total_amount / stats.total_orders : 0,
        last_order_date: stats.last_order_date,
        orders_by_status: {
          draft: stats.orders_by_status.draft || 0,
          pending: stats.orders_by_status.pending || 0,
          approved: stats.orders_by_status.approved || 0,
          received: stats.orders_by_status.received || 0,
          cancelled: stats.orders_by_status.cancelled || 0
        }
      }));
    } catch (error) {
      console.error('Error en generatePurchaseReport:', error);
      throw error;
    }
  }

  /**
   * Eliminar orden de compra (solo si está en draft)
   */
  static async deletePurchaseOrder(id: string): Promise<ApiResponse<void>> {
    try {
      // Verificar que la orden esté en estado draft
      const { data: order, error: checkError } = await supabase
        .from('purchase_orders')
        .select('status')
        .eq('id', id)
        .single();

      if (checkError) {
        throw new Error(`Error al verificar orden: ${checkError.message}`);
      }

      if (order.status !== 'draft') {
        throw new Error('Solo se pueden eliminar órdenes en estado borrador');
      }

      // Eliminar items primero
      await supabase
        .from('purchase_order_items')
        .delete()
        .eq('purchase_order_id', id);

      // Eliminar orden
      const { error } = await supabase
        .from('purchase_orders')
        .delete()
        .eq('id', id);

      if (error) {
        throw new Error(`Error al eliminar orden de compra: ${error.message}`);
      }

      return {
        success: true,
        message: 'Orden de compra eliminada exitosamente'
      };
    } catch (error) {
      console.error('Error en deletePurchaseOrder:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }
}
