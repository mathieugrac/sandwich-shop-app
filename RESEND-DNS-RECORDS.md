# Resend DNS Records for fome-sandes.pt

## 📧 Required DNS Records for Email Authentication

### DKIM and SPF (Required)

#### 1. MX Record

```
Type: MX
Host/Name: send
Value: feedback-smtp.eu-west-1.amazonses.com
Priority: 10
TTL: Auto
Status: Pending
```

#### 2. TXT Record (SPF)

```
Type: TXT
Host/Name: send
Value: v=spf1 include:amazonses.com ~all
TTL: Auto
Status: Pending
```

#### 3. TXT Record (DKIM)

```
Type: TXT
Host/Name: resend._domainkey
Value: p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQCi4CUmP8hMG6tNIXT+SULPH9+G060gGRBPKOyxP0nbEcyFf8n5iPPh0kcDhPnyZiaLXnobw+Ehslp42ljVdPQw87ogkXqp4wqD6w+TS3BAqks7TENhP/QqQK8Cl3nDHMbfWrlMPWxv6iTa+Uxvo/mlf2hhRC06Cn32K5nG8BmiwwIDAQAB
TTL: Auto
Status: Pending
```

### DMARC (Recommended)

#### 4. TXT Record (DMARC)

```
Type: TXT
Host/Name: _dmarc
Value: v=DMARC1; p=none;
TTL: Auto
```

## 🔧 OVH Configuration Notes

**Important:** The Host/Name field in Resend corresponds to the "Domaine" field in OVH:

- `send` → `send.fome-sandes.pt`
- `resend._domainkey` → `resend._domainkey.fome-sandes.pt`
- `_dmarc` → `_dmarc.fome-sandes.pt`

## ⏰ Verification Timeline

- **DNS Propagation:** 15 minutes to 2 hours
- **Resend Verification:** Automatic after DNS propagation
- **Status:** All records currently show "Pending"

## 🎯 Success Criteria

Once verified, Resend dashboard should show:

- ✅ MX Record: Verified
- ✅ SPF Record: Verified
- ✅ DKIM Record: Verified
- ✅ Domain Status: "Verified"

## 📞 Troubleshooting

If records remain "Pending":

1. Check DNS propagation: `dig +short TXT send.fome-sandes.pt`
2. Verify OVH configuration matches exactly
3. Wait longer for propagation (up to 48 hours)
4. Contact Resend support if still pending after 48 hours
