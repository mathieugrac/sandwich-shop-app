# Stripe Integration Testing Guide

## 🧪 Test Scenarios

### 1. Successful Payment Flow

**Steps:**

1. Add items to cart
2. Go to checkout
3. Fill in customer information
4. Click "Continue to Payment"
5. Use test card: `4242 4242 4242 4242`
6. Complete payment

**Expected Results:**

- ✅ Payment succeeds
- ✅ Order created in database with `confirmed` status
- ✅ Inventory reserved
- ✅ Confirmation email sent to customer
- ✅ Redirect to confirmation page

### 2. Failed Payment Flow

**Steps:**

1. Add items to cart
2. Go to checkout
3. Fill in customer information
4. Click "Continue to Payment"
5. Use declined test card: `4000 0000 0000 0002`
6. Attempt payment

**Expected Results:**

- ❌ Payment fails with clear error message
- ✅ No order created
- ✅ Cart preserved for retry
- ✅ Admin notification email sent
- ✅ Customer can retry payment

### 3. Insufficient Funds

**Steps:**

1. Add items to cart
2. Go to checkout
3. Fill in customer information
4. Click "Continue to Payment"
5. Use insufficient funds test card: `4000 0000 0000 9995`
6. Attempt payment

**Expected Results:**

- ❌ Payment fails with "insufficient funds" message
- ✅ No order created
- ✅ Cart preserved for retry
- ✅ Admin notification email sent

### 4. Network Issues / Webhook Delays

**Steps:**

1. Complete successful payment
2. Simulate webhook delay (manually in Stripe dashboard)

**Expected Results:**

- ✅ Order eventually created when webhook processes
- ✅ No duplicate orders (idempotent processing)
- ✅ Customer gets confirmation email

### 5. Inventory Validation

**Steps:**

1. Add items that exceed available inventory
2. Attempt to proceed to payment

**Expected Results:**

- ❌ Payment intent creation fails
- ✅ Clear error message about insufficient inventory
- ✅ Cart preserved

## 🔍 Monitoring & Debugging

### Stripe Dashboard

- Monitor payments in real-time
- Check webhook delivery status
- View payment failure reasons

### Application Logs

- Check Vercel function logs for webhook processing
- Monitor email delivery status
- Track inventory reservation errors

### Database Checks

```sql
-- Check orders with payment info
SELECT
  order_number,
  status,
  payment_intent_id,
  payment_method,
  total_amount,
  created_at
FROM orders
WHERE payment_intent_id IS NOT NULL
ORDER BY created_at DESC;

-- Check inventory levels
SELECT
  dp.id,
  p.name,
  dp.stock_quantity,
  dp.reserved_quantity,
  dp.available_quantity
FROM drop_products dp
JOIN products p ON dp.product_id = p.id
JOIN drops d ON dp.drop_id = d.id
WHERE d.status = 'active';
```

## 🚨 Common Issues & Solutions

### Issue: Webhook not receiving events

**Solution:**

- Check webhook URL is correct
- Verify webhook secret matches environment variable
- Check Stripe dashboard for delivery attempts

### Issue: Payment succeeds but no order created

**Solution:**

- Check webhook processing logs
- Verify database connection in webhook
- Check for inventory reservation failures

### Issue: Duplicate orders

**Solution:**

- Webhook retry handling should prevent this
- Check `payment_intent_id` uniqueness in database

### Issue: Email notifications not working

**Solution:**

- Verify Resend API key is correct
- Check admin email is configured
- Monitor email delivery logs

## 📊 Success Metrics

After deployment, monitor these metrics:

- **Payment Success Rate:** Should be >95%
- **Order Completion Time:** Payment to confirmation <30 seconds
- **Email Delivery Rate:** Should be >98%
- **Inventory Accuracy:** No overselling incidents
- **Customer Support Tickets:** Reduced payment-related issues

## 🔄 Rollback Plan

If issues occur:

1. **Immediate:** Set environment variable to disable Stripe
2. **Fallback:** Temporarily revert checkout to show cash/mbway message
3. **Fix:** Address issues in development environment
4. **Redeploy:** Test thoroughly before re-enabling

## 🎯 Go-Live Checklist

- [ ] Database schema updated with payment fields
- [ ] Stripe account verified and approved
- [ ] Test payments working in development
- [ ] Webhook endpoints configured in Stripe
- [ ] Production environment variables set in Vercel
- [ ] Admin email configured for failure notifications
- [ ] Small test transaction completed with live keys
- [ ] Error handling tested with various scenarios
- [ ] Customer support process defined for payment issues
- [ ] Refund process documented in Stripe dashboard
