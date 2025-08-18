import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
  try {
    console.log('🧪 Testing simple email...');
    
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({
        success: false,
        error: 'RESEND_API_KEY is missing',
      });
    }
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    console.log('📧 Sending simple email...');
    
    const { data, error } = await resend.emails.send({
      from: 'orders@fome-sandes.pt',
      to: 'mathieugrac@gmail.com',
      subject: 'Simple Test Email',
      html: '<p>This is a simple test email.</p>',
    });

    if (error) {
      console.error('❌ Email error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
      });
    }

    console.log('✅ Email sent successfully:', data);
    return NextResponse.json({
      success: true,
      message: 'Simple email sent successfully',
      emailId: data?.id,
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
