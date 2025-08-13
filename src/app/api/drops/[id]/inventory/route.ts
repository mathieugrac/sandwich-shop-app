import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: dropProducts, error } = await supabase
      .from('drop_products')
      .select(
        `
        *,
        products (
          id,
          name,
          description,
          category,
          sell_price,
          production_cost,
          active,
          sort_order
        )
      `
      )
      .eq('drop_id', params.id)
      .order('products.sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching drop inventory:', error);
      return NextResponse.json(
        { error: 'Failed to fetch drop inventory' },
        { status: 500 }
      );
    }

    return NextResponse.json(dropProducts);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const { inventory } = body;

    if (!Array.isArray(inventory)) {
      return NextResponse.json(
        { error: 'Inventory must be an array' },
        { status: 400 }
      );
    }

    // Update each drop product
    for (const item of inventory) {
      const { product_id, stock_quantity, selling_price } = item;

      if (!product_id || stock_quantity === undefined || !selling_price) {
        return NextResponse.json(
          { error: 'Product ID, stock quantity, and selling price are required' },
          { status: 400 }
        );
      }

      const { error } = await supabase
        .from('drop_products')
        .update({
          stock_quantity,
          selling_price,
          updated_at: new Date().toISOString(),
        })
        .eq('drop_id', params.id)
        .eq('product_id', product_id);

      if (error) {
        console.error('Error updating drop product:', error);
        return NextResponse.json(
          { error: 'Failed to update drop product' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ message: 'Drop inventory updated successfully' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
