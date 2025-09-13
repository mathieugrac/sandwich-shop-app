# Stripe Integration - Missing Components Implementation Plan

## 📋 Context

During the initial Stripe payment integration (documented in `STRIPE-IMPLEMENTATION-PLAN.md` and `STRIPE-IMPLEMENTATION-COMPLETE.md`), several critical components from the original plan were not fully implemented. A comprehensive analysis revealed that while the core payment processing works, the **inventory reservation system** is incomplete, creating potential overselling risks and race conditions.

**Current Status:**

- ✅ Payment processing works correctly
- ✅ Orders are created after successful payment
- ❌ **Missing:** Temporary inventory reservation during payment
- ❌ **Missing:** Race condition protection
- ❌ **Missing:** Proper inventory cleanup mechanisms

## 🎯 Implementation Plan

### Phase 1: Database Schema - Inventory Reservations Table

**Estimated Time: 30 minutes**

#### 1.1 Create Inventory Reservations Table

```sql
-- Create temporary inventory reservations table
CREATE TABLE inventory_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  drop_product_id UUID REFERENCES drop_products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  payment_intent_id TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_inventory_reservations_expires_at ON inventory_reservations(expires_at);
CREATE INDEX idx_inventory_reservations_payment_intent ON inventory_reservations(payment_intent_id);
CREATE INDEX idx_inventory_reservations_drop_product ON inventory_reservations(drop_product_id);
```

#### 1.2 Create Database Functions

```sql
-- Function to reserve inventory temporarily
CREATE OR REPLACE FUNCTION reserve_inventory_for_payment(
  p_payment_intent_id TEXT,
  p_order_items JSONB,
  p_expiration_minutes INTEGER DEFAULT 5
) RETURNS BOOLEAN;

-- Function to confirm reservations (convert to permanent)
CREATE OR REPLACE FUNCTION confirm_inventory_reservations(
  p_payment_intent_id TEXT
) RETURNS BOOLEAN;

-- Function to release reservations
CREATE OR REPLACE FUNCTION release_inventory_reservations(
  p_payment_intent_id TEXT
) RETURNS BOOLEAN;

-- Function to cleanup expired reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER;
```

### Phase 2: Payment Intent API Updates

**Estimated Time: 1 hour**

#### 2.1 Update `/api/payment/create-intent/route.ts`

- **Add inventory reservation** before creating payment intent
- **Check available vs reserved quantities** (not just available)
- **Set 5-minute expiration** for reservations
- **Handle reservation failures** gracefully
- **Include reservation ID** in payment intent metadata

**Key Changes:**

```typescript
// Before creating payment intent:
const reservationResult = await supabase.rpc('reserve_inventory_for_payment', {
  p_payment_intent_id: tempPaymentIntentId,
  p_order_items: JSON.stringify(orderProducts),
  p_expiration_minutes: 5,
});

if (!reservationResult) {
  return NextResponse.json(
    { error: 'Insufficient inventory available' },
    { status: 400 }
  );
}
```

#### 2.2 Enhanced Inventory Validation

- **Check real-time availability** including existing reservations
- **Prevent overselling** by considering reserved quantities
- **Handle concurrent requests** properly

### Phase 3: Webhook Handler Updates

**Estimated Time: 45 minutes**

#### 3.1 Update `/api/webhooks/stripe/route.ts`

- **Confirm reservations** on payment success (convert temp → permanent)
- **Release reservations** on payment failure
- **Handle webhook retries** (idempotent operations)
- **Add reservation validation** before order creation

**Key Changes:**

```typescript
// On payment success:
const confirmResult = await supabase.rpc('confirm_inventory_reservations', {
  p_payment_intent_id: paymentIntent.id,
});

// On payment failure:
const releaseResult = await supabase.rpc('release_inventory_reservations', {
  p_payment_intent_id: paymentIntent.id,
});
```

### Phase 4: Cleanup & Maintenance System

**Estimated Time: 1 hour**

#### 4.1 Automated Cleanup

- **Create cleanup API endpoint** (`/api/maintenance/cleanup-reservations`)
- **Implement cron job logic** for expired reservations
- **Add monitoring** for reservation system health

#### 4.2 Admin Monitoring

- **Add reservation metrics** to admin dashboard
- **Show pending reservations** in inventory management
- **Alert on cleanup failures** or high reservation volumes

### Phase 5: Enhanced Error Handling

**Estimated Time: 30 minutes**

#### 5.1 Reservation Error Scenarios

- **Handle reservation timeouts** gracefully
- **Provide clear error messages** to customers
- **Implement retry mechanisms** for temporary failures
- **Log reservation conflicts** for monitoring

#### 5.2 Customer Experience

- **Show real-time availability** during checkout
- **Handle reservation expiration** during payment
- **Provide clear messaging** when items become unavailable

### Phase 6: Testing & Validation

**Estimated Time: 1.5 hours**

#### 6.1 Concurrent Order Testing

- **Test multiple simultaneous orders** for same item
- **Verify no overselling occurs** under load
- **Test reservation expiration** scenarios
- **Validate cleanup mechanisms** work correctly

#### 6.2 Edge Case Testing

- **Payment timeout scenarios**
- **Webhook delivery failures**
- **Database connection issues**
- **High-volume concurrent requests**

#### 6.3 Monitoring Setup

- **Add reservation metrics** to logging
- **Set up alerts** for reservation failures
- **Monitor cleanup job** performance
- **Track overselling incidents** (should be zero)

## 📊 Implementation Priority

### 🔴 **Critical (Must Fix)**

1. **Phase 1:** Database schema (prevents overselling)
2. **Phase 2:** Payment intent reservations (core functionality)
3. **Phase 3:** Webhook confirmation/release (completes the flow)

### 🟡 **Important (Should Fix)**

4. **Phase 4:** Cleanup system (prevents database bloat)
5. **Phase 5:** Error handling (better UX)

### 🟢 **Nice to Have**

6. **Phase 6:** Enhanced testing and monitoring

## 🚨 Risk Assessment

### **Before Implementation:**

- **High Risk:** Overselling during concurrent orders
- **Medium Risk:** Inventory inconsistencies
- **Low Risk:** Database performance issues

### **After Implementation:**

- **Low Risk:** Proper inventory protection
- **Low Risk:** Race condition handling
- **Minimal Risk:** Automated cleanup and monitoring

## 📈 Success Metrics

### **Technical Metrics:**

- Zero overselling incidents
- < 1% reservation timeout rate
- < 100ms reservation response time
- 99.9% cleanup job success rate

### **Business Metrics:**

- Maintained conversion rates
- Reduced customer complaints about availability
- Improved inventory accuracy
- Better admin visibility into pending orders

## 🔄 Rollback Plan

If issues arise during implementation:

1. **Phase 1-2 Issues:** Disable reservation system, fall back to current check-only logic
2. **Phase 3 Issues:** Keep reservations but disable confirmation/release (manual cleanup)
3. **Phase 4-6 Issues:** Core functionality remains intact, only monitoring affected

## ⏱️ Total Estimated Time

**Total Implementation:** 5.5 hours

- **Critical Components:** 2.25 hours
- **Important Components:** 2.5 hours
- **Testing & Validation:** 1.5 hours

**Recommended Timeline:** 2-3 days with proper testing between phases

---

**Note:** This plan addresses the critical gaps identified in the current Stripe implementation while maintaining backward compatibility and providing a clear rollback strategy.
