# 🚀 Production Deployment Guide

## 📋 Overview

This guide walks you through deploying your sandwich shop app from local development (with local Supabase) to production, with special attention to Stripe payment configuration and database management.

**Your Current Setup:**

- ✅ Local Supabase environment for development
- ✅ Stripe integration with webhook-based order creation
- ✅ All features working locally with test payments

**Production Goals:**

- 🎯 Deploy to production with remote Supabase
- 🎯 Configure Stripe for production (test mode first, then live)
- 🎯 Ensure webhooks work properly in production
- 🎯 Maintain data integrity during deployment

---

## 🗄️ Database Deployment Strategy

### Phase 1: Production Database Setup

#### Step 1.1: Verify Your Existing Production Setup

✅ **You already have this set up!** Your production Supabase project `fome-sandwich-shop` is linked and ready.

```bash
# Verify your current setup
npx supabase projects list
# Should show: ● fome-sandwich-shop (linked)

# Check your current migrations
npx supabase migration list
```

#### Step 1.2: Deploy Your Schema to Production

```bash
# Push your local migrations to your linked production project
npx supabase db push

# Verify schema was deployed correctly
npx supabase db diff --linked
```

**What this does:**

- Applies all your local migrations (including Stripe payment tables) to production
- Updates your production database with the latest schema
- No data loss - only adds new tables/columns

#### Step 1.3: Get Your Production Supabase Credentials

```bash
# Get your production API keys
npx supabase projects api-keys --project-ref tutzpfqwiqhlpletexjg
```

#### Step 1.4: Update Vercel Environment Variables

In your Vercel dashboard (Project → Settings → Environment Variables):

```bash
# Production Supabase (replace local URLs with production)
NEXT_PUBLIC_SUPABASE_URL=https://tutzpfqwiqhlpletexjg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key_from_above_command
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key_from_above_command

# App Configuration (update for production)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NEXT_PUBLIC_SHOP_NAME="Fomé Sandwich Shop"
NEXT_PUBLIC_SHOP_EMAIL=orders@yourdomain.com
NEXT_PUBLIC_SHOP_PHONE="+351123456789"

# Admin Configuration
ADMIN_EMAIL=admin@yourdomain.com

# Email Service (Resend)
RESEND_API_KEY=re_your_resend_api_key_here

# Stripe Configuration (START WITH TEST KEYS)
STRIPE_SECRET_KEY=sk_test_your_stripe_test_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_test_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret
```

---

## 💳 Stripe Production Configuration

### Phase 2A: Production with Stripe Test Mode (RECOMMENDED FIRST)

**Why start with test mode in production?**

- Test the complete production flow without real money
- Verify webhooks work correctly in production environment
- Catch any environment-specific issues safely
- Build confidence before going live

#### Step 2A.1: Configure Stripe Test Webhooks for Production

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com/test/webhooks)**
2. **Add endpoint**: `https://yourdomain.com/api/webhooks/stripe`
3. **Select events**:
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. **Copy webhook signing secret** → Add to `STRIPE_WEBHOOK_SECRET` in production env

#### Step 2A.2: Test Production Flow with Test Cards

```bash
# Test cards (these work in production with test keys)
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
Insufficient funds: 4000 0000 0000 9995
```

**Testing Checklist:**

- [ ] Place test order in production
- [ ] Verify payment processes correctly
- [ ] Check webhook receives events
- [ ] Confirm order created in production database
- [ ] Verify confirmation email sent
- [ ] Test admin panel shows new order
- [ ] Test order status updates work

### Phase 2B: Go Live with Real Payments

**⚠️ Only proceed after Phase 2A is 100% working!**

#### Step 2B.1: Stripe Account Verification

1. **Complete business verification** in Stripe Dashboard
2. **Add bank account** for payouts
3. **Set up tax information** if required
4. **Enable live mode** in Stripe Dashboard

#### Step 2B.2: Switch to Live Keys

**In your production environment variables:**

```bash
# Replace test keys with live keys
STRIPE_SECRET_KEY=sk_live_your_stripe_live_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_your_stripe_live_publishable_key
```

