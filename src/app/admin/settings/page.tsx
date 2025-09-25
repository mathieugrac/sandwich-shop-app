'use client';

import { useState, useEffect } from 'react';
import { AdminPageTemplate } from '@/components/admin/layout/AdminPageTemplate';
import {
  AdminCard,
  AdminCardHeader,
  AdminCardTitle,
  AdminCardContent,
} from '@/components/admin/ui/AdminCard';
import { AdminButton } from '@/components/admin/ui/AdminButton';
import { AdminInput, AdminLabel } from '@/components/admin/ui/AdminInput';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Save, Settings, Loader2 } from 'lucide-react';
import { useRequireAuth } from '@/lib/hooks';

// Define the settings interface
interface ShopSettings {
  shopName: string;
  shopEmail: string;
  shopPhone: string;
  shopAddress: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<ShopSettings>({
    shopName: 'Sandwich Shop',
    shopEmail: 'orders@example.com',
    shopPhone: '+1234567890',
    shopAddress: '123 Main Street, City, State 12345',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useRequireAuth();

  useEffect(() => {
    loadSettings();
  }, []);

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
      <AdminPageTemplate title="Settings">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </AdminPageTemplate>
    );
  }

  return (
    <AdminPageTemplate
      title="Settings"
      primaryAction={{
        label: saving ? 'Saving...' : 'Save Changes',
        onClick: saveSettings,
      }}
    >
      {message && (
        <Alert
          className={`mb-6 ${message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
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
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle className="flex items-center">
              Shop Information
            </AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent className="space-y-5">
            <div className="space-y-2">
              <AdminLabel htmlFor="shopName">Shop Name</AdminLabel>
              <AdminInput
                id="shopName"
                value={settings.shopName}
                onChange={e => handleInputChange('shopName', e.target.value)}
                placeholder="Your Sandwich Shop"
              />
            </div>

            <div className="space-y-2">
              <AdminLabel htmlFor="shopEmail">Email Address</AdminLabel>
              <AdminInput
                id="shopEmail"
                type="email"
                value={settings.shopEmail}
                onChange={e => handleInputChange('shopEmail', e.target.value)}
                placeholder="orders@yourdomain.com"
              />
            </div>

            <div className="space-y-2">
              <AdminLabel htmlFor="shopPhone">Phone Number</AdminLabel>
              <AdminInput
                id="shopPhone"
                value={settings.shopPhone}
                onChange={e => handleInputChange('shopPhone', e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            <div className="space-y-2">
              <AdminLabel htmlFor="shopAddress">Address</AdminLabel>
              <AdminInput
                id="shopAddress"
                value={settings.shopAddress}
                onChange={e => handleInputChange('shopAddress', e.target.value)}
                placeholder="123 Main Street, City, State 12345"
              />
            </div>
          </AdminCardContent>
        </AdminCard>

        {/* System Information */}
        <AdminCard>
          <AdminCardHeader>
            <AdminCardTitle>System Information</AdminCardTitle>
          </AdminCardHeader>
          <AdminCardContent>
            <div className="space-y-4">
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
          </AdminCardContent>
        </AdminCard>
      </div>
    </AdminPageTemplate>
  );
}
