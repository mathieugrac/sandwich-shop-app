import { NextResponse } from 'next/server';
import { Resend } from 'resend';

// Debug endpoint to test email functionality - Updated for deployment
export async function GET() {
  try {
    console.log('🔍 Debugging email functionality...');

    // Check environment variables
    const envVars = {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Present' : 'Missing',
      RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length || 0,
      SHOP_EMAIL: process.env.NEXT_PUBLIC_SHOP_EMAIL || 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
    };

    console.log('📧 Environment variables:', envVars);

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY is missing',
        envVars,
      });
    }

    // Test Resend client
    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log('📧 Testing Resend client...');

    const { data, error } = await resend.emails.send({
      from: process.env.NEXT_PUBLIC_SHOP_EMAIL || 'orders@fome-sandes.pt',
      to: 'mathieugrac@gmail.com',
      subject: 'Debug Test Email - ' + new Date().toISOString(),
      html: `
        <h1>Debug Test Email</h1>
        <p>This is a debug test email to check if email functionality is working.</p>
        <p>Time: ${new Date().toISOString()}</p>
        <p>From: ${process.env.NEXT_PUBLIC_SHOP_EMAIL || 'orders@fome-sandes.pt'}</p>
        <p>Environment: ${process.env.NODE_ENV}</p>
      `,
    });

    if (error) {
      console.error('❌ Resend error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error,
        envVars,
      });
    }

    console.log('✅ Email sent successfully:', data);

    return NextResponse.json({
      success: true,
      message: 'Debug email sent successfully',
      emailId: data?.id,
      envVars,
    });
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
