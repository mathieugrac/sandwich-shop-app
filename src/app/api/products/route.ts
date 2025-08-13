import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET() {
  try {
    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching products:', error);
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      );
    }

    return NextResponse.json(products);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      sell_price,
      production_cost,
      category,
      active,
      sort_order,
    } = body;

    // Validate required fields
    if (!name || !sell_price || !production_cost || !category) {
      return NextResponse.json(
        {
          error: 'Name, sell price, production cost, and category are required',
        },
        { status: 400 }
      );
    }

    // Validate category
    const validCategories = ['sandwich', 'side', 'dessert', 'beverage'];
    if (!validCategories.includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert({
        name,
        description,
        sell_price,
        production_cost,
        category,
        active: active !== undefined ? active : true,
        sort_order: sort_order || 0,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating product:', error);
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      id,
      name,
      description,
      sell_price,
      production_cost,
      category,
      active,
      sort_order,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (sell_price !== undefined) updateData.sell_price = sell_price;
    if (production_cost !== undefined)
      updateData.production_cost = production_cost;
    if (category !== undefined) {
      const validCategories = ['sandwich', 'side', 'dessert', 'beverage'];
      if (!validCategories.includes(category)) {
        return NextResponse.json(
          { error: 'Invalid category' },
          { status: 400 }
        );
      }
      updateData.category = category;
    }
    if (active !== undefined) updateData.active = active;
    if (sort_order !== undefined) updateData.sort_order = sort_order;

    updateData.updated_at = new Date().toISOString();

    const { data: product, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return NextResponse.json(
        { error: 'Failed to update product' },
        { status: 500 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
