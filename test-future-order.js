// Test script to add a future order for banner testing
const futureOrder = {
  orderNumber: 'ORD-20250807-TEST',
  pickupTime: '18:00', // 6:00 PM - in the future
  pickupDate: '2025-08-07',
  items: [{ name: 'Umami Mush', quantity: 1 }],
  totalAmount: 10,
};

// Save to localStorage
localStorage.setItem('activeOrder', JSON.stringify(futureOrder));

console.log('✅ Test order saved with future pickup time (6:00 PM)');
console.log('Refresh the page to see the banner!');
