# Stripe Payment Integration Plan

## Fomé Sandwich Shop - Payment Implementation

---

## 🎯 Overview

**Goal**: Replace cash/mbway payment at pickup with secure online payment during checkout using Stripe.

**Business Impact**:

- Guaranteed payment before order preparation
- Reduced no-shows and cancellations
- Better cash flow management
- Professional customer experience

---

## 🏗️ Current vs Future Flow

### Current Flow (Cash/MBWay)

```
Cart → Checkout Form → Order Created (Pending) → Cash at Pickup
```

### New Flow (Stripe)

```
Cart → Checkout Form → Stripe Payment → Order Created (Confirmed) → Pickup
```

---

## 📋 Implementation Steps

### Phase 1: Stripe Setup & Dependencies

**Estimated Time: 30 minutes**

1. **Create Stripe Account**
   - Sign up at stripe.com
   - Complete business verification
   - Get API keys (test mode first)

2. **Install Dependencies**

   ```bash
   npm install stripe @stripe/stripe-js
   npm install --save-dev @types/stripe
   ```

3. **Environment Variables**
   Add to `.env.local`:
   ```bash
   # Stripe Keys
   STRIPE_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

### Phase 2: Backend Payment API

**Estimated Time: 2 hours**

4. **Create Payment Intent API** (`/api/payment/create-intent`)
   - Calculate order total
   - Create Stripe payment intent
   - Return client secret for frontend

5. **Webhook Handler** (`/api/webhooks/stripe`)
   - Handle payment confirmation
   - Update order status to 'confirmed'
   - Send confirmation email
   - Reserve inventory

6. **Update Order Creation Logic**
   - Orders start as 'payment_pending'
   - Only confirm after successful payment
   - Handle payment failures gracefully

### Phase 3: Frontend Payment UI

**Estimated Time: 3 hours**

7. **Payment Component** (`/components/checkout/StripePayment.tsx`)
   - Stripe Elements integration
   - Card input form
   - Payment processing UI
   - Error handling

8. **Update Checkout Flow**
   - Replace "Continue" button with "Pay Now"
   - Show payment form after customer details
   - Handle payment success/failure
   - Redirect to confirmation page

9. **Loading States & UX**
   - Payment processing indicators
   - Clear error messages
   - Success animations

### Phase 4: Order Status Updates

**Estimated Time: 1 hour**

10. **Database Schema Updates**

    ```sql
    -- Add payment fields to orders table
    ALTER TABLE orders ADD COLUMN payment_intent_id TEXT;
    ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT 'pending';
    ALTER TABLE orders ADD COLUMN payment_method TEXT;
    ```

11. **Update Order Status Flow**
    - `payment_pending` → `confirmed` → `prepared` → `completed`
    - Handle payment failures
    - Admin can see payment status

### Phase 5: Testing & Error Handling

**Estimated Time: 2 hours**

12. **Test Payment Scenarios**
    - Successful payments
    - Failed payments (insufficient funds, declined cards)
    - Network errors
    - Webhook failures

13. **Error Handling**
    - Payment failures don't create orders
    - Clear error messages for customers
    - Retry mechanisms for webhooks
    - Admin notifications for payment issues

### Phase 6: Production Deployment

**Estimated Time: 1 hour**

14. **Production Setup**
    - Switch to live Stripe keys
    - Configure webhook endpoints
    - Test with real (small) transactions
    - Update environment variables in Vercel

---

## 🔧 Technical Implementation Details

### File Structure Changes

```
src/
├── app/api/
│   ├── payment/
│   │   └── create-intent/route.ts     # NEW: Create payment intent
│   └── webhooks/
│       └── stripe/route.ts            # NEW: Handle payment webhooks
├── components/
│   └── checkout/
│       ├── StripePayment.tsx          # NEW: Payment form component
│       └── PaymentStatus.tsx          # NEW: Payment status display
├── lib/
│   ├── stripe/
│   │   ├── client.ts                  # NEW: Stripe client setup
│   │   └── server.ts                  # NEW: Stripe server setup
│   └── payments.ts                    # NEW: Payment utilities
```

### Key Components

#### 1. Payment Intent API (`/api/payment/create-intent/route.ts`)

```typescript
export async function POST(request: Request) {
  const { items, customerInfo } = await request.json();

  // Calculate total from cart items
  const amount = calculateTotal(items);

  // Create payment intent
  const paymentIntent = await stripe.paymentIntents.create({
    amount: amount * 100, // Stripe uses cents
    currency: 'eur',
    metadata: {
      customerEmail: customerInfo.email,
      customerName: customerInfo.name,
    },
  });

  return NextResponse.json({
    clientSecret: paymentIntent.client_secret,
  });
}
```

#### 2. Stripe Payment Component

```typescript
export function StripePayment({ clientSecret, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();

  const handleSubmit = async (event) => {
    event.preventDefault();

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/confirmation`,
      },
    });

    if (error) {
      onError(error.message);
    } else if (paymentIntent.status === 'succeeded') {
      onSuccess(paymentIntent);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe}>
        Pay Now
      </button>
    </form>
  );
}
```

#### 3. Webhook Handler (`/api/webhooks/stripe/route.ts`)

```typescript
export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;

    // Update order status to confirmed
    await confirmOrder(paymentIntent.id);

    // Send confirmation email
    await sendOrderConfirmationEmail(paymentIntent.metadata);
  }

  return NextResponse.json({ received: true });
}
```

---

## 💰 Stripe Pricing

**Transaction Fees**: 2.9% + €0.25 per successful charge

- Example: €15 order = €0.69 fee
- No monthly fees, only pay when you get paid

**Test Mode**: Free for development and testing

---

## 🚨 Important Considerations

### Security

- **Never store card details** - Stripe handles this
- **Use webhooks** - Don't rely only on frontend confirmation
- **Validate amounts** - Always verify totals server-side

### User Experience

- **Clear error messages** - "Your card was declined" not "Error 402"
- **Loading states** - Show processing indicators
- **Mobile-friendly** - Stripe Elements are responsive

### Business Logic

- **Inventory reservation** - Only after payment confirmation
- **Order cancellation** - Handle refunds through Stripe dashboard
- **Failed payments** - Don't create orders, clear cart

---

## 🧪 Testing Strategy

### Test Cards (Stripe provides these)

```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
```

### Test Scenarios

1. **Happy Path**: Successful payment → Order confirmed
2. **Card Declined**: Clear error message, order not created
3. **Network Issues**: Retry mechanisms work
4. **Webhook Delays**: Order eventually confirmed

---

## 📈 Success Metrics

**Before Implementation (Current)**:

- Manual payment validation required
- Potential no-shows at pickup
- Cash handling complexity

**After Implementation (Target)**:

- 100% payment guarantee before preparation
- Automated order confirmation
- Professional checkout experience
- Reduced admin workload

---

## 🚀 Go-Live Checklist

- [ ] Stripe account verified and approved
- [ ] Test payments working in development
- [ ] Webhook endpoints configured
- [ ] Production environment variables set
- [ ] Small test transaction completed
- [ ] Error handling tested
- [ ] Customer support process defined
- [ ] Refund process documented

---

## 🔄 Rollback Plan

If issues arise after deployment:

1. **Immediate**: Switch environment variable to disable Stripe
2. **Fallback**: Revert to cash/mbway messaging
3. **Fix**: Address issues in development
4. **Redeploy**: Test thoroughly before re-enabling

---

**Total Estimated Time**: 8-10 hours over 2-3 days
**Complexity Level**: Medium (well-documented APIs, clear examples)
**Risk Level**: Low (can easily rollback, test mode available)

This plan follows your preference for simple, practical solutions that solve real business problems without over-engineering! 🎯
