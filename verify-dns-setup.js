const dns = require('dns');
const { promisify } = require('util');

const resolve4 = promisify(dns.resolve4);
const resolveTxt = promisify(dns.resolveTxt);

async function checkDomain(domain) {
  console.log(`\n🔍 Checking DNS for: ${domain}`);
  console.log('='.repeat(50));

  try {
    // Check A records
    const aRecords = await resolve4(domain);
    console.log(`✅ A Records: ${aRecords.join(', ')}`);

    // Check if it's pointing to Vercel
    if (aRecords.includes('76.76.19.36')) {
      console.log('✅ Domain is pointing to Vercel!');
    } else if (aRecords.includes('216.198.79.1')) {
      console.log('❌ Domain is still pointing to OVH parking page');
      console.log('   → Need to configure DNS records in OVH');
    } else {
      console.log('❌ Domain is NOT pointing to Vercel yet');
    }
  } catch (error) {
    console.log(`❌ A Records: ${error.message}`);
  }

  try {
    // Check TXT records
    const txtRecords = await resolveTxt(domain);
    console.log(`📝 TXT Records:`);
    txtRecords.forEach((record, index) => {
      console.log(`   ${index + 1}. ${record.join('')}`);
    });

    // Check for Vercel verification
    const hasVercelVerification = txtRecords.some(record => 
      record.join('').includes('vc-domain-verify')
    );
    
    if (hasVercelVerification) {
      console.log('✅ Vercel verification TXT record found');
    } else {
      console.log('❌ Vercel verification TXT record missing');
    }

    // Check for Resend records
    const hasResendRecords = txtRecords.some(record => 
      record.join('').includes('resend._domainkey') || 
      record.join('').includes('_spf.resend.com')
    );
    
    if (hasResendRecords) {
      console.log('✅ Resend email records found');
    } else {
      console.log('❌ Resend email records missing');
    }

  } catch (error) {
    console.log(`❌ TXT Records: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 DNS Setup Verification Tool');
  console.log('='.repeat(50));
  console.log('This tool will help you verify your DNS configuration.');
  console.log('');

  const domains = [
    'fome-sandes.pt',
    'www.fome-sandes.pt',
  ];

  for (const domain of domains) {
    await checkDomain(domain);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Add domain to Vercel dashboard');
  console.log('2. Configure DNS records in OVH (see DNS-SETUP-GUIDE.md)');
  console.log('3. Add domain to Resend dashboard');
  console.log('4. Wait for DNS propagation (15 min - 48 hours)');
  console.log('5. Run this script again to verify');
  
  console.log('\n🔧 Quick Commands:');
  console.log('• Check DNS: node verify-dns-setup.js');
  console.log('• Full DNS check: node check-dns.js');
  console.log('• View setup guide: cat DNS-SETUP-GUIDE.md');
}

main().catch(console.error);
