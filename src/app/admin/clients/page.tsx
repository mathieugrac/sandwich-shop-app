'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Users,
  Mail,
  Phone,
  Calendar,
  Euro,
} from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  created_at: string;
  updated_at: string;
  total_orders?: number;
  total_spent?: number;
}

interface Order {
  id: string;
  order_number: string;
  order_date: string;
  status: string;
  total_amount: number;
  created_at: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [showOrdersModal, setShowOrdersModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientOrders, setClientOrders] = useState<Order[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadClients();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    }
  };

  const loadClients = async () => {
    try {
      console.log('🔄 Loading clients...');

      // Load clients with order statistics
      const { data: clientsData, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

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
      name: '',
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
      name: client.name,
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
    if (!formData.name || !formData.email) return;

    try {
      const clientData = {
        name: formData.name,
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
                  order_number,
        order_date,
        status,
        total_amount,
        created_at,
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
        setClientOrders(ordersData || []);
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
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => router.push('/admin/dashboard')}
              variant="ghost"
              size="sm"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
              <p className="text-gray-600">
                Manage customer information and history
              </p>
            </div>
          </div>
          <Button
            onClick={openCreateModal}
            className="bg-black hover:bg-gray-800"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Clients Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Total Orders</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.map(client => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">{client.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Mail className="w-4 h-4 text-gray-400" />
                        <span>{client.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {client.phone ? (
                        <div className="flex items-center space-x-2">
                          <Phone className="w-4 h-4 text-gray-400" />
                          <span>{client.phone}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {client.total_orders || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Euro className="w-4 h-4 text-gray-400" />
                        <span>{(client.total_spent || 0).toFixed(2)}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(client.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openOrdersModal(client)}
                        >
                          <Calendar className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openEditModal(client)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteClient(client.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Modal */}
        <Dialog
          open={showCreateModal || !!editingClient}
          onOpenChange={closeModal}
        >
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingClient ? 'Edit Client' : 'Create Client'}
              </DialogTitle>
              <DialogDescription>
                {editingClient
                  ? 'Update client information'
                  : 'Add a new client'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="Client name"
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  placeholder="client@example.com"
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone (Optional)</Label>
                <Input
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
              <Button onClick={closeModal} variant="outline">
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                onClick={saveClient}
                className="bg-black hover:bg-gray-800"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingClient ? 'Update' : 'Create'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Orders Modal */}
        <Dialog open={showOrdersModal} onOpenChange={setShowOrdersModal}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>Order History - {selectedClient?.name}</DialogTitle>
              <DialogDescription>
                View all orders for this client
              </DialogDescription>
            </DialogHeader>

            <div className="max-h-96 overflow-y-auto">
              {clientOrders.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order #</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientOrders.map(order => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.order_number}
                        </TableCell>
                        <TableCell>
                          {new Date(order.created_at).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{order.status}</Badge>
                        </TableCell>
                        <TableCell>€{order.total_amount}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No orders found for this client</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
