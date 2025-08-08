import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export async function GET() {
  try {
    console.log('Testing Resend configuration...');
    console.log('API Key present:', !!process.env.RESEND_API_KEY);
    console.log('API Key length:', process.env.RESEND_API_KEY?.length);
    
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Test with a simple email
    const { data, error } = await resend.emails.send({
      from: 'onboarding@resend.dev', // Use Resend's default sender
      to: 'test@example.com',
      subject: 'Test Email',
      html: '<p>This is a test email from Resend</p>',
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