#### Step 2B.3: Configure Live Webhooks

1. **Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)** (live mode)
2. **Add endpoint**: `https://yourdomain.com/api/webhooks/stripe`
3. **Select same events**: `payment_intent.succeeded`, `payment_intent.payment_failed`
4. **Update webhook secret** in production environment

#### Step 2B.4: Go-Live Testing

**Start small and monitor closely:**

1. **Process a small real transaction** (€1-2 if possible)
2. **Monitor Stripe Dashboard** for successful processing
3. **Check production database** for order creation
4. **Verify email notifications** work
5. **Test refund process** through Stripe Dashboard
6. **Monitor for 24-48 hours** before announcing

---

## 🔧 Production Deployment Steps

### Phase 3: Deploy Application

#### Step 3.1: Pre-Deployment Checklist

```bash
# Test build locally
npm run build

# Check for any build errors
npm run lint

# Verify all environment variables are set
# (Use your hosting platform's environment variable interface)
```

#### Step 3.2: Deploy to Production

**For Vercel (recommended):**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod

# Set environment variables in Vercel dashboard
# Project Settings → Environment Variables
```

**For other platforms:**

- Netlify: Connect GitHub repo, set env vars in site settings
- Railway: Connect repo, add env vars in project settings
- DigitalOcean App Platform: Use App Spec with env vars

#### Step 3.3: Post-Deployment Verification

```bash
# Test your production URL
curl https://yourdomain.com/api/webhooks/health

# Should return: {"status":"healthy","timestamp":"...","message":"Webhook endpoint is accessible"}
```

---

## 🔄 Data Migration Strategy

### If You Have Important Local Data

**Option 1: Fresh Start (Recommended)**

- Start with clean production database
- Use seed data for initial products/locations
- Begin taking real orders in production

**Option 2: Migrate Specific Data**

```sql
-- Export important data from local Supabase
-- (Run these in your local Supabase Studio SQL editor)

-- Export locations
SELECT * FROM locations;

-- Export products
SELECT * FROM products;

-- Export any important configuration data
```

Then manually insert this data into production via Supabase Studio.

**⚠️ Don't migrate:**

- Test orders
- Test customers
- Development admin users

---

## 🚨 Troubleshooting Production Issues

### Common Issues & Solutions

#### Issue: Webhooks Not Working in Production

**Symptoms:**

- Payments succeed but orders not created
- No webhook events in Stripe Dashboard

**Solutions:**

1. **Check webhook URL**: Must be `https://yourdomain.com/api/webhooks/stripe`
2. **Verify webhook secret**: Must match production environment variable
3. **Check Stripe Dashboard**: Look for failed webhook deliveries
4. **Test webhook endpoint**: `curl https://yourdomain.com/api/webhooks/health`

#### Issue: Database Connection Errors

**Symptoms:**

- 500 errors on API calls
- "Connection refused" in logs

**Solutions:**

1. **Verify Supabase URLs**: Check production project settings
2. **Check API keys**: Ensure anon key and service role key are correct
3. **Test connection**: Use Supabase Studio to verify database is accessible

#### Issue: Email Notifications Not Sending

**Symptoms:**

- Orders created but no confirmation emails
- Admin not receiving failure notifications

**Solutions:**

1. **Check Resend API key**: Verify it's set in production environment
2. **Verify email domains**: Ensure sending domain is configured in Resend
3. **Check email templates**: Ensure they exist in production build

---

## 📊 Monitoring & Maintenance

### Production Monitoring Setup

#### Stripe Dashboard Monitoring

- **Payments**: Monitor successful/failed transactions
- **Webhooks**: Check delivery success rates
- **Disputes**: Handle any customer disputes
- **Payouts**: Monitor bank transfers

#### Supabase Monitoring

- **Database Performance**: Monitor query performance
- **Storage Usage**: Track database size growth
- **API Usage**: Monitor API request patterns
- **Auth Activity**: Track user authentication

#### Application Monitoring

- **Error Tracking**: Set up error monitoring (Sentry, LogRocket)
- **Performance**: Monitor page load times
- **Uptime**: Set up uptime monitoring (UptimeRobot, Pingdom)

