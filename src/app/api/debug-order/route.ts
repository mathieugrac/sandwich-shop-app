import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    console.log('🔍 Debug: Starting order creation...');
    
    // Log the request body
    const body = await request.json();
    console.log('🔍 Debug: Request body:', body);
    
    // Check if all required fields are present
    const requiredFields = ['customerName', 'customerEmail', 'pickupTime', 'pickupDate', 'items', 'totalAmount'];
    const missingFields = requiredFields.filter(field => !body[field]);
    
    if (missingFields.length > 0) {
      console.log('❌ Debug: Missing fields:', missingFields);
      return NextResponse.json({
        success: false,
        error: 'Missing required fields',
        missingFields: missingFields,
      });
    }
    
    console.log('✅ Debug: All required fields present');
    console.log('✅ Debug: Items count:', body.items?.length);
    console.log('✅ Debug: Total amount:', body.totalAmount);
    
    // For now, just return success without doing anything
    return NextResponse.json({
      success: true,
      message: 'Debug check passed - all data looks good',
      receivedData: {
        customerName: body.customerName,
        customerEmail: body.customerEmail,
        itemsCount: body.items?.length,
        totalAmount: body.totalAmount,
      },
    });
    
  } catch (error) {
    console.error('❌ Debug: Error parsing request:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to parse request body',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
