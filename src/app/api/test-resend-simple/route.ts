import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    
    return NextResponse.json({
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      apiKeyStart: apiKey?.substring(0, 10) + '...',
      envVars: {
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        NEXT_PUBLIC_SHOP_EMAIL: process.env.NEXT_PUBLIC_SHOP_EMAIL,
      }
    });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
