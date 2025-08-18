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
  } catch (error) {
    console.log(`❌ TXT Records: ${error.message}`);
  }
}

async function main() {
  console.log('🚀 DNS Configuration Checker');
  console.log('='.repeat(50));

  const domains = [
    'fome-sandes.pt',
    'www.fome-sandes.pt',
    'fome-sandwiches.com',
    'fome.club',
  ];

  for (const domain of domains) {
    await checkDomain(domain);
  }

  console.log('\n📋 Next Steps:');
  console.log('1. Add domain to Vercel dashboard');
  console.log('2. Add domain to Resend dashboard');
  console.log('3. Configure DNS records in OVH');
  console.log('4. Wait for DNS propagation (up to 48 hours)');
  console.log('5. Run this script again to verify');
}

main().catch(console.error);
