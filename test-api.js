// Simple test script to verify API routes
// Run with: node test-api.js

const BASE_URL = 'http://localhost:3000';

async function testAPI() {
  console.log('Testing API routes...\n');

  // Test products endpoint
  try {
    console.log('1. Testing /api/products...');
    const productsResponse = await fetch(`${BASE_URL}/api/products`);
    const products = await productsResponse.json();
    console.log('✅ Products:', products.length, 'items found');
    console.log('   Sample product:', products[0]?.name);
  } catch (error) {
    console.log('❌ Products API failed:', error.message);
  }

  // Test inventory endpoint
  try {
    console.log('\n2. Testing /api/inventory/[date]...');
    const today = new Date().toISOString().split('T')[0];
    const inventoryResponse = await fetch(`${BASE_URL}/api/inventory/${today}`);
    const inventory = await inventoryResponse.json();
    console.log('✅ Inventory:', inventory.length, 'items found');
    console.log(
      '   Sample inventory:',
      inventory[0]?.available_quantity,
      'available'
    );
  } catch (error) {
    console.log('❌ Inventory API failed:', error.message);
  }

  console.log('\n🎉 API test completed!');
}

testAPI();
