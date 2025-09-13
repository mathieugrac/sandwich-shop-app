# 🎯 Inventory Logic Fix - Implementation Plan

## 📋 Context

Currently, the Fomé sandwich shop app has critical inventory reservation issues that cause problems with back/forth navigation and potential overselling. This plan implements a simple, optimistic inventory management approach that aligns with the business needs.

**Current Problems:**

- ❌ **Double reservations:** Each payment page visit creates new payment intent + reserves inventory
- ❌ **Missing release function:** `release_multiple_drop_products` doesn't exist in database
- ❌ **No cleanup:** Abandoned payment intents keep inventory reserved forever
- ❌ **Race conditions:** Multiple users can over-reserve inventory

**Business Context:**

- Small volume: ~2 drops per week, limited concurrent users
- Perishable goods: Sandwiches made fresh, no inventory carrying cost
- Simple business model: Pre-orders for specific drops

## 🚀 Strategy: "Optimistic with Smart Checks"

### **Core Principle:**

Don't over-engineer for problems you don't have. Keep it simple and handle the 99% case well.

### **High-Level Approach:**

```
Current:  Reserve → Pay → Confirm
Proposed: Check → Pay → Reserve
```

**Key Changes:**

1. **Remove premature reservation** from payment intent creation
2. **Add availability checks** before payment processing
3. **Reserve only after payment succeeds** (in webhook)
4. **Implement payment intent reuse** to prevent duplicates
5. **Handle conflicts gracefully** with user-friendly messages

## 📅 Implementation Plan

### **Step 1: Remove Premature Inventory Reservation** ⏱️ ~20 mins

**File:** `/src/app/api/payment/create-intent/route.ts`

**Current Code (lines 51-73):**

```typescript
// Reserve inventory immediately when creating payment intent
const orderProducts = items.map(item => ({
  drop_product_id: item.id,
  order_quantity: item.quantity,
}));

// Reserve inventory for all items at once
const { error: reservationError } = await supabase.rpc(
  'reserve_multiple_drop_products',
  { p_order_items: orderProducts }
);

if (reservationError) {
  console.error('❌ Inventory reservation error during payment intent:', {
    error: reservationError,
    items: items,
    orderProducts: orderProducts,
  });
  return NextResponse.json(
    { error: 'Insufficient inventory available' },
    { status: 400 }
  );
}
```

**New Code:**

```typescript
// Check availability without reserving
const orderProducts = items.map(item => ({
  drop_product_id: item.id,
  order_quantity: item.quantity,
}));

// Check if all items are available (new function)
const { data: availabilityCheck, error: availabilityError } =
  await supabase.rpc('check_multiple_drop_products_availability', {
    p_order_items: orderProducts,
  });

if (availabilityError || !availabilityCheck) {
  console.error('❌ Availability check failed during payment intent:', {
    error: availabilityError,
    items: items,
    orderProducts: orderProducts,
  });
  return NextResponse.json(
    { error: 'Some items are no longer available' },
    { status: 400 }
  );
}
```

### **Step 2: Create Availability Check Database Function** ⏱️ ~15 mins

**File:** Database migration or direct SQL execution

**New Function:**

```sql
-- Function to check availability without reserving
CREATE OR REPLACE FUNCTION check_multiple_drop_products_availability(
  p_order_items JSONB)
RETURNS BOOLEAN AS $$
DECLARE
  item RECORD;
  available_qty INTEGER;
BEGIN
  -- Check if all items are available
  FOR item IN SELECT * FROM jsonb_array_elements(p_order_items)
  LOOP
    SELECT available_quantity INTO available_qty
    FROM drop_products
    WHERE id = (item->>'drop_product_id')::UUID;

    -- If any item doesn't have enough stock, return false
    IF available_qty < (item->>'order_quantity')::INTEGER THEN
      RETURN FALSE;
    END IF;
  END LOOP;

  -- All items are available
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

### **Step 3: Implement Payment Intent Reuse Logic** ⏱️ ~25 mins

**File:** `/src/components/checkout/StripePayment.tsx`

**Current Code (lines 115-119):**

```typescript
useEffect(() => {
  // Simple: always create a new payment intent
  // This prevents double reservations by ensuring one intent per checkout session
  createPaymentIntent();
}, []);
```

**New Code:**

```typescript
useEffect(() => {
  // Check if we can reuse existing payment intent
  const savedPaymentIntent = localStorage.getItem('currentPaymentIntent');

  if (savedPaymentIntent) {
    try {
      const { paymentIntentId, cartHash, customerHash } =
        JSON.parse(savedPaymentIntent);
      const currentCartHash = generateCartHash(items);
      const currentCustomerHash = generateCustomerHash(customerInfo);

      // Reuse if cart and customer info haven't changed
      if (
        cartHash === currentCartHash &&
        customerHash === currentCustomerHash
      ) {
        console.log('♻️ Reusing existing payment intent:', paymentIntentId);
        validateAndReusePaymentIntent(paymentIntentId);
        return;
      }
    } catch (error) {
      console.error('Error parsing saved payment intent:', error);
    }
  }

  // Create new payment intent if no valid existing one
  createPaymentIntent();
}, []);

