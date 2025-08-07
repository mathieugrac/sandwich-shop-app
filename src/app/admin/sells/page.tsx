'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase/client';
import {
  ArrowLeft,
  Plus,
  Calendar,
  Settings,
  CheckCircle,
  Clock,
  AlertCircle,
  Loader2,
  Edit,
  Trash2,
} from 'lucide-react';

interface Sell {
  id: string;
  sell_date: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  announcement_sent: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  sort_order: number;
}

export default function SellManagementPage() {
  const [sells, setSells] = useState<Sell[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newSellDate, setNewSellDate] = useState('');
  const [newSellNotes, setNewSellNotes] = useState('');
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadSells();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    }
  };

  const loadSells = async () => {
    try {
      // Load sells
      const { data: sellsData } = await supabase
        .from('sells')
        .select('*')
        .order('sell_date', { ascending: true });

      // Load products
      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .eq('active', true)
        .order('sort_order');

      setSells(sellsData || []);
      setProducts(productsData || []);
    } catch (error) {
      console.error('Error loading sells:', error);
    } finally {
      setLoading(false);
    }
  };

  const createSell = async () => {
    if (!newSellDate) {
      setMessage({ type: 'error', text: 'Please select a sell date' });
      return;
    }

    setCreating(true);
    setMessage(null);

    try {
      const { data: sell, error } = await supabase
        .from('sells')
        .insert({
          sell_date: newSellDate,
          status: 'draft',
          notes: newSellNotes,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Create inventory for all products
      const inventoryData = products.map(product => ({
        sell_id: sell.id,
        product_id: product.id,
        total_quantity: 0, // Default to 0, admin will set later
        reserved_quantity: 0,
      }));

      await supabase.from('sell_inventory').insert(inventoryData);

      setMessage({ type: 'success', text: 'Sell created successfully!' });
      setShowCreateForm(false);
      setNewSellDate('');
      setNewSellNotes('');
      await loadSells();
    } catch (error) {
      console.error('Error creating sell:', error);
      setMessage({
        type: 'error',
        text: 'Failed to create sell. Please try again.',
      });
    } finally {
      setCreating(false);
    }
  };

  const updateSellStatus = async (sellId: string, newStatus: string) => {
    try {
      await supabase
        .from('sells')
        .update({ status: newStatus })
        .eq('id', sellId);

      // Update local state
      setSells(
        sells.map(sell =>
          sell.id === sellId
            ? { ...sell, status: newStatus as Sell['status'] }
            : sell
        )
      );
    } catch (error) {
      console.error('Error updating sell status:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">Draft</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft':
        return <Clock className="h-4 w-4" />;
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  const isFuture = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString > today;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading sells...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold">Sell Management</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Sell
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4">
        {message && (
          <Alert
            className={`mb-4 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
          >
            <AlertDescription
              className={
                message.type === 'success' ? 'text-green-800' : 'text-red-800'
              }
            >
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Create Sell Form */}
        {showCreateForm && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Create New Sell</CardTitle>
              <CardDescription>
                Create a new sell for a specific date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="sellDate">Sell Date</Label>
                  <Input
                    id="sellDate"
                    type="date"
                    value={newSellDate}
                    onChange={e => setNewSellDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sellNotes">Notes (Optional)</Label>
                  <Input
                    id="sellNotes"
                    value={newSellNotes}
                    onChange={e => setNewSellNotes(e.target.value)}
                    placeholder="Any notes about this sell..."
                  />
                </div>

                <div className="flex space-x-2">
                  <Button
                    onClick={createSell}
                    disabled={creating}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {creating ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Sell'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreateForm(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Sells List */}
        <div className="space-y-4">
          {sells.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No sells found
                </h3>
                <p className="text-gray-500">
                  Create your first sell to get started
                </p>
              </CardContent>
            </Card>
          ) : (
            sells.map(sell => (
              <Card key={sell.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(sell.status)}
                      <div>
                        <CardTitle className="text-lg">
                          {formatDate(sell.sell_date)}
                          {isToday(sell.sell_date) && (
                            <Badge className="ml-2 bg-blue-100 text-blue-800">
                              Today
                            </Badge>
                          )}
                          {isFuture(sell.sell_date) && (
                            <Badge className="ml-2 bg-green-100 text-green-800">
                              Future
                            </Badge>
                          )}
                        </CardTitle>
                        <CardDescription>
                          Created{' '}
                          {new Date(sell.created_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(sell.status)}
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {sell.announcement_sent
                            ? 'Announced'
                            : 'Not announced'}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {sell.notes && (
                    <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">{sell.notes}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/inventory?sell=${sell.id}`)
                        }
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Manage Inventory
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          router.push(`/admin/orders?sell=${sell.id}`)
                        }
                      >
                        <Calendar className="h-4 w-4 mr-2" />
                        View Orders
                      </Button>
                    </div>

                    <div className="flex space-x-2">
                      {sell.status === 'draft' && (
                        <Button
                          size="sm"
                          onClick={() => updateSellStatus(sell.id, 'active')}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Activate
                        </Button>
                      )}
                      {sell.status === 'active' && (
                        <Button
                          size="sm"
                          onClick={() => updateSellStatus(sell.id, 'completed')}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Complete
                        </Button>
                      )}
                      {sell.status === 'draft' && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => updateSellStatus(sell.id, 'cancelled')}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
