import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const { data: inventoryData, error } = await supabase
      .from('drop_products')
      .select(
        `
        id,
        stock_quantity,
        reserved_quantity,
        available_quantity,
        selling_price,
        products (
          id,
          name,
          description,
          category,
          active
        ),
        drops (
          id,
          date,
          status,
          locations (
            name,
            district
          )
        )
      `
      )
      .eq('drops.date', date)
      .eq('drops.status', 'active')
      .eq('products.active', true);

    if (error) {
      console.error('Error fetching inventory:', error);
      return NextResponse.json(
        { error: 'Failed to fetch inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json(inventoryData);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
