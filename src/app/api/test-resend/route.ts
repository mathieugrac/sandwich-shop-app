import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
  try {
    console.log('Testing Resend configuration...');
    console.log('API Key present:', !!process.env.RESEND_API_KEY);
    console.log('API Key length:', process.env.RESEND_API_KEY?.length);
    console.log(
      'API Key starts with:',
      process.env.RESEND_API_KEY?.substring(0, 10)
    );

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: 'RESEND_API_KEY is missing',
          envCheck: {
            RESEND_API_KEY: 'Missing',
            NODE_ENV: process.env.NODE_ENV,
          },
        },
        { status: 500 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Test with a simple email
    const { data, error } = await resend.emails.send({
      from: process.env.NEXT_PUBLIC_SHOP_EMAIL || 'orders@fome-sandes.pt',
      to: 'mathieugrac@gmail.com', // Your admin email
      subject: 'Test Email from Fomé - ' + new Date().toISOString(),
      html:
        '<p>This is a test email from your Fomé sandwich shop app.</p><p>Time: ' +
        new Date().toISOString() +
        '</p>',
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log('Resend success:', data);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
