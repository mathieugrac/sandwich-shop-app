import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    // Get the next active sell with location information
    const { data: nextSell, error: sellError } = await supabase
      .from('sells')
      .select(
        `
        *,
        locations (
          id,
          name,
          district,
          address,
          google_maps_link,
          delivery_timeframe
        )
      `
      )
      .eq('status', 'active')
      .gte('sell_date', new Date().toISOString().split('T')[0])
      .order('sell_date', { ascending: true })
      .limit(1)
      .single();

    if (sellError) {
      console.error('Error fetching next active sell:', sellError);
      // Return successful response with empty data instead of 404
      return NextResponse.json({
        sell: null,
        products: [],
      });
    }

    if (!nextSell) {
      return NextResponse.json({
        sell: null,
        products: [],
      });
    }

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
      .eq('sell_id', nextSell.id);

    if (inventoryError) {
      console.error('Error fetching sell inventory:', inventoryError);
      // Don't fail completely, just return empty products
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
        id: nextSell.id,
        sell_date: nextSell.sell_date,
        status: nextSell.status,
        location: nextSell.locations,
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
