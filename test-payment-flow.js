#!/usr/bin/env node

/**
 * Simple test script to verify Stripe integration endpoints
 * Run with: node test-payment-flow.js
 */

const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// Test data
const testCustomerInfo = {
  name: 'Test Customer',
  email: 'test@example.com',
  phone: '+1234567890',
  pickupTime: '12:00',
  pickupDate: '2024-01-15',
  specialInstructions: 'Test order',
};

const testCartItems = [
  {
    id: 'test-product-id',
    name: 'Test Sandwich',
    quantity: 1,
    price: 8.5,
  },
];

async function testPaymentIntentCreation() {
  console.log('🧪 Testing Payment Intent Creation...');

  try {
    const response = await fetch(`${baseUrl}/api/payment/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items: testCartItems,
        customerInfo: testCustomerInfo,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Payment intent created successfully');
      console.log(
        '   Client Secret:',
        data.clientSecret ? 'Present' : 'Missing'
      );
      console.log(
        '   Payment Intent ID:',
        data.paymentIntentId ? 'Present' : 'Missing'
      );
      return true;
    } else {
      console.log('❌ Payment intent creation failed');
      console.log('   Error:', data.error);
      console.log('   Details:', data.details);
      return false;
    }
  } catch (error) {
    console.log('❌ Network error:', error.message);
    return false;
  }
}

async function testWebhookEndpoint() {
  console.log('🧪 Testing Webhook Endpoint Accessibility...');

  try {
    const response = await fetch(`${baseUrl}/api/webhooks/stripe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test-signature', // This will fail signature verification but endpoint should respond
      },
      body: JSON.stringify({
        type: 'test',
        data: { object: {} },
      }),
    });

    // We expect this to fail with signature error, but endpoint should be reachable
    if (response.status === 400) {
      console.log(
        '✅ Webhook endpoint is accessible (signature verification working)'
      );
      return true;
    } else {
      console.log(
        '⚠️  Webhook endpoint responded with unexpected status:',
        response.status
      );
      return false;
    }
  } catch (error) {
    console.log('❌ Webhook endpoint not accessible:', error.message);
    return false;
  }
}

async function testEnvironmentVariables() {
  console.log('🧪 Testing Environment Variables...');

  const requiredVars = [
    'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'ADMIN_EMAIL',
  ];

  let allPresent = true;

  requiredVars.forEach(varName => {
    const value = process.env[varName];
    if (value) {
      console.log(`✅ ${varName}: Present`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allPresent = false;
    }
  });

  return allPresent;
}

async function runTests() {
  console.log('🚀 Starting Stripe Integration Tests\n');
  console.log(`Base URL: ${baseUrl}\n`);

  const results = {
    envVars: await testEnvironmentVariables(),
    webhook: await testWebhookEndpoint(),
    paymentIntent: await testPaymentIntentCreation(),
  };

  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  console.log(
    `Environment Variables: ${results.envVars ? '✅ PASS' : '❌ FAIL'}`
  );
  console.log(`Webhook Endpoint: ${results.webhook ? '✅ PASS' : '❌ FAIL'}`);
  console.log(
    `Payment Intent Creation: ${results.paymentIntent ? '✅ PASS' : '❌ FAIL'}`
  );

  const allPassed = Object.values(results).every(result => result);

  console.log(
    `\n🎯 Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`
  );

  if (!allPassed) {
    console.log('\n💡 Next Steps:');
    if (!results.envVars) {
      console.log('   - Set up missing environment variables');
    }
    if (!results.webhook) {
      console.log('   - Check if development server is running');
    }
    if (!results.paymentIntent) {
      console.log('   - Check Stripe configuration and active drops');
    }
  } else {
    console.log('\n🎉 Your Stripe integration is ready for testing!');
    console.log('   - Try the checkout flow in your browser');
    console.log('   - Use Stripe test cards for payment testing');
    console.log('   - Monitor webhook events in Stripe dashboard');
  }

  process.exit(allPassed ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
