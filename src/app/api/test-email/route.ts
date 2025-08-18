import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function GET() {
  try {
    console.log('🧪 Testing email functionality...');
    console.log('📧 RESEND_API_KEY present:', !!process.env.RESEND_API_KEY);
    console.log(
      '📧 NEXT_PUBLIC_SHOP_EMAIL:',
      process.env.NEXT_PUBLIC_SHOP_EMAIL
    );

    // Test email with sample data
    const result = await sendOrderConfirmationEmail({
      orderNumber: 'TEST-20241218-0001',
      customerName: 'Test Customer',
      customerEmail: 'mathieugrac@gmail.com', // Your admin email
      pickupTime: '12:00',
      pickupDate: '2024-12-18',
      items: [
        {
          productName: 'Test Sandwich',
          quantity: 1,
          unitPrice: 8.5,
          totalPrice: 8.5,
        },
      ],
      totalAmount: 8.5,
      specialInstructions: 'This is a test order',
    });

    if (result) {
      console.log('✅ Test email sent successfully:', result);
      return NextResponse.json({
        success: true,
        message: 'Test email sent successfully',
        emailData: result,
      });
    } else {
      console.log('❌ Test email failed - no result returned');
      return NextResponse.json({
        success: false,
        message: 'Test email failed - no result returned',
      });
    }
  } catch (error) {
    console.error('❌ Test email error:', error);
    return NextResponse.json({
      success: false,
      message: 'Test email failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
