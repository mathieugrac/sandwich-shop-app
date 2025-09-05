'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
import { useRequireAuth } from '@/lib/hooks';
import {
  fetchAdminUpcomingDrops,
  fetchAdminPastDrops,
  changeDropStatus,
  AdminDrop,
} from '@/lib/api/drops';
import {
  AdminLayout,
  DropList,
  CreateDropModal,
  EditDropModal,
  InventoryModal,
} from '@/components/admin';
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
    locations: [] as Location[],
    products: [] as Product[],

    // UI State
    loading: true,
    creating: false,
    showCreateForm: false,
    showInventoryModal: false,
    showEditModal: false,

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
            .eq('drop_id', selectedItems.selectedDrop!.id);

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

  const deleteDrop = async (dropId: string) => {
    if (
      !confirm(
        'Are you sure you want to delete this drop? This action cannot be undone.'
      )
    ) {
      return;
    }

    try {
      // Delete the drop (this will cascade delete related inventory and orders)
      const { error } = await supabase.from('drops').delete().eq('id', dropId);

      if (error) throw error;

      updateState({
        message: { type: 'success', text: 'Drop deleted successfully!' },
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

  return (
    <AdminLayout
      title="Drop Management"
      backUrl="/admin/dashboard"
      actionButton={
        <Button
          onClick={() => updateState({ showCreateForm: true })}
          className="bg-black hover:bg-gray-800"
        >
          Create Drop
        </Button>
      }
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

      {/* Drop List */}
      <DropList
        upcomingDrops={state.drops.upcoming}
        pastDrops={state.drops.past}
        onOpenInventory={openInventoryModal}
        onOpenEdit={openEditModal}
        onDeleteDrop={deleteDrop}
        onStatusChange={handleStatusChange}
        onViewOrders={handleViewOrders}
      />

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
    </AdminLayout>
  );
}
