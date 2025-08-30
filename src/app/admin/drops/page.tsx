'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase/client';
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
import { Plus } from 'lucide-react';
import type { Database } from '@/types/database';

// Use types from database instead of duplicate interfaces
type Drop = Database['public']['Tables']['drops']['Row'];
type Location = Database['public']['Tables']['locations']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

export default function DropManagementPage() {
  // Consolidate drops state
  const [dropsState, setDropsState] = useState({
    upcomingDrops: [] as AdminDrop[],
    pastDrops: [] as AdminDrop[],
  });

  // Consolidate reference data state
  const [referenceData, setReferenceData] = useState({
    locations: [] as Location[],
    products: [] as Product[],
  });

  // Consolidate UI state
  const [uiState, setUiState] = useState({
    loading: true,
    creating: false,
    showCreateForm: false,
    showInventoryModal: false,
    showEditModal: false,
  });

  // Consolidate form state
  const [formState, setFormState] = useState({
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
  });

  // Consolidate selected items state
  const [selectedItems, setSelectedItems] = useState({
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
  });

  // Separate state for complex objects
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [inventory, setInventory] = useState<{ [key: string]: number }>({});
  const router = useRouter();

  // Update drops state helper
  const updateDropsState = (updates: Partial<typeof dropsState>) => {
    setDropsState(prev => ({ ...prev, ...updates }));
  };

  // Update reference data helper
  const updateReferenceData = (updates: Partial<typeof referenceData>) => {
    setReferenceData(prev => ({ ...prev, ...updates }));
  };

  // Update UI state helper
  const updateUiState = (updates: Partial<typeof uiState>) => {
    setUiState(prev => ({ ...prev, ...updates }));
  };

  // Update form state helper
  const updateFormState = (updates: Partial<typeof formState>) => {
    setFormState(prev => ({ ...prev, ...updates }));
  };

  // Update selected items helper
  const updateSelectedItems = (updates: Partial<typeof selectedItems>) => {
    setSelectedItems(prev => ({ ...prev, ...updates }));
  };

  useEffect(() => {
    checkAuth();
    loadData();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    }
  };

  const loadData = async () => {
    try {
      // Load upcoming drops using enhanced function
      const upcomingDropsData = await fetchAdminUpcomingDrops();
      updateDropsState({ upcomingDrops: upcomingDropsData });

      // Load past drops using enhanced function
      const pastDropsData = await fetchAdminPastDrops();
      updateDropsState({ pastDrops: pastDropsData });

      // Load locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (locationsError) {
        console.error('Error loading locations:', locationsError);
      } else {
        updateReferenceData({ locations: locationsData || [] });
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
        updateReferenceData({ products: productsData || [] });
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load drop data. Please refresh the page.',
      });
    } finally {
      updateUiState({ loading: false });
    }
  };

  const createDrop = async () => {
    if (!formState.newDrop.date || !formState.newDrop.location) {
      setMessage({
        type: 'error',
        text: 'Please select both a drop date and location',
      });
      return;
    }

    updateUiState({ creating: true });
    setMessage(null);

    try {
      const { error } = await supabase.from('drops').insert({
        date: formState.newDrop.date,
        location_id: formState.newDrop.location,
        status: formState.newDrop.status,
      });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setMessage({
        type: 'success',
        text: 'Drop created successfully! You can now manage its menu.',
      });
      updateUiState({ showCreateForm: false });
      updateFormState({
        newDrop: { date: '', location: '', status: 'upcoming' },
      });

      // Reload data to show the new drop
      await loadData();
    } catch (error) {
      console.error('Error creating drop:', error);
      setMessage({
        type: 'error',
        text: 'Failed to create drop. Please try again.',
      });
    } finally {
      updateUiState({ creating: false });
    }
  };

  const openInventoryModal = (
    drop: AdminDrop & {
      drop_products_count?: number;
      drop_products_total?: number;
    }
  ) => {
    updateSelectedItems({ selectedDrop: drop });

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

        setInventory(currentInventory);
      } catch (error) {
        console.error('Error loading inventory:', error);
      }
    };

    loadCurrentInventory();
    updateUiState({ showInventoryModal: true });
  };

  const openEditModal = (
    drop: AdminDrop & {
      drop_products_count?: number;
      drop_products_total?: number;
    }
  ) => {
    updateSelectedItems({ editingDrop: drop });
    updateFormState({
      editDrop: {
        date: drop.date,
        location: drop.location_id || '',
        status:
          (drop.status as 'upcoming' | 'active' | 'completed' | 'cancelled') ||
          'upcoming',
      },
    });
    updateUiState({ showEditModal: true });
  };

  const saveDropMenu = async () => {
    if (!selectedItems.selectedDrop) return;

    try {
      // Get products with quantities > 0
      const productsToInclude = Object.entries(inventory)
        .filter(([productId, quantity]) => quantity > 0)
        .map(([productId, quantity]) => {
          const product = referenceData.products.find(p => p.id === productId);
          if (!product) {
            throw new Error(`Product ${productId} not found`);
          }

          return {
            drop_id: selectedItems.selectedDrop!.id,
            product_id: productId,
            stock_quantity: quantity,
            selling_price: product.sell_price,
          };
        });

      // Check if there are any orders for this drop
      const { data: ordersCheck, error: ordersCheckError } = await supabase
        .from('orders')
        .select('id')
        .eq('drop_id', selectedItems.selectedDrop!.id);

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
            .eq('drop_id', selectedItems.selectedDrop!.id)
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
            .eq('drop_id', selectedItems.selectedDrop!.id);

          if (deleteError) {
            throw deleteError;
          }

          setMessage({
            type: 'success',
            text: 'Drop menu cleared successfully!',
          });
          updateUiState({ showInventoryModal: false });
          await loadData();
          return;
        }

        // Clear existing products and insert new ones
        const { error: deleteError } = await supabase
          .from('drop_products')
          .delete()
          .eq('drop_id', selectedItems.selectedDrop!.id);

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

      setMessage({
        type: 'success',
        text: `Drop menu updated with ${productsToInclude.length} products!`,
      });
      updateUiState({ showInventoryModal: false });
      await loadData();
    } catch (error) {
      console.error('Error saving drop menu:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save drop menu. Please try again.',
      });
    }
  };

  const saveEditDrop = async () => {
    if (!selectedItems.editingDrop) return;

    try {
      const { error } = await supabase
        .from('drops')
        .update({
          date: formState.editDrop.date,
          location_id: formState.editDrop.location,
          status: formState.editDrop.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedItems.editingDrop.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Drop updated successfully!' });
      updateUiState({ showEditModal: false });
      updateSelectedItems({ editingDrop: null });
      await loadData();
    } catch (error) {
      console.error('Error updating drop:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update drop. Please try again.',
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

      setMessage({ type: 'success', text: 'Drop deleted successfully!' });
      await loadData();
    } catch (error) {
      console.error('Error deleting drop:', error);
      setMessage({
        type: 'error',
        text: 'Failed to delete drop. Please try again.',
      });
    }
  };

  const handleStatusChange = async (
    dropId: string,
    newStatus: Drop['status']
  ) => {
    try {
      setMessage(null);

      const result = await changeDropStatus(dropId, newStatus);

      if (result.success) {
        setMessage({
          type: 'success',
          text: result.message,
        });

        // Reload data to reflect changes
        await loadData();
      }
    } catch (error) {
      console.error('Error changing drop status:', error);
      setMessage({
        type: 'error',
        text: 'Failed to change drop status. Please try again.',
      });
    }
  };

  const handleViewOrders = (dropId: string) => {
    router.push(`/admin/orders?drop=${dropId}`);
  };

  const handleInventoryChange = (productId: string, quantity: number) => {
    setInventory(prev => ({
      ...prev,
      [productId]: quantity,
    }));
  };

  if (uiState.loading) {
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
          onClick={() => updateUiState({ showCreateForm: true })}
          className="bg-black hover:bg-gray-800"
        >
          Create Drop
        </Button>
      }
    >
      {/* Message */}
      {message && (
        <Alert
          className={`mb-6 ${message.type === 'error' ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
        >
          <AlertDescription
            className={
              message.type === 'error' ? 'text-red-800' : 'text-green-800'
            }
          >
            {message.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Drop List */}
      <DropList
        upcomingDrops={dropsState.upcomingDrops}
        pastDrops={dropsState.pastDrops}
        onOpenInventory={openInventoryModal}
        onOpenEdit={openEditModal}
        onDeleteDrop={deleteDrop}
        onStatusChange={handleStatusChange}
        onViewOrders={handleViewOrders}
      />

      {/* Create Drop Modal */}
      <CreateDropModal
        open={uiState.showCreateForm}
        onOpenChange={() => updateUiState({ showCreateForm: false })}
        locations={referenceData.locations}
        onCreateDrop={createDrop}
        newDropDate={formState.newDrop.date}
        newDropLocation={formState.newDrop.location}
        newDropStatus={formState.newDrop.status}
        onNewDropDateChange={date =>
          updateFormState({ newDrop: { ...formState.newDrop, date } })
        }
        onNewDropLocationChange={location =>
          updateFormState({ newDrop: { ...formState.newDrop, location } })
        }
        onNewDropStatusChange={status =>
          updateFormState({ newDrop: { ...formState.newDrop, status } })
        }
        creating={uiState.creating}
      />

      {/* Edit Drop Modal */}
      <EditDropModal
        open={uiState.showEditModal}
        onOpenChange={() => updateUiState({ showEditModal: false })}
        locations={referenceData.locations}
        onSaveEdit={saveEditDrop}
        editDropDate={formState.editDrop.date}
        editDropLocation={formState.editDrop.location}
        editDropStatus={formState.editDrop.status}
        onEditDropDateChange={date =>
          updateFormState({ editDrop: { ...formState.editDrop, date } })
        }
        onEditDropLocationChange={location =>
          updateFormState({ editDrop: { ...formState.editDrop, location } })
        }
        onEditDropStatusChange={status =>
          updateFormState({ editDrop: { ...formState.editDrop, status } })
        }
      />

      {/* Inventory Management Modal */}
      <InventoryModal
        open={uiState.showInventoryModal}
        onOpenChange={() => updateUiState({ showInventoryModal: false })}
        selectedDrop={selectedItems.selectedDrop}
        products={referenceData.products}
        inventory={inventory}
        onInventoryChange={handleInventoryChange}
        onSaveDropMenu={saveDropMenu}
      />
    </AdminLayout>
  );
}
