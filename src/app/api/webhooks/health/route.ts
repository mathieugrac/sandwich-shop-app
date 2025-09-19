import { NextResponse } from 'next/server';

export async function GET() {
  // Simple health check for webhook endpoint
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Webhook endpoint is accessible',
  });
}
