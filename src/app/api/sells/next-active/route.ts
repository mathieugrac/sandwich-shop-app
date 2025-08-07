import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export async function GET() {
  try {
    // Get the next active sell
    const { data: nextSell, error: sellError } = await supabase.rpc(
      'get_next_active_sell'
    );

    if (sellError) {
      console.error('Error fetching next active sell:', sellError);
      return NextResponse.json(
        { error: 'Failed to fetch next active sell' },
        { status: 500 }
      );
    }

    if (!nextSell || nextSell.length === 0) {
      return NextResponse.json(
        { error: 'No active sell found' },
        { status: 404 }
      );
    }

    const sell = nextSell[0];

    // Get inventory for this sell
    const { data: inventory, error: inventoryError } = await supabase
      .from('sell_inventory')
      .select(
        `
        *,
        products (
          id,
          name,
          description,
          price,
          image_url,
          category,
          active,
          sort_order
        )
      `
      )
      .eq('sell_id', sell.id)
      .order('products.sort_order');

    if (inventoryError) {
      console.error('Error fetching sell inventory:', inventoryError);
      return NextResponse.json(
        { error: 'Failed to fetch sell inventory' },
        { status: 500 }
      );
    }

    // Filter only active products with inventory
    const availableProducts =
      inventory
        ?.filter(item => item.products.active && item.available_quantity > 0)
        .map(item => ({
          ...item.products,
          availableStock: item.available_quantity,
        })) || [];

    return NextResponse.json({
      sell: {
        id: sell.id,
        sell_date: sell.sell_date,
        status: sell.status,
      },
      products: availableProducts,
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