### Regular Maintenance Tasks

**Weekly:**

- [ ] Review Stripe transaction reports
- [ ] Check for failed webhook deliveries
- [ ] Monitor database performance metrics
- [ ] Review error logs

**Monthly:**

- [ ] Update dependencies (`npm audit`)
- [ ] Review and optimize database queries
- [ ] Analyze payment success/failure rates
- [ ] Update documentation

---

## 🔐 Security Best Practices

### Environment Variables Security

- **Never commit** `.env` files to git
- **Use different keys** for development and production
- **Rotate keys periodically** (quarterly recommended)
- **Limit API key permissions** to minimum required

### Database Security

- **Enable RLS** (Row Level Security) on all tables
- **Regular backups** (Supabase handles this automatically)
- **Monitor access logs** for suspicious activity
- **Use service role key** only in server-side code

### Stripe Security

- **Webhook signature verification** (already implemented)
- **Never log** sensitive payment data
- **Use HTTPS only** for all webhook endpoints
- **Monitor for** unusual payment patterns

---

## 🎯 Go-Live Checklist

### Pre-Launch (Test Mode in Production)

- [ ] Production database deployed and accessible
- [ ] Application deployed to production URL
- [ ] Stripe test webhooks configured and working
- [ ] Test payments complete successfully
- [ ] Orders created correctly in production database
- [ ] Email notifications working
- [ ] Admin panel accessible and functional
- [ ] All environment variables configured correctly

### Launch (Live Mode)

- [ ] Stripe account fully verified
- [ ] Live webhook endpoints configured
- [ ] Live API keys deployed to production
- [ ] Small test transaction processed successfully
- [ ] Monitoring systems in place
- [ ] Support procedures documented
- [ ] Rollback plan prepared

### Post-Launch (First 48 Hours)

- [ ] Monitor all transactions closely
- [ ] Check webhook delivery success rates
- [ ] Verify email notifications for all orders
- [ ] Test admin functions (order management, status updates)
- [ ] Monitor error rates and performance
- [ ] Be available for immediate issue resolution

---

## 🔄 Rollback Plan

If issues arise after going live:

### Immediate Actions (< 5 minutes)

1. **Switch back to test keys** in production environment
2. **Add maintenance message** to website
3. **Document the issue** with screenshots/logs

### Investigation (< 30 minutes)

1. **Check Stripe Dashboard** for error patterns
2. **Review application logs** for error details
3. **Test in development** to reproduce issue
4. **Identify root cause**

### Resolution

1. **Fix issue** in development environment
2. **Test thoroughly** with test keys in production
3. **Deploy fix** to production
4. **Switch back to live keys**
5. **Monitor closely** for 24 hours

---

## 📞 Support Resources

### When You Need Help

**Stripe Support:**

- Dashboard: Help & Support section
- Documentation: https://stripe.com/docs
- Community: https://github.com/stripe

**Supabase Support:**

- Dashboard: Support section
- Documentation: https://supabase.com/docs
- Community: https://github.com/supabase/supabase/discussions

**Emergency Contacts:**

- Keep your hosting platform support info handy
- Have your Stripe account details accessible
- Document your Supabase project references

---

## 🎉 Success Metrics

### What Success Looks Like

**Technical Metrics:**

- 99%+ payment success rate
- < 2 second webhook processing time
- 100% webhook delivery success
- Zero data loss incidents

**Business Metrics:**

- Reduced no-shows (payment guarantees orders)
- Faster order processing
- Better customer experience
- Automated confirmation emails

**Operational Metrics:**

- Less manual payment handling
- Automated inventory management
- Real-time order tracking
- Streamlined admin workflows

---

## 🚀 You're Ready for Production!

This guide provides a safe, step-by-step approach to deploying your sandwich shop app to production. The key is to:

1. **Start with test mode** in production to verify everything works
2. **Test thoroughly** before switching to live payments
3. **Monitor closely** during the first few days
4. **Have a rollback plan** ready

Remember: It's better to take your time and deploy safely than to rush and have issues with real customer payments! [[memory:6366886]]

Good luck with your launch! 🎯