// Helper functions
const generateCartHash = (items: CartItem[]): string => {
  return btoa(
    JSON.stringify(
      items.map(item => ({ id: item.id, quantity: item.quantity }))
    )
  );
};

const generateCustomerHash = (customerInfo: CustomerInfo): string => {
  return btoa(
    JSON.stringify({
      name: customerInfo.name,
      email: customerInfo.email,
      phone: customerInfo.phone,
      pickupTime: customerInfo.pickupTime,
      pickupDate: customerInfo.pickupDate,
    })
  );
};

const validateAndReusePaymentIntent = async (paymentIntentId: string) => {
  try {
    // Validate payment intent is still valid
    const response = await fetch(`/api/payment/validate-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentIntentId }),
    });

    if (response.ok) {
      const { clientSecret } = await response.json();
      setClientSecret(clientSecret);
      console.log('✅ Payment intent reused successfully');
    } else {
      console.log('⚠️ Payment intent invalid, creating new one');
      createPaymentIntent();
    }
  } catch (error) {
    console.error('Error validating payment intent:', error);
    createPaymentIntent();
  }
};
```

### **Step 4: Create Payment Intent Validation API** ⏱️ ~15 mins

**File:** `/src/app/api/payment/validate-intent/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';

export async function POST(request: Request) {
  try {
    const { paymentIntentId } = await request.json();

    if (!paymentIntentId) {
      return NextResponse.json(
        { error: 'Payment intent ID is required' },
        { status: 400 }
      );
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    // Check if payment intent is in a valid state for reuse
    if (
      paymentIntent.status === 'requires_payment_method' ||
      paymentIntent.status === 'requires_confirmation'
    ) {
      return NextResponse.json({
        clientSecret: paymentIntent.client_secret,
        valid: true,
      });
    }

    // Payment intent is not reusable
    return NextResponse.json(
      { error: 'Payment intent is not reusable', valid: false },
      { status: 400 }
    );
  } catch (error) {
    console.error('❌ Payment intent validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate payment intent', valid: false },
      { status: 500 }
    );
  }
}
```

### **Step 5: Update Payment Intent Creation to Save State** ⏱️ ~10 mins

**File:** `/src/components/checkout/StripePayment.tsx`

**Add to `createPaymentIntent` function:**

```typescript
const createPaymentIntent = async () => {
  setIsCreatingIntent(true);
  setError('');

  try {
    const response = await fetch('/api/payment/create-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        items,
        customerInfo,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create payment intent');
    }

    const { clientSecret, paymentIntentId } = await response.json();
    setClientSecret(clientSecret);

    // Save payment intent for reuse
    const paymentIntentData = {
      paymentIntentId,
      cartHash: generateCartHash(items),
      customerHash: generateCustomerHash(customerInfo),
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem(
      'currentPaymentIntent',
      JSON.stringify(paymentIntentData)
    );

    console.log('✅ New payment intent created and saved:', paymentIntentId);
  } catch (err) {
    const errorMessage =
      err instanceof Error ? err.message : 'Failed to initialize payment';
    console.error('Payment intent creation failed:', err);
    setError(errorMessage);
    onError(errorMessage);
  } finally {
    setIsCreatingIntent(false);
  }
};
```

### **Step 6: Add Final Availability Check Before Payment** ⏱️ ~15 mins

**File:** `/src/components/checkout/StripePayment.tsx`

**Update `StripePaymentForm` component:**

```typescript
const handleSubmit = async (event: React.FormEvent) => {
  event.preventDefault();

  if (!stripe || !elements) {
    onError('Stripe has not loaded yet. Please try again.');
    return;
  }

  setIsProcessing(true);

  try {
    // Final availability check before payment
    const availabilityResponse = await fetch(
      '/api/payment/check-availability',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientSecret }),
      }
    );

    if (!availabilityResponse.ok) {
      const errorData = await availabilityResponse.json();
      onError(
        errorData.error ||
          'Some items are no longer available. Please refresh and try again.'
      );
      return;
    }

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      console.error('Payment confirmation error:', error);
      onError(error.message || 'Payment failed. Please try again.');
    } else if (paymentIntent && paymentIntent.status === 'succeeded') {
      console.log('✅ Payment succeeded:', paymentIntent.id);
      // Clear saved payment intent on success
      localStorage.removeItem('currentPaymentIntent');
      onSuccess(paymentIntent.id);
    } else {
      onError('Payment was not completed. Please try again.');
    }
  } catch (err) {
    console.error('Unexpected payment error:', err);
    onError('An unexpected error occurred. Please try again.');
  } finally {
    setIsProcessing(false);
  }
};
```

### **Step 7: Create Availability Check API** ⏱️ ~10 mins

**File:** `/src/app/api/payment/check-availability/route.ts`

```typescript
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const { clientSecret } = await request.json();

    if (!clientSecret) {
      return NextResponse.json(
        { error: 'Client secret is required' },
        { status: 400 }
      );
    }

    // Get payment intent from Stripe to retrieve cart items
    const paymentIntentId = clientSecret.split('_secret_')[0];
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (!paymentIntent.metadata.cartItems) {
      return NextResponse.json(
        { error: 'Cart items not found in payment intent' },
        { status: 400 }
      );
    }

    const cartItems = JSON.parse(paymentIntent.metadata.cartItems);
    const orderProducts = cartItems.map((item: any) => ({
      drop_product_id: item.id,
      order_quantity: item.quantity,
    }));

    // Check availability
    const { data: availabilityCheck, error: availabilityError } =
      await supabase.rpc('check_multiple_drop_products_availability', {
        p_order_items: orderProducts,
      });

    if (availabilityError || !availabilityCheck) {
      return NextResponse.json(
        { error: 'Some items are no longer available' },
        { status: 400 }
      );
    }

    return NextResponse.json({ available: true });
  } catch (error) {
    console.error('❌ Availability check error:', error);
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    );
  }
}
```

### **Step 8: Add Cleanup on Navigation Away** ⏱️ ~10 mins

**File:** `/src/components/checkout/StripePayment.tsx`

**Add cleanup effect:**

```typescript
// Cleanup payment intent on component unmount or navigation
useEffect(() => {
  const handleBeforeUnload = () => {
    // Don't clear if payment is processing
    if (!isProcessing) {
      localStorage.removeItem('currentPaymentIntent');
    }
  };

  window.addEventListener('beforeunload', handleBeforeUnload);

  return () => {
    window.removeEventListener('beforeunload', handleBeforeUnload);
    // Clear payment intent when component unmounts (unless processing)
    if (!isProcessing) {
      localStorage.removeItem('currentPaymentIntent');
    }
  };
}, [isProcessing]);
```

## 🧪 Testing Strategy

### **Test Cases:**

1. **Normal Flow:**
   - Add items to cart → Checkout → Payment → Success
   - Verify inventory is only reserved after payment succeeds

2. **Back/Forth Navigation:**
   - Cart → Checkout → Payment → Back to Checkout → Payment
   - Verify same payment intent is reused, no double reservation

3. **Cart Changes:**
   - Start payment → Go back → Change cart → Return to payment
   - Verify new payment intent is created for changed cart

4. **Availability Conflicts:**
   - Two users try to buy last item simultaneously
   - Verify graceful error handling

5. **Abandoned Payments:**
   - Start payment → Close browser
   - Verify no inventory is permanently reserved

### **Success Criteria:**

✅ **No double reservations:** Multiple payment page visits don't reserve inventory multiple times  
✅ **Graceful conflicts:** Clear error messages when items become unavailable  
✅ **Payment intent reuse:** Same cart/customer reuses existing payment intent  
✅ **Proper cleanup:** Abandoned payments don't lock inventory  
✅ **Backward compatibility:** Existing webhook logic still works

## 🚀 Deployment Strategy

### **Phase 1: Database Changes**

1. Deploy availability check function to database
2. Test function manually with SQL queries

### **Phase 2: API Changes**

1. Deploy new API endpoints (`validate-intent`, `check-availability`)
2. Update payment intent creation logic
3. Test with existing UI

### **Phase 3: Frontend Changes**

1. Update StripePayment component with reuse logic
2. Add cleanup handlers
3. Test complete flow

### **Phase 4: Monitoring**

1. Monitor payment success rates
2. Check for inventory conflicts
3. Verify no stuck reservations

## 🎯 Expected Outcomes

**Before:**

- Multiple payment intents created for same order
- Inventory reserved immediately, never released
- Race conditions possible
- Complex cleanup needed

**After:**

- Payment intents reused intelligently
- Inventory reserved only after payment
- Conflicts handled gracefully
- Simple, maintainable code

This approach solves the real business problem (preventing overselling and duplicate reservations) with a simple, maintainable solution that fits your business scale and complexity needs.
