'use client';

import { useState, useEffect } from 'react';
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
  AdminInput,
  AdminLabel,
} from '@/components/admin';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase/client';
import { useRequireAuth } from '@/lib/hooks';
import type { Database } from '@/types/database';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Phone,
  Calendar,
  MoreHorizontal,
} from 'lucide-react';

// Use types from database instead of duplicate interfaces
type Client = Database['public']['Tables']['clients']['Row'];

// Interface for client orders with drop information
interface ClientOrder {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  total_amount: number;
  created_at: string;
  client_id: string;
  drop_id: string;
  pickup_time: string;
  special_instructions: string | null;
  updated_at: string;
  drops?: {
    date: string;
  } | null;
}

// Extended client interface with computed properties
interface ClientWithStats extends Client {
  total_orders?: number;
  total_spent?: number;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<ClientWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientWithStats | null>(
    null
  );
  const [clientOrders, setClientOrders] = useState<ClientOrder[]>([]);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
  });
  const router = useRouter();

  useRequireAuth();

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      console.log('🔄 Loading clients...');

      // Load clients with order statistics
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('email', { ascending: true });

      if (clientsError) {
        console.error('❌ Error loading clients:', clientsError);
        return;
      }

      console.log('✅ Clients loaded:', clientsData);

      // For each client, get order statistics
      const clientsWithStats = await Promise.all(
        (clientsData || []).map(async client => {
          const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select('id, total_amount')
            .eq('client_id', client.id);

          if (ordersError) {
            console.error(
              `❌ Error loading orders for client ${client.id}:`,
              ordersError
            );
            return {
              ...client,
              total_orders: 0,
              total_spent: 0,
            };
          }

          const totalOrders = ordersData?.length || 0;
          const totalSpent =
            ordersData?.reduce(
              (sum, order) => sum + parseFloat(order.total_amount),
              0
            ) || 0;

          return {
            ...client,
            total_orders: totalOrders,
            total_spent: totalSpent,
          };
        })
      );

      console.log('✅ Clients with stats:', clientsWithStats);
      setClients(clientsWithStats);
    } catch (error) {
      console.error('❌ Unexpected error in loadClients:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      phone: '',
    });
  };

  const openCreateModal = () => {
    resetForm();
    setShowCreateModal(true);
  };

  const openEditModal = (client: Client) => {
    setFormData({
      email: client.email,
      phone: client.phone || '',
    });
    setEditingClient(client);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingClient(null);
    resetForm();
  };

  const saveClient = async () => {
    if (!formData.email) return;

    try {
      const clientData = {
        email: formData.email.toLowerCase(),
        phone: formData.phone || null,
      };

      if (editingClient) {
        // Update existing client
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id);

        if (error) throw error;
      } else {
        // Create new client
        const { error } = await supabase.from('clients').insert(clientData);

        if (error) throw error;
      }

      closeModal();
      await loadClients();
    } catch (error) {
      console.error('Error saving client:', error);
    }
  };

  const deleteClient = async (clientId: string) => {
    if (!confirm('Are you sure you want to delete this client?')) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientId);

      if (error) throw error;
      await loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  const openOrdersModal = async (client: Client) => {
    setSelectedClient(client);
    setShowOrdersModal(true);

    try {
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(
          `
          id,
          public_code,
          order_date,
          status,
          total_amount,
          created_at,
          client_id,
          drop_id,
          pickup_time,
          special_instructions,
          updated_at,
          drops (
            date
          )
        `
        )
        .eq('client_id', client.id)
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error loading client orders:', ordersError);
        setClientOrders([]);
      } else {
        // Transform the data to match our interface
        const transformedOrders: ClientOrder[] = (ordersData || []).map(
          (order: {
            id: string;
            public_code: string;
            order_date: string;
            status: string;
            total_amount: number;
            created_at: string;
            client_id: string;
            drop_id: string;
            pickup_time: string;
            special_instructions: string | null;
            updated_at: string;
            drops: { date: string }[] | null;
          }) => ({
            id: order.id,
            order_number: order.public_code,
            order_date: order.order_date,
            status: order.status,
            total_amount: order.total_amount,
            created_at: order.created_at,
            client_id: order.client_id,
            drop_id: order.drop_id,
            pickup_time: order.pickup_time,
            special_instructions: order.special_instructions,
            updated_at: order.updated_at,
            drops:
              order.drops && order.drops.length > 0 ? order.drops[0] : null,
          })
        );
        setClientOrders(transformedOrders);
      }
    } catch (error) {
      console.error('Error loading client orders:', error);
      setClientOrders([]);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <AdminPageTemplate
      title="Customers"
      subtitle="Manage customer information and history"
      primaryAction={{
        label: 'Add Customer',
        onClick: openCreateModal,
        icon: Plus,
      }}
    >
      {/* Customers Table */}
      <AdminCard>
        <AdminCardContent className="p-0">
          <AdminTable>
            <AdminTableHeader>
              <AdminTableRow>
                <AdminTableHead>Email</AdminTableHead>
                <AdminTableHead>Phone</AdminTableHead>
                <AdminTableHead>Total Orders</AdminTableHead>
                <AdminTableHead>Total Spent</AdminTableHead>
                <AdminTableHead>Created</AdminTableHead>
                <AdminTableHead className="w-12">
                  <span className="sr-only">Actions</span>
                </AdminTableHead>
              </AdminTableRow>
            </AdminTableHeader>
            <AdminTableBody>
              {clients.map(client => (
                <AdminTableRow key={client.id}>
                  <AdminTableCell className="font-medium">
                    {client.email}
                  </AdminTableCell>
                  <AdminTableCell>
                    {client.phone ? (
                      <div className="flex items-center space-x-2">
                        <Phone className="w-4 h-4 text-gray-400" />
                        <span>{client.phone}</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </AdminTableCell>
                  <AdminTableCell>{client.total_orders || 0}</AdminTableCell>
                  <AdminTableCell>
                    €{(client.total_spent || 0).toFixed(2)}
                  </AdminTableCell>
                  <AdminTableCell>
                    {client.created_at
                      ? new Date(client.created_at).toLocaleDateString()
                      : 'Unknown'}
                  </AdminTableCell>
                  <AdminTableCell className="text-right">
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
                        <DropdownMenuItem
                          onClick={() => openOrdersModal(client)}
                        >
                          <Calendar className="w-4 h-4 mr-2" />
                          View Orders
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditModal(client)}>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => deleteClient(client.id)}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </AdminTableCell>
                </AdminTableRow>
              ))}
            </AdminTableBody>
          </AdminTable>
        </AdminCardContent>
      </AdminCard>

      {/* Create/Edit Modal */}
      <Dialog
        open={showCreateModal || !!editingClient}
        onOpenChange={closeModal}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingClient ? 'Edit Customer' : 'Create Customer'}
            </DialogTitle>
            <DialogDescription>
              {editingClient
                ? 'Update customer information'
                : 'Add a new customer'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <AdminLabel htmlFor="email">Email</AdminLabel>
              <AdminInput
                id="email"
                type="email"
                value={formData.email}
                onChange={e =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="customer@example.com"
              />
            </div>

            <div>
              <AdminLabel htmlFor="phone">Phone (Optional)</AdminLabel>
              <AdminInput
                id="phone"
                value={formData.phone}
                onChange={e =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="+1234567890"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <AdminButton onClick={closeModal} variant="outline">
              <X className="w-4 h-4 mr-2" />
              Cancel
            </AdminButton>
            <AdminButton onClick={saveClient} variant="admin-primary">
              <Save className="w-4 h-4 mr-2" />
              {editingClient ? 'Update' : 'Create'}
            </AdminButton>
          </div>
        </DialogContent>
      </Dialog>

      {/* Orders Modal */}
      <Dialog open={showOrdersModal} onOpenChange={setShowOrdersModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Order History - {selectedClient?.email}</DialogTitle>
            <DialogDescription>
              View all orders for this customer
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-96 overflow-y-auto">
            {clientOrders.length > 0 ? (
              <AdminTable>
                <AdminTableHeader>
                  <AdminTableRow>
                    <AdminTableHead>Order #</AdminTableHead>
                    <AdminTableHead>Date</AdminTableHead>
                    <AdminTableHead>Status</AdminTableHead>
                    <AdminTableHead>Amount</AdminTableHead>
                  </AdminTableRow>
                </AdminTableHeader>
                <AdminTableBody>
                  {clientOrders.map(order => (
                    <AdminTableRow key={order.id}>
                      <AdminTableCell className="font-medium">
                        {order.order_number}
                      </AdminTableCell>
                      <AdminTableCell>
                        {new Date(order.created_at).toLocaleDateString()}
                      </AdminTableCell>
                      <AdminTableCell>
                        <AdminBadge variant="outline">
                          {order.status}
                        </AdminBadge>
                      </AdminTableCell>
                      <AdminTableCell>€{order.total_amount}</AdminTableCell>
                    </AdminTableRow>
                  ))}
                </AdminTableBody>
              </AdminTable>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No orders found for this customer</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </AdminPageTemplate>
  );
}
