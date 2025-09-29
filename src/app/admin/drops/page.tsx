'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AdminPageTemplate,
  AdminTable,
  AdminTableHeader,
  AdminTableHead,
  AdminTableBody,
  AdminTableRow,
  AdminTableCell,
  AdminCard,
  AdminCardContent,
  AdminButton,
  AdminBadge,
  CreateDropModal,
  EditDropModal,
  InventoryModal,
  DeleteDropModal,
} from '@/components/admin';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase/client';
import { useRequireAuth } from '@/lib/hooks';
import {
  fetchAdminUpcomingDrops,
  fetchAdminPastDrops,
  changeDropStatus,
  AdminDrop,
} from '@/lib/api/drops';
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  Calendar,
  Package,
  MoreHorizontal,
} from 'lucide-react';
import type { Database } from '@/types/database';

// Use types from database instead of duplicate interfaces
type Drop = Database['public']['Tables']['drops']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

export default function DropManagementPage() {
  // Consolidated state - single useState for all state management
  const [state, setState] = useState({
    // Data
    drops: { upcoming: [] as AdminDrop[], past: [] as AdminDrop[] },
    allDrops: [] as AdminDrop[], // Merged drops for single table
    locations: [] as Location[],
    products: [] as Product[],

    // Filter state
    statusFilter: 'all' as
      | 'all'
      | 'upcoming'
      | 'active'
      | 'completed'
      | 'cancelled',

    // UI State
    loading: true,
    creating: false,
    showCreateForm: false,
    showInventoryModal: false,
    showEditModal: false,
    showDeleteModal: false,
    deleting: false,
    archiving: false,

    // Forms
    newDrop: {
      date: '',
      location: '',
      status: 'upcoming' as 'upcoming' | 'active' | 'completed' | 'cancelled',
    },
    editDrop: {
      date: '',
      location: '',
      status: 'upcoming' as 'upcoming' | 'active' | 'completed' | 'cancelled',
    },

    // Selected Items
    selectedDrop: null as
      | (AdminDrop & {
          drop_products_count?: number;
          drop_products_total?: number;
        })
      | null,
    editingDrop: null as
      | (AdminDrop & {
          drop_products_count?: number;
          drop_products_total?: number;
        })
      | null,
    deletingDrop: null as AdminDrop | null,
    dropOrders: [] as Array<{
      id: string;
      order_number: string;
      customer_email: string;
      total_amount: number;
    }>,

    // Other
    message: null as { type: 'success' | 'error'; text: string } | null,
    inventory: {} as { [key: string]: number },
  });

  const router = useRouter();

  // Single update function for simple state updates
  const updateState = (updates: Partial<typeof state>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  // Nested updates helper for complex nested objects
  const updateNestedState = (
    path: keyof typeof state,
    updates: Record<string, unknown>
  ) => {
    setState(prev => ({
      ...prev,
      [path]: { ...(prev[path] as Record<string, unknown>), ...updates },
    }));
  };

  useRequireAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load upcoming drops using enhanced function
      const upcomingDropsData = await fetchAdminUpcomingDrops();
      updateNestedState('drops', { upcoming: upcomingDropsData });

      // Load past drops using enhanced function
      const pastDropsData = await fetchAdminPastDrops();
      updateNestedState('drops', { past: pastDropsData });

      // Merge all drops for single table
      const allDrops = [...upcomingDropsData, ...pastDropsData].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      updateState({ allDrops });

      // Load locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (locationsError) {
        console.error('Error loading locations:', locationsError);
      } else {
        updateState({ locations: locationsData || [] });
      }

      // Load products
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      if (productsError) {
        console.error('Error loading products:', productsError);
      } else {
        updateState({ products: productsData || [] });
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      updateState({
        message: {
          type: 'error',
          text: 'Failed to load drop data. Please refresh the page.',
        },
      });
    } finally {
      updateState({ loading: false });
    }
  };

  const createDrop = async () => {
    if (!state.newDrop.date || !state.newDrop.location) {
      updateState({
        message: {
          type: 'error',
          text: 'Please select both a drop date and location',
        },
      });
      return;
    }

    updateState({ creating: true, message: null });

    try {
      const { error } = await supabase.from('drops').insert({
        date: state.newDrop.date,
        location_id: state.newDrop.location,
        status: state.newDrop.status,
      });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      updateState({
        message: {
          type: 'success',
          text: 'Drop created successfully! You can now manage its menu.',
        },
        showCreateForm: false,
        newDrop: { date: '', location: '', status: 'upcoming' },
      });

      // Reload data to show the new drop
      await loadData();
    } catch (error) {
      console.error('Error creating drop:', error);
      updateState({
        message: {
          type: 'error',
          text: 'Failed to create drop. Please try again.',
        },
      });
    } finally {
      updateState({ creating: false });
    }
  };

  const openInventoryModal = (
    drop: AdminDrop & {
      drop_products_count?: number;
      drop_products_total?: number;
    }
  ) => {
    updateState({ selectedDrop: drop });

    // Load current inventory for this drop from database
    const loadCurrentInventory = async () => {
      try {
        const { data: dropProducts, error } = await supabase
          .from('drop_products')
          .select('product_id, stock_quantity')
          .eq('drop_id', drop.id);

        if (error) {
          console.error('Error loading current inventory:', error);
          return;
        }

        // Convert to inventory format
        const currentInventory: { [key: string]: number } = {};
        dropProducts?.forEach(dp => {
          currentInventory[dp.product_id] = dp.stock_quantity;
        });

        updateState({ inventory: currentInventory });
      } catch (error) {
        console.error('Error loading inventory:', error);
      }
    };

    loadCurrentInventory();
    updateState({ showInventoryModal: true });
  };

  const openEditModal = (
    drop: AdminDrop & {
      drop_products_count?: number;
      drop_products_total?: number;
    }
  ) => {
    updateState({
      editingDrop: drop,
      editDrop: {
        date: drop.date,
        location: drop.location_id || '',
        status:
          (drop.status as 'upcoming' | 'active' | 'completed' | 'cancelled') ||
          'upcoming',
      },
      showEditModal: true,
    });
  };

  const saveDropMenu = async () => {
    if (!state.selectedDrop) return;

    try {
      // Get products with quantities > 0
      const productsToInclude = Object.entries(state.inventory)
        .filter(([_, quantity]) => quantity > 0)
        .map(([productId, quantity]) => {
          const product = state.products.find(p => p.id === productId);
          if (!product) {
            throw new Error(`Product ${productId} not found`);
          }

          return {
            drop_id: state.selectedDrop!.id,
            product_id: productId,
            stock_quantity: quantity,
            selling_price: product.sell_price,
          };
        });

      // Check if there are any orders for this drop
      const { data: ordersCheck, error: ordersCheckError } = await supabase
        .from('orders')
        .select('id')
        .eq('drop_id', state.selectedDrop!.id);

      if (ordersCheckError) {
        throw ordersCheckError;
      }

      if (ordersCheck && ordersCheck.length > 0) {
        // If there are orders, we need to update existing drop_products
        // First, get current drop_products
        const { data: currentDropProducts, error: currentError } =
          await supabase
            .from('drop_products')
            .select('id, product_id, stock_quantity, selling_price')
            .eq('drop_id', state.selectedDrop!.id);

        if (currentError) {
          throw currentError;
        }

        // Update existing products and add new ones
        for (const productData of productsToInclude) {
          const existingProduct = currentDropProducts?.find(
            dp => dp.product_id === productData.product_id
          );

          if (existingProduct) {
            // Update existing product
            const { error: updateError } = await supabase
              .from('drop_products')
              .update({
                stock_quantity: productData.stock_quantity,
                selling_price: productData.selling_price,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingProduct.id);

            if (updateError) {
              throw updateError;
            }
          } else {
            // Insert new product
            const { error: insertError } = await supabase
              .from('drop_products')
              .insert(productData);

            if (insertError) {
              throw insertError;
            }
          }
        }

        // Remove products that are no longer in the menu
        const currentProductIds =
          currentDropProducts?.map(dp => dp.product_id) || [];
        const newProductIds = productsToInclude.map(p => p.product_id);
        const productsToRemove = currentProductIds.filter(
          id => !newProductIds.includes(id)
        );

        for (const productId of productsToRemove) {
          const { error: deleteError } = await supabase
            .from('drop_products')
            .delete()
            .eq('drop_id', state.selectedDrop!.id)
            .eq('product_id', productId);

          if (deleteError) {
            throw deleteError;
          }
        }
      } else {
        // No orders yet, we can clear and recreate the entire menu
        if (productsToInclude.length === 0) {
          // Clear all products
          const { error: deleteError } = await supabase
            .from('drop_products')
            .delete()
            .eq('drop_id', state.selectedDrop!.id);

          if (deleteError) {
            throw deleteError;
          }

          updateState({
            message: {
              type: 'success',
              text: 'Drop menu cleared successfully!',
            },
            showInventoryModal: false,
          });
          await loadData();
          return;
        }

        // Clear existing products and insert new ones
        const { error: deleteError } = await supabase
          .from('drop_products')
          .delete()
          .eq('drop_id', state.selectedDrop!.id);

        if (deleteError) {
          throw deleteError;
        }

        const { error: insertError } = await supabase
          .from('drop_products')
          .insert(productsToInclude);

        if (insertError) {
          throw insertError;
        }
      }

      updateState({
        message: {
          type: 'success',
          text: `Drop menu updated with ${productsToInclude.length} products!`,
        },
        showInventoryModal: false,
      });
      await loadData();
    } catch (error) {
      console.error('Error saving drop menu:', error);
      updateState({
        message: {
          type: 'error',
          text: 'Failed to save drop menu. Please try again.',
        },
      });
    }
  };

  const saveEditDrop = async () => {
    if (!state.editingDrop) return;

    try {
      const { error } = await supabase
        .from('drops')
        .update({
          date: state.editDrop.date,
          location_id: state.editDrop.location,
          status: state.editDrop.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', state.editingDrop.id);

      if (error) throw error;

      updateState({
        message: { type: 'success', text: 'Drop updated successfully!' },
        showEditModal: false,
        editingDrop: null,
      });
      await loadData();
    } catch (error) {
      console.error('Error updating drop:', error);
      updateState({
        message: {
          type: 'error',
          text: 'Failed to update drop. Please try again.',
        },
      });
    }
  };

  const openDeleteModal = async (drop: AdminDrop) => {
    try {
      console.log('Checking orders for drop:', drop.id);

      // Check if there are any orders for this drop
      // Join with clients table to get email
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(
          `
          id, 
          public_code, 
          customer_name, 
          total_amount,
          clients (
            email
          )
        `
        )
        .eq('drop_id', drop.id);

      if (ordersError) {
        console.error('Supabase error details:', {
          message: ordersError.message,
          details: ordersError.details,
          hint: ordersError.hint,
          code: ordersError.code,
        });
        updateState({
          message: {
            type: 'error',
            text: `Failed to check for existing orders: ${ordersError.message}`,
          },
        });
        return;
      }

      console.log('Orders found:', orders);

      // Transform orders to extract email from clients relationship
      const transformedOrders = (orders || []).map(order => ({
        id: order.id,
        order_number: order.public_code,
        customer_email:
          (order.clients as any)?.email || order.customer_name || 'No email',
        total_amount: order.total_amount,
      }));

      // Set the drop and orders, then show modal
      updateState({
        deletingDrop: drop,
        dropOrders: transformedOrders,
        showDeleteModal: true,
      });
    } catch (error) {
      console.error('Error loading orders for deletion:', error);
      updateState({
        message: {
          type: 'error',
          text: 'Failed to load order information. Please try again.',
        },
      });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!state.deletingDrop) return;

    console.log('Starting deletion process for drop:', {
      dropId: state.deletingDrop.id,
      dropDate: state.deletingDrop.date,
      orderCount: state.dropOrders.length,
      orders: state.dropOrders,
    });

    updateState({ deleting: true, message: null });

    try {
      // Proceed with deletion - this will cascade delete orders and drop_products
      console.log('Attempting to delete drop with ID:', state.deletingDrop.id);

      // First, let's check what's related to this drop
      const { data: dropProducts } = await supabase
        .from('drop_products')
        .select('id, product_id, stock_quantity')
        .eq('drop_id', state.deletingDrop.id);

      const { data: orderProducts } = await supabase
        .from('order_products')
        .select('id, drop_product_id, order_quantity')
        .in('drop_product_id', dropProducts?.map(dp => dp.id) || []);

      console.log('Related data before deletion:', {
        dropProducts: dropProducts?.length || 0,
        orderProducts: orderProducts?.length || 0,
        dropProductsData: dropProducts,
        orderProductsData: orderProducts,
      });

      // We need to delete in the correct order due to foreign key constraints:
      // 1. order_products (references drop_products with RESTRICT)
      // 2. orders (references drops with CASCADE, but we'll do it manually)
      // 3. drop_products (references drops with CASCADE, but we'll do it manually)
      // 4. drops (the main record)

      // Step 1: Delete order_products that reference drop_products from this drop
      if (orderProducts && orderProducts.length > 0) {
        console.log('Deleting order_products...');
        const { error: orderProductsError } = await supabase
          .from('order_products')
          .delete()
          .in('drop_product_id', dropProducts?.map(dp => dp.id) || []);

        if (orderProductsError) {
          console.error('Error deleting order_products:', orderProductsError);
          throw new Error(
            `Failed to delete order products: ${orderProductsError.message}`
          );
        }
      }

      // Step 2: Delete orders for this drop
      if (state.dropOrders.length > 0) {
        console.log('Deleting orders...');
        const { error: ordersError } = await supabase
          .from('orders')
          .delete()
          .eq('drop_id', state.deletingDrop.id);

        if (ordersError) {
          console.error('Error deleting orders:', ordersError);
          throw new Error(`Failed to delete orders: ${ordersError.message}`);
        }
      }

      // Step 3: Delete drop_products for this drop
      if (dropProducts && dropProducts.length > 0) {
        console.log('Deleting drop_products...');
        const { error: dropProductsError } = await supabase
          .from('drop_products')
          .delete()
          .eq('drop_id', state.deletingDrop.id);

        if (dropProductsError) {
          console.error('Error deleting drop_products:', dropProductsError);
          throw new Error(
            `Failed to delete drop products: ${dropProductsError.message}`
          );
        }
      }

      // Step 4: Finally delete the drop itself
      console.log('Deleting drop...');
      const { error } = await supabase
        .from('drops')
        .delete()
        .eq('id', state.deletingDrop.id);

      if (error) {
        console.error('Supabase deletion error details:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          fullError: error,
        });

        // Provide specific error messages based on the error
        if (error.code === '23503') {
          // Foreign key constraint violation
          updateState({
            message: {
              type: 'error',
              text: `Cannot delete drop due to database constraints: ${error.message}. This usually means there are related records that prevent deletion.`,
            },
          });
        } else {
          updateState({
            message: {
              type: 'error',
              text: `Failed to delete drop: ${error.message}`,
            },
          });
        }
        return;
      }

      console.log('✅ Drop deletion completed successfully!');

      const orderCount = state.dropOrders.length;
      const dropProductCount = dropProducts?.length || 0;
      const orderProductCount = orderProducts?.length || 0;

      updateState({
        message: {
          type: 'success',
          text:
            orderCount > 0
              ? `Drop deleted successfully! Removed: ${orderCount} order(s), ${dropProductCount} product(s), ${orderProductCount} order item(s).`
              : 'Drop deleted successfully!',
        },
        showDeleteModal: false,
        deletingDrop: null,
        dropOrders: [],
      });
      await loadData();
    } catch (error) {
      console.error('Error deleting drop:', error);
      updateState({
        message: {
          type: 'error',
          text: 'Failed to delete drop. Please try again.',
        },
      });
    } finally {
      updateState({ deleting: false });
    }
  };

  const handleArchiveDrop = async () => {
    if (!state.deletingDrop) return;

    updateState({ archiving: true, message: null });

    try {
      const result = await changeDropStatus(state.deletingDrop.id, 'cancelled');

      if (result.success) {
        const orderCount = state.dropOrders.length;
        updateState({
          message: {
            type: 'success',
            text:
              orderCount > 0
                ? `Drop archived successfully! ${orderCount} order(s) preserved.`
                : 'Drop archived successfully!',
          },
          showDeleteModal: false,
          deletingDrop: null,
          dropOrders: [],
        });
        await loadData();
      }
    } catch (error) {
      console.error('Error archiving drop:', error);
      updateState({
        message: {
          type: 'error',
          text: 'Failed to archive drop. Please try again.',
        },
      });
    } finally {
      updateState({ archiving: false });
    }
  };

  const handleStatusChange = async (
    dropId: string,
    newStatus: Drop['status']
  ) => {
    try {
      updateState({ message: null });

      const result = await changeDropStatus(dropId, newStatus);

      if (result.success) {
        updateState({
          message: {
            type: 'success',
            text: result.message,
          },
        });

        // Reload data to reflect changes
        await loadData();
      }
    } catch (error) {
      console.error('Error changing drop status:', error);
      updateState({
        message: {
          type: 'error',
          text: 'Failed to change drop status. Please try again.',
        },
      });
    }
  };

  const handleViewOrders = (dropId: string) => {
    router.push(`/admin/analytics?drop=${dropId}`);
  };

  const handleInventoryChange = (productId: string, quantity: number) => {
    updateNestedState('inventory', { [productId]: quantity });
  };

  if (state.loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading drops...</p>
        </div>
      </div>
    );
  }

  // Filter drops based on status
  const filteredDrops =
    state.statusFilter === 'all'
      ? state.allDrops
      : state.allDrops.filter(drop => drop.status === state.statusFilter);

  // Helper functions for table
  const getStatusBadge = (status: string | null) => {
    if (!status) return <AdminBadge variant="secondary">Unknown</AdminBadge>;

    switch (status) {
      case 'upcoming':
        return <AdminBadge variant="secondary">Upcoming</AdminBadge>;
      case 'active':
        return <AdminBadge variant="success">Active</AdminBadge>;
      case 'completed':
        return <AdminBadge variant="outline">Completed</AdminBadge>;
      case 'cancelled':
        return <AdminBadge variant="destructive">Cancelled</AdminBadge>;
      default:
        return <AdminBadge variant="secondary">{status}</AdminBadge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const day = date.getDate();
    const year = date.getFullYear();

    return `${weekday}. ${month} ${day}, ${year}`;
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  return (
    <AdminPageTemplate
      title="Drops"
      subtitle="Manage drop schedules and inventory"
      primaryAction={{
        label: 'Create Drop',
        onClick: () => updateState({ showCreateForm: true }),
        icon: Plus,
      }}
    >
      {/* Message */}
      {state.message && (
        <Alert
          className={`mb-6 ${state.message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
        >
          <AlertDescription
            className={
              state.message.type === 'error' ? 'text-red-800' : 'text-green-800'
            }
          >
            {state.message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Status Filter Buttons */}
      <div className="flex gap-2 mb-6">
        <AdminButton
          variant={state.statusFilter === 'all' ? 'admin-primary' : 'outline'}
          onClick={() => updateState({ statusFilter: 'all' })}
        >
          All
        </AdminButton>
        <AdminButton
          variant={
            state.statusFilter === 'upcoming' ? 'admin-primary' : 'outline'
          }
          onClick={() => updateState({ statusFilter: 'upcoming' })}
        >
          Upcoming
        </AdminButton>
        <AdminButton
          variant={
            state.statusFilter === 'active' ? 'admin-primary' : 'outline'
          }
          onClick={() => updateState({ statusFilter: 'active' })}
        >
          Active
        </AdminButton>
        <AdminButton
          variant={
            state.statusFilter === 'completed' ? 'admin-primary' : 'outline'
          }
          onClick={() => updateState({ statusFilter: 'completed' })}
        >
          Completed
        </AdminButton>
        <AdminButton
          variant={
            state.statusFilter === 'cancelled' ? 'admin-primary' : 'outline'
          }
          onClick={() => updateState({ statusFilter: 'cancelled' })}
        >
          Cancelled
        </AdminButton>
      </div>

      {/* Drops Table */}
      <AdminCard>
        <AdminCardContent className="p-0">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Date</AdminTableHead>
                <AdminTableHead>Location</AdminTableHead>
                <AdminTableHead>Status</AdminTableHead>
                <AdminTableHead>Inventory</AdminTableHead>
                <AdminTableHead>Sold</AdminTableHead>
                <AdminTableHead>Loss</AdminTableHead>
                <AdminTableHead>Total Sold</AdminTableHead>
                <AdminTableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {filteredDrops.map(drop => (
                <AdminTableRow key={drop.id}>
                  <AdminTableCell className="font-medium">
                    <div className="flex flex-col">
                      <span
                        className={isToday(drop.date) ? 'font-semibold' : ''}
                      >
                        {formatDate(drop.date)}
                      </span>
                      {isToday(drop.date) && (
                        <AdminBadge variant="outline" className="mt-1 w-fit">
                          Today
                        </AdminBadge>
                      )}
                    </div>
                  </AdminTableCell>
                  <AdminTableCell>
                    {drop.location_name || 'No location'}
                  </AdminTableCell>
                  <AdminTableCell>{getStatusBadge(drop.status)}</AdminTableCell>
                  <AdminTableCell className="text-gray-900">
                    {drop.total_inventory || 0}
                  </AdminTableCell>
                  <AdminTableCell className="text-gray-900">
                    {drop.total_orders || 0}
                  </AdminTableCell>
                  <AdminTableCell className="text-gray-900">
                    {drop.total_orders > 0 ? drop.total_loss || 0 : '–'}
                  </AdminTableCell>
                  <AdminTableCell className="text-gray-900">
                    {drop.total_inventory > 0 && drop.total_orders > 0
                      ? `${Math.round((drop.total_orders / drop.total_inventory) * 100)}%`
                      : '–'}
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
                    <div className="flex justify-end items-center gap-2">
                      {/* Status-specific action buttons */}
                      {drop.status === 'upcoming' && (
                        <AdminButton
                          size="sm"
                          variant="admin-primary"
                          onClick={() => handleStatusChange(drop.id, 'active')}
                        >
                          Open Orders
                        </AdminButton>
                      )}

                      {drop.status === 'active' && (
                        <AdminButton
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            handleStatusChange(drop.id, 'completed')
                          }
                        >
                          Close Orders
                        </AdminButton>
                      )}

                      {/* Options Menu */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <AdminButton
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="w-4 h-4" />
                          </AdminButton>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {/* Inventory Management */}
                          <DropdownMenuItem
                            onClick={() => openInventoryModal(drop)}
                          >
                            <Package className="w-4 h-4 mr-2" />
                            Manage Inventory
                          </DropdownMenuItem>

                          {/* View Orders */}
                          <DropdownMenuItem
                            onClick={() => handleViewOrders(drop.id)}
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            View Orders
                          </DropdownMenuItem>

                          {/* Edit */}
                          <DropdownMenuItem onClick={() => openEditModal(drop)}>
                            <Edit className="w-4 h-4 mr-2" />
                            Edit
                          </DropdownMenuItem>

                          {/* Delete */}
                          <DropdownMenuItem
                            onClick={() => openDeleteModal(drop)}
                            className="text-red-600 focus:text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
              {filteredDrops.length === 0 && (
                <AdminTableRow>
                  <AdminTableCell
                    colSpan={8}
                    className="text-center py-8 text-gray-500"
                  >
                    No drops found for the selected filter
                  </AdminTableCell>
                </AdminTableRow>
              )}
            </AdminTableBody>
          </AdminTable>
        </AdminCardContent>
      </AdminCard>

      {/* Create Drop Modal */}
      <CreateDropModal
        open={state.showCreateForm}
        onOpenChange={() => updateState({ showCreateForm: false })}
        locations={state.locations}
        onCreateDrop={createDrop}
        newDropDate={state.newDrop.date}
        newDropLocation={state.newDrop.location}
        newDropStatus={state.newDrop.status}
        onNewDropDateChange={date => updateNestedState('newDrop', { date })}
        onNewDropLocationChange={location =>
          updateNestedState('newDrop', { location })
        }
        onNewDropStatusChange={status =>
          updateNestedState('newDrop', { status })
        }
        creating={state.creating}
      />

      {/* Edit Drop Modal */}
      <EditDropModal
        open={state.showEditModal}
        onOpenChange={() => updateState({ showEditModal: false })}
        locations={state.locations}
        onSaveEdit={saveEditDrop}
        editDropDate={state.editDrop.date}
        editDropLocation={state.editDrop.location}
        editDropStatus={state.editDrop.status}
        onEditDropDateChange={date => updateNestedState('editDrop', { date })}
        onEditDropLocationChange={location =>
          updateNestedState('editDrop', { location })
        }
        onEditDropStatusChange={status =>
          updateNestedState('editDrop', { status })
        }
      />

      {/* Inventory Management Modal */}
      <InventoryModal
        open={state.showInventoryModal}
        onOpenChange={() => updateState({ showInventoryModal: false })}
        selectedDrop={state.selectedDrop}
        products={state.products}
        inventory={state.inventory}
        onInventoryChange={handleInventoryChange}
        onSaveDropMenu={saveDropMenu}
      />

      {/* Delete Drop Modal */}
      <DeleteDropModal
        open={state.showDeleteModal}
        onOpenChange={open => {
          if (!open) {
            updateState({
              showDeleteModal: false,
              deletingDrop: null,
              dropOrders: [],
            });
          }
        }}
        orders={state.dropOrders}
        onArchive={handleArchiveDrop}
        onDelete={handleDeleteConfirm}
        isDeleting={state.deleting}
        isArchiving={state.archiving}
      />
    </AdminPageTemplate>
  );
}
