'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TestEmailPage() {
  const [email, setEmail] = useState('mathieugrac@gmail.com');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const sendTestEmail = async () => {
    if (!email) {
      setResult('Please enter an email address');
      return;
    }

    setLoading(true);
    setResult('');

    try {
      const response = await fetch('/api/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult('✅ Test email sent successfully! Check your inbox.');
      } else {
        setResult(`❌ Error: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle>Test Email Functionality</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="email">
              Email Address (Verified: mathieugrac@gmail.com)
            </Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email address"
            />
            <p className="text-sm text-gray-600 mt-1">
              Note: For testing, you can only send emails to
              mathieugrac@gmail.com
            </p>
          </div>

          <Button onClick={sendTestEmail} disabled={loading} className="w-full">
            {loading ? 'Sending...' : 'Send Test Email'}
          </Button>

          {result && (
            <div
              className={`p-3 rounded-md ${
                result.includes('✅')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              {result}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
