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
  calculatePickupDeadline,
} from '@/lib/api/drops';
import {
  AdminLayout,
  DropList,
  CreateDropModal,
  EditDropModal,
  InventoryModal,
} from '@/components/admin';
import { Plus } from 'lucide-react';
import { Drop, Location, Product, AdminDrop } from '@/types/database';

export default function DropManagementPage() {
  const [upcomingDrops, setUpcomingDrops] = useState<AdminDrop[]>([]);
  const [pastDrops, setPastDrops] = useState<AdminDrop[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState<
    | (AdminDrop & {
        drop_products_count?: number;
        drop_products_total?: number;
      })
    | null
  >(null);
  const [editingDrop, setEditingDrop] = useState<
    | (AdminDrop & {
        drop_products_count?: number;
        drop_products_total?: number;
      })
    | null
  >(null);
  const [newDropDate, setNewDropDate] = useState('');
  const [newDropLocation, setNewDropLocation] = useState('');
  const [newDropStatus, setNewDropStatus] = useState<
    'upcoming' | 'active' | 'completed' | 'cancelled'
  >('upcoming');
  const [editDropDate, setEditDropDate] = useState('');
  const [editDropLocation, setEditDropLocation] = useState('');
  const [editDropStatus, setEditDropStatus] = useState<
    'upcoming' | 'active' | 'completed' | 'cancelled'
  >('upcoming');
  const [inventory, setInventory] = useState<{ [key: string]: number }>({});
  const router = useRouter();

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
      setUpcomingDrops(upcomingDropsData);

      // Load past drops using enhanced function
      const pastDropsData = await fetchAdminPastDrops();
      setPastDrops(pastDropsData);

      // Load locations
      const { data: locationsData, error: locationsError } = await supabase
        .from('locations')
        .select('*')
        .eq('active', true)
        .order('name');

      if (locationsError) {
        console.error('Error loading locations:', locationsError);
      } else {
        setLocations(locationsData || []);
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
        setProducts(productsData || []);
      }
    } catch (error) {
      console.error('Error in loadData:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load drop data. Please refresh the page.',
      });
    } finally {
      setLoading(false);
    }
  };

  const createDrop = async () => {
    if (!newDropDate || !newDropLocation) {
      setMessage({
        type: 'error',
        text: 'Please select both a drop date and location',
      });
      return;
    }

    setCreating(true);
    setMessage(null);

    try {
      // Calculate pickup deadline automatically
      const { deadline } = await calculatePickupDeadline(
        newDropDate,
        newDropLocation
      );

      const { data: drop, error } = await supabase
        .from('drops')
        .insert({
          date: newDropDate,
          location_id: newDropLocation,
          status: newDropStatus,
          pickup_deadline: deadline,
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      setMessage({
        type: 'success',
        text: 'Drop created successfully! You can now manage its menu.',
      });
      setShowCreateForm(false);
      setNewDropDate('');
      setNewDropLocation('');
      setNewDropStatus('upcoming');

      // Reload data to show the new drop
      await loadData();
    } catch (error) {
      console.error('Error creating drop:', error);
      setMessage({
        type: 'error',
        text: 'Failed to create drop. Please try again.',
      });
    } finally {
      setCreating(false);
    }
  };

  const openInventoryModal = async (
    drop: AdminDrop & {
      drop_products_count?: number;
      drop_products_total?: number;
    }
  ) => {
    setSelectedDrop(drop);

    // Load current inventory for this drop from database
    const { data: inventoryData } = await supabase
      .from('drop_products')
      .select(
        `
        *,
        products (
          id,
          name,
          description,
          sell_price
        )
      `
      )
      .eq('drop_id', drop.id);

    if (inventoryData && inventoryData.length > 0) {
      // Transform the data to match our interface
      const inventoryMap: { [key: string]: number } = {};
      inventoryData.forEach(item => {
        inventoryMap[item.product_id] = item.stock_quantity;
      });
      setInventory(inventoryMap);
    } else {
      // Initialize with NO products (empty inventory)
      setInventory({});
    }

    setShowInventoryModal(true);
  };

  const openEditModal = (
    drop: AdminDrop & {
      drop_products_count?: number;
      drop_products_total?: number;
    }
  ) => {
    setEditingDrop(drop);
    setEditDropDate(drop.date);
    setEditDropLocation(drop.location_id);
    setEditDropStatus(drop.status);
    setShowEditModal(true);
  };

  const saveDropMenu = async () => {
    if (!selectedDrop) return;

    try {
      // Get only products that have quantities > 0 (products actually in this drop's menu)
      const productsToInclude = Object.entries(inventory)
        .filter(([productId, quantity]) => quantity > 0)
        .map(([productId, quantity]) => {
          const product = products.find(p => p.id === productId);
          if (!product) {
            throw new Error(`Product ${productId} not found`);
          }

          return {
            drop_id: selectedDrop.id,
            product_id: productId,
            stock_quantity: quantity,
            reserved_quantity: 0,
            selling_price: product.sell_price,
          };
        });

      // Check if there are existing orders for this drop
      const { data: existingOrders, error: ordersCheckError } = await supabase
        .from('orders')
        .select('id')
        .eq('drop_id', selectedDrop.id);

      if (ordersCheckError) {
        console.error('Error checking existing orders:', ordersCheckError);
        throw ordersCheckError;
      }

      const hasExistingOrders = existingOrders && existingOrders.length > 0;

      if (hasExistingOrders) {
        // Get current drop products to see what needs to be updated vs inserted
        const { data: currentDropProducts, error: currentError } =
          await supabase
            .from('drop_products')
            .select('id, product_id, stock_quantity, selling_price')
            .eq('drop_id', selectedDrop.id);

        if (currentError) {
          console.error('Error fetching current drop products:', currentError);
          throw currentError;
        }

        // Create a map of current products for easy lookup
        const currentProductsMap = new Map(
          currentDropProducts?.map(dp => [dp.product_id, dp]) || []
        );

        // Process each product to include
        for (const productToInclude of productsToInclude) {
          const existingProduct = currentProductsMap.get(
            productToInclude.product_id
          );

          if (existingProduct) {
            // Update existing product
            const { error: updateError } = await supabase
              .from('drop_products')
              .update({
                stock_quantity: productToInclude.stock_quantity,
                selling_price: productToInclude.selling_price,
                updated_at: new Date().toISOString(),
              })
              .eq('id', existingProduct.id);

            if (updateError) {
              console.error('Error updating drop product:', updateError);
              throw updateError;
            }
          } else {
            // Insert new product
            const { error: insertError } = await supabase
              .from('drop_products')
              .insert(productToInclude);

            if (insertError) {
              console.error('Error inserting new drop product:', insertError);
              throw insertError;
            }
          }
        }

        // Remove products that are no longer in the menu (only if no orders exist)
        const productsToRemove =
          currentDropProducts?.filter(
            cp => !productsToInclude.some(p => p.product_id === cp.product_id)
          ) || [];

        for (const productToRemove of productsToRemove) {
          // Check if this specific drop_product has any orders
          const { data: productOrders, error: productOrdersError } =
            await supabase
              .from('order_products')
              .select('id')
              .eq('drop_product_id', productToRemove.id);

          if (productOrdersError) {
            console.error('Error checking product orders:', productOrdersError);
            throw productOrdersError;
          }

          if (productOrders && productOrders.length > 0) {
            // Set quantity to 0 instead of deleting
            const { error: zeroError } = await supabase
              .from('drop_products')
              .update({
                stock_quantity: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', productToRemove.id);

            if (zeroError) {
              console.error('Error zeroing drop product:', zeroError);
              throw zeroError;
            }
          } else {
            // Safe to delete
            const { error: deleteError } = await supabase
              .from('drop_products')
              .delete()
              .eq('id', productToRemove.id);

            if (deleteError) {
              console.error('Error deleting drop product:', deleteError);
              throw deleteError;
            }
          }
        }
      } else {
        // First, remove all existing products from this drop
        const { error: deleteError } = await supabase
          .from('drop_products')
          .delete()
          .eq('drop_id', selectedDrop.id);

        if (deleteError) {
          console.error('Error removing existing products:', deleteError);
          throw deleteError;
        }

        // If no products to include, we're done (drop has empty menu)
        if (productsToInclude.length === 0) {
          setMessage({
            type: 'success',
            text: 'Drop menu cleared successfully!',
          });
          setShowInventoryModal(false);
          await loadData();
          return;
        }

        // Add the selected products to this drop's menu
        const { error: insertError } = await supabase
          .from('drop_products')
          .insert(productsToInclude);

        if (insertError) {
          console.error('Error adding products to drop:', insertError);
          throw insertError;
        }
      }

      setMessage({
        type: 'success',
        text: `Drop menu updated with ${productsToInclude.length} products!`,
      });
      setShowInventoryModal(false);
      await loadData();
    } catch (error) {
      console.error('Error updating drop menu:', error);
      if (error instanceof Error) {
        setMessage({
          type: 'error',
          text: `Failed to update drop menu: ${error.message}`,
        });
      } else {
        setMessage({
          type: 'error',
          text: 'Failed to update drop menu. Please try again.',
        });
      }
    }
  };

  const saveEditDrop = async () => {
    if (!editingDrop) return;

    try {
      const { error } = await supabase
        .from('drops')
        .update({
          date: editDropDate,
          location_id: editDropLocation,
          status: editDropStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingDrop.id);

      if (error) throw error;

      setMessage({ type: 'success', text: 'Drop updated successfully!' });
      setShowEditModal(false);
      setEditingDrop(null);
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

  if (loading) {
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
          onClick={() => setShowCreateForm(true)}
          className="bg-black hover:bg-gray-800"
        >
          <Plus className="w-4 h-4 mr-2" />
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
        upcomingDrops={upcomingDrops}
        pastDrops={pastDrops}
        onOpenInventory={openInventoryModal}
        onOpenEdit={openEditModal}
        onDeleteDrop={deleteDrop}
        onStatusChange={handleStatusChange}
        onViewOrders={handleViewOrders}
      />

      {/* Create Drop Modal */}
      <CreateDropModal
        open={showCreateForm}
        onOpenChange={setShowCreateForm}
        locations={locations}
        onCreateDrop={createDrop}
        newDropDate={newDropDate}
        newDropLocation={newDropLocation}
        newDropStatus={newDropStatus}
        onNewDropDateChange={setNewDropDate}
        onNewDropLocationChange={setNewDropLocation}
        onNewDropStatusChange={setNewDropStatus}
        creating={creating}
      />

      {/* Edit Drop Modal */}
      <EditDropModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        locations={locations}
        onSaveEdit={saveEditDrop}
        editDropDate={editDropDate}
        editDropLocation={editDropLocation}
        editDropStatus={editDropStatus}
        onEditDropDateChange={setEditDropDate}
        onEditDropLocationChange={setEditDropLocation}
        onEditDropStatusChange={setEditDropStatus}
      />

      {/* Inventory Management Modal */}
      <InventoryModal
        open={showInventoryModal}
        onOpenChange={setShowInventoryModal}
        selectedDrop={selectedDrop}
        products={products}
        inventory={inventory}
        onInventoryChange={handleInventoryChange}
        onSaveDropMenu={saveDropMenu}
      />
    </AdminLayout>
  );
}
