# DNS Configuration Guide for Fomé Domains

## 🎯 Current Status (December 2024)

**❌ ISSUES IDENTIFIED:**
- All domains pointing to OVH parking page (216.198.79.1) instead of Vercel
- No Vercel DNS records configured
- Resend domain verification failed
- Domains not accessible

**✅ WHAT'S WORKING:**
- `www.fome-sandwiches.com` is working (likely already configured)
- Environment variables are correctly set for `fome-sandes.pt`

## 🚀 Step-by-Step Fix

### Step 1: Add Domain to Vercel Dashboard

1. **Go to [vercel.com/dashboard](https://vercel.com/dashboard)**
2. **Select your `sandwich-shop-app` project**
3. **Navigate to Settings → Domains**
4. **Click "Add Domain"**
5. **Enter:** `fome-sandes.pt`
6. **Vercel will provide exact DNS records to configure**

### Step 2: Configure OVH DNS Records

**In your OVH DNS panel for `fome-sandes.pt`, add these records:**

#### A Record (Root Domain)
```
Type: A
Name: @ (or leave empty)
Value: 76.76.19.36
TTL: 3600
```

#### CNAME Record (WWW)
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600
```

#### TXT Record (Vercel Verification)
```
Type: TXT
Name: @
Value: vc-domain-verify=fome-sandes.pt,<vercel-provided-code>
TTL: 3600
```

### Step 3: Add Domain to Resend

1. **Go to [resend.com/domains](https://resend.com/domains)**
2. **Click "Add Domain"**
3. **Enter:** `fome-sandes.pt`
4. **Resend will provide additional DNS records**

#### Additional DNS Records for Resend

**DKIM Record:**
```
Type: TXT
Name: resend._domainkey
Value: (provided by Resend)
TTL: 3600
```

**SPF Record:**
```
Type: TXT
Name: @
Value: v=spf1 include:_spf.resend.com ~all
TTL: 3600
```

**DMARC Record:**
```
Type: TXT
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@fome-sandes.pt
TTL: 3600
```

### Step 4: Update Email Configuration

**In your email service, update the from address:**
- Change from: `onboarding@resend.dev`
- Change to: `orders@fome-sandes.pt`

## 🔍 Verification Steps

### Check DNS Propagation

Run the DNS checker script:

```bash
node check-dns.js
```

### Expected Results

After configuration, you should see:

- ✅ A Records: 76.76.19.36 (Vercel)
- ✅ TXT Records: Vercel verification + Resend records
- ✅ Domain accessible at https://fome-sandes.pt

### Test Email Functionality

1. **Go to your app**
2. **Place a test order**
3. **Verify email is sent from orders@fome-sandes.pt**

## ⏰ Timeline

- **DNS Changes:** 15 minutes to 48 hours (usually 1-2 hours)
- **Vercel Verification:** Immediate after DNS propagation
- **Resend Verification:** 15 minutes to 2 hours after DNS propagation

## 🚨 Troubleshooting

### Domain Not Working

1. **Check DNS propagation:** Use `nslookup fome-sandes.pt`
2. **Verify Vercel configuration:** Check Vercel dashboard
3. **Clear browser cache:** Hard refresh (Ctrl+F5)

### Email Not Working

1. **Check Resend domain status:** resend.com/domains
2. **Verify DNS records:** All TXT records must be present
3. **Test with simple email:** Use Resend's test feature

### Common Issues

- **DNS not propagated:** Wait longer, check with different DNS servers
- **Wrong IP address:** Ensure using Vercel's IP (76.76.19.36)
- **Missing TXT records:** Add all required verification records

## 📞 Support

If you encounter issues:

1. **Check OVH DNS panel** for record configuration
2. **Verify Vercel domain settings**
3. **Check Resend domain verification status**
4. **Use the DNS checker script to diagnose issues**

## 🎯 Success Criteria

Your setup is complete when:

- ✅ https://fome-sandes.pt loads your app
- ✅ https://www.fome-sandes.pt redirects properly
- ✅ Emails are sent from orders@fome-sandes.pt
- ✅ Resend domain shows as "Verified"
- ✅ Vercel domain shows as "Valid"

## 🔄 For Other Domains

Once `fome-sandes.pt` is working, you can repeat the same process for:
- `fome-sandwiches.com`
- `fome.club`

**Note:** You can configure multiple domains to point to the same Vercel project.
