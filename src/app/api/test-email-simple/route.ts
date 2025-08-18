import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
  try {
    console.log('🧪 Testing email with verified domain...');
    console.log('📧 RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);

    const resend = new Resend(process.env.RESEND_API_KEY);

    const { data, error } = await resend.emails.send({
      from: process.env.NEXT_PUBLIC_SHOP_EMAIL || 'orders@fome-sandes.pt',
      to: 'mathieugrac@gmail.com', // Your admin email
      subject: 'Test Email from Fomé - ' + new Date().toISOString(),
      html: `
        <h1>Test Email from Fomé</h1>
        <p>This is a test email from your verified domain.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>Domain: fome-sandes.pt</p>
      `,
    });

    if (error) {
      console.error('❌ Email error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
      });
    }

    console.log('✅ Email sent successfully:', data);
    return NextResponse.json({
      success: true,
      message: 'Test email sent successfully',
      emailId: data?.id,
      to: 'mathieugrac@gmail.com',
      from: process.env.NEXT_PUBLIC_SHOP_EMAIL || 'orders@fome-sandes.pt',
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
