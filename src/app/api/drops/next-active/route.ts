import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Get the next active drop
    const { data: drops, error: dropsError } = await supabase
      .from('drops')
      .select(
        `
        id,
        date,
        status,
        location_id,
        locations (
          id,
          name,
          address,
          location_url,
          pickup_hour_start,
          pickup_hour_end
        )
      `
      )
      .eq('status', 'active')
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .limit(1);

    if (dropsError) {
      console.error('Error fetching next active drop:', dropsError);
      return NextResponse.json(
        { error: 'Failed to fetch next active drop' },
        { status: 500 }
      );
    }

    if (!drops || drops.length === 0) {
      return NextResponse.json(null);
    }

    const drop = drops[0];

    // Get products with inventory for this drop
    const { data: dropProducts, error: inventoryError } = await supabase
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
          active,
          sort_order
        )
      `
      )
      .eq('drop_id', drop.id)
      .eq('products.active', true)
      .order('products.sort_order', { ascending: true });

    if (inventoryError) {
      console.error('Error fetching drop inventory:', inventoryError);
      return NextResponse.json(
        { error: 'Failed to fetch drop inventory' },
        { status: 500 }
      );
    }

    // Transform the data to match the expected format
    const products =
      dropProducts?.map(dp => ({
        id: dp.products.id,
        name: dp.products.name,
        description: dp.products.description,
        sell_price: dp.selling_price,
        category: dp.products.category,
        active: dp.products.active,
        sort_order: dp.products.sort_order,
        availableStock: dp.available_quantity,
      })) || [];

    const result = {
      drop: {
        id: drop.id,
        date: drop.date,
        status: drop.status,
        location: drop.locations,
      },
      products,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
