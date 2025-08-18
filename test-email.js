const { Resend } = require('resend');

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmail() {
  console.log('🧪 Testing Email Functionality');
  console.log('='.repeat(50));

  console.log(
    '📧 API Key Status:',
    process.env.RESEND_API_KEY ? 'Present' : 'Missing'
  );

  try {
    const { data, error } = await resend.emails.send({
      from: 'orders@fome-sandes.pt',
      to: 'mathieugrac@gmail.com', // Your admin email
      subject: 'Test Email from Fomé',
      html: `
        <h1>Test Email</h1>
        <p>This is a test email from your Fomé sandwich shop app.</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    });

    if (error) {
      console.error('❌ Email Error:', error);
      return;
    }

    console.log('✅ Email sent successfully!');
    console.log('📧 Email ID:', data?.id);
    console.log('📧 To:', 'mathieugrac@gmail.com');
    console.log('📧 From:', 'orders@fome-sandes.pt');
  } catch (error) {
    console.error('❌ Email sending failed:', error);
  }
}

testEmail();
