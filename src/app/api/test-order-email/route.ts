import { NextResponse } from 'next/server';
import { sendOrderConfirmationEmail } from '@/lib/email';

export async function GET() {
  try {
    console.log('🧪 Testing order confirmation email...');
    
    // Test with sample order data (same structure as real order)
    const testOrderData = {
      orderNumber: 'TEST-20241218-0001',
      customerName: 'Test Customer',
      customerEmail: 'mathieugrac@gmail.com',
      pickupTime: '12:00',
      pickupDate: '2024-12-18',
      items: [
        {
          productName: 'Nutty Beet',
          quantity: 1,
          unitPrice: 10.00,
          totalPrice: 10.00,
        },
        {
          productName: 'Fresh Lemonade',
          quantity: 2,
          unitPrice: 3.50,
          totalPrice: 7.00,
        },
      ],
      totalAmount: 17.00,
      specialInstructions: 'This is a test order confirmation email',
    };

    console.log('📧 Sending order confirmation email with data:', testOrderData);
    
    const result = await sendOrderConfirmationEmail(testOrderData);

    if (result) {
      console.log('✅ Order confirmation email sent successfully:', result);
      return NextResponse.json({
        success: true,
        message: 'Order confirmation email sent successfully',
        emailData: result,
        testData: testOrderData,
      });
    } else {
      console.log('❌ Order confirmation email failed - no result returned');
      return NextResponse.json({
        success: false,
        message: 'Order confirmation email failed - no result returned',
        testData: testOrderData,
      });
    }
    
  } catch (error) {
    console.error('❌ Order confirmation email error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
  }
}
