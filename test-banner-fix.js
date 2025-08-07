// Test script to verify banner behavior after fix
console.log('Testing banner behavior...');

// Test 1: Set up a future order
const futureOrder = {
  orderNumber: 'ORD-20250807-TEST',
  pickupTime: '18:00', // 6:00 PM - in the future
  pickupDate: '2025-08-07',
  items: [{ name: 'Umami Mush', quantity: 1 }],
  totalAmount: 10,
};

// Save to localStorage
localStorage.setItem('activeOrder', JSON.stringify(futureOrder));
console.log('✅ Active order set in localStorage');

// Test 2: Simulate closing the banner (5 minutes from now)
const hideUntil = Date.now() + 5 * 60 * 1000;
sessionStorage.setItem('hideOrderBanner', hideUntil.toString());
console.log('✅ Banner hidden until:', new Date(hideUntil).toLocaleString());

// Test 3: Check current state
const currentOrder = localStorage.getItem('activeOrder');
const hideBanner = sessionStorage.getItem('hideOrderBanner');
console.log('Current order:', currentOrder ? 'Present' : 'None');
console.log(
  'Banner hidden until:',
  hideBanner ? new Date(parseInt(hideBanner)).toLocaleString() : 'Not hidden'
);

// Test 4: Simulate time passing (set to 6 minutes from now)
const futureTime = Date.now() + 6 * 60 * 1000;
console.log('Simulating time:', new Date(futureTime).toLocaleString());

// Check if banner should show
if (hideBanner) {
  const hideUntil = parseInt(hideBanner);
  if (futureTime < hideUntil) {
    console.log('❌ Banner should still be hidden');
  } else {
    console.log('✅ Banner should show again (hide period expired)');
  }
}

console.log('\nInstructions:');
console.log('1. Refresh the page to see the banner');
console.log('2. Close the banner');
console.log('3. Refresh the page - banner should be hidden');
console.log('4. Wait 5 minutes and refresh - banner should show again');
