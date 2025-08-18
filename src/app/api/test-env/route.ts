import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const envCheck = {
      RESEND_API_KEY: process.env.RESEND_API_KEY ? 'Present' : 'Missing',
      RESEND_API_KEY_LENGTH: process.env.RESEND_API_KEY?.length || 0,
      RESEND_API_KEY_START: process.env.RESEND_API_KEY?.substring(0, 10) || 'N/A',
      SHOP_EMAIL: process.env.NEXT_PUBLIC_SHOP_EMAIL || 'Not set',
      SHOP_PHONE: process.env.NEXT_PUBLIC_SHOP_PHONE || 'Not set',
      NODE_ENV: process.env.NODE_ENV || 'Not set',
    };

    console.log('🔍 Environment check:', envCheck);

    return NextResponse.json({
      success: true,
      message: 'Environment variables check',
      envCheck,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('❌ Environment check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
