'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Save, Settings, Clock, Loader2 } from 'lucide-react';

// Define the settings interface
interface ShopSettings {
  shopName: string;
  shopEmail: string;
  shopPhone: string;
  shopAddress: string;
  openingTime: string;
  closingTime: string;
  pickupStartTime: string;
  pickupEndTime: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: 'Sandwich Shop',
    shopEmail: 'orders@example.com',
    shopPhone: '+1234567890',
    shopAddress: '123 Main Street, City, State 12345',
    openingTime: '08:00',
    closingTime: '17:00',
    pickupStartTime: '12:00',
    pickupEndTime: '14:00',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const router = useRouter();

  useEffect(() => {
    checkAuth();
    loadSettings();
  }, []);

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push('/admin');
    }
  };

  const loadSettings = async () => {
    // For now, we'll use default settings
    // In a real app, you'd load these from a settings table
    setLoading(false);
  };

  const handleInputChange = (field: keyof ShopSettings, value: string) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveSettings = async () => {
    setSaving(true);
    setMessage(null);

    try {
      // In a real app, you'd save to a settings table
      // For now, we'll just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: 'Failed to save settings. Please try again.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
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
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-xl font-semibold">Settings</h1>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={saveSettings}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Shop Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Shop Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  value={settings.shopName}
                  onChange={e => handleInputChange('shopName', e.target.value)}
                  placeholder="Your Sandwich Shop"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopEmail">Email Address</Label>
                <Input
                  id="shopEmail"
                  type="email"
                  value={settings.shopEmail}
                  onChange={e => handleInputChange('shopEmail', e.target.value)}
                  placeholder="orders@yourdomain.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopPhone">Phone Number</Label>
                <Input
                  id="shopPhone"
                  value={settings.shopPhone}
                  onChange={e => handleInputChange('shopPhone', e.target.value)}
                  placeholder="+1234567890"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="shopAddress">Address</Label>
                <Input
                  id="shopAddress"
                  value={settings.shopAddress}
                  onChange={e =>
                    handleInputChange('shopAddress', e.target.value)
                  }
                  placeholder="123 Main Street, City, State 12345"
                />
              </div>
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="h-5 w-5 mr-2" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openingTime">Opening Time</Label>
                  <Input
                    id="openingTime"
                    type="time"
                    value={settings.openingTime}
                    onChange={e =>
                      handleInputChange('openingTime', e.target.value)
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="closingTime">Closing Time</Label>
                  <Input
                    id="closingTime"
                    type="time"
                    value={settings.closingTime}
                    onChange={e =>
                      handleInputChange('closingTime', e.target.value)
                    }
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-medium mb-3">Pickup Times</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="pickupStartTime">Start Time</Label>
                    <Input
                      id="pickupStartTime"
                      type="time"
                      value={settings.pickupStartTime}
                      onChange={e =>
                        handleInputChange('pickupStartTime', e.target.value)
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pickupEndTime">End Time</Label>
                    <Input
                      id="pickupEndTime"
                      type="time"
                      value={settings.pickupEndTime}
                      onChange={e =>
                        handleInputChange('pickupEndTime', e.target.value)
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Order Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Order Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">
                    Pre-order Cutoff
                  </h4>
                  <p className="text-sm text-blue-700">
                    Orders must be placed at least 30 minutes before the first
                    pickup time.
                  </p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-medium text-green-900 mb-2">
                    Menu Management
                  </h4>
                  <p className="text-sm text-green-700">
                    Create drops with custom menus by adding products and
                    setting quantities for each event.
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">
                    Order Status Updates
                  </h4>
                  <p className="text-sm text-yellow-700">
                    Update order statuses to keep customers informed of their
                    order progress.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* System Information */}
          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">App Version</span>
                  <span className="text-sm font-medium">v1.0.0</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Database</span>
                  <span className="text-sm font-medium">Supabase</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Framework</span>
                  <span className="text-sm font-medium">Next.js 14</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium">Today</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}