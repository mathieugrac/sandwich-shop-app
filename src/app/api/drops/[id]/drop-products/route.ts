import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('🔍 API: Fetching drop products for drop ID:', id);

    // Validate drop ID
    if (!id || typeof id !== 'string' || id.trim() === '') {
      console.error('❌ API: Invalid drop ID:', id);
      return NextResponse.json({ error: 'Invalid drop ID' }, { status: 400 });
    }

    // First get the drop with location information
    const { data: drop, error: dropError } = await supabase
      .from('drops')
      .select(
        `
        *,
        location:locations (
          id,
          name,
          address,
          district,
          location_url,
          pickup_hour_start,
          pickup_hour_end
        )
      `
      )
      .eq('id', id)
      .single();

    if (dropError || !drop) {
      console.error('❌ API: Error fetching drop:', dropError);
      return NextResponse.json({ error: 'Drop not found' }, { status: 404 });
    }

    console.log('✅ API: Drop found:', drop.id, drop.date);

    // Check if drop is accessible (not completed or cancelled)
    if (drop.status === 'completed' || drop.status === 'cancelled') {
      console.log('⚠️ API: Drop is not active:', drop.status);
      // Still return the drop data but with empty products
      return NextResponse.json({
        ...drop,
        dropProducts: [],
      });
    }

    // Then get the drop products with product information and images
    const { data: dropProducts, error: dropProductsError } = await supabase
      .from('drop_products')
      .select(
        `
        *,
        product:products (
          id,
          name,
          description,
          category,
          sell_price,
          production_cost,
          active,
          sort_order,
          product_images (
            id,
            image_url,
            alt_text,
            sort_order
          )
        )
      `
      )
      .eq('drop_id', id);

    console.log('🔍 API: drop_products query result:', {
      count: dropProducts?.length || 0,
      error: dropProductsError,
      dropProducts: dropProducts,
      dropProductsType: typeof dropProducts,
      dropProductsIsArray: Array.isArray(dropProducts),
      dropProductsIsNull: dropProducts === null,
      dropProductsIsUndefined: dropProducts === undefined,
    });

    // If there's an error fetching drop products, log it but don't fail
    if (dropProductsError) {
      console.error('❌ API: Error fetching drop products:', dropProductsError);
      // Don't return an error, just use empty drop products
    }

    // Ensure dropProducts is always an array - handle null, undefined, and non-array cases
    let safeDropProducts: typeof dropProducts = [];
    if (Array.isArray(dropProducts)) {
      safeDropProducts = dropProducts;
    } else if (dropProducts === null || dropProducts === undefined) {
      safeDropProducts = [];
    } else {
      console.warn('⚠️ API: dropProducts is not an array, converting to array:', dropProducts);
      safeDropProducts = [dropProducts];
    }

    console.log('🔍 API: Safe drop products:', {
      original: dropProducts,
      safe: safeDropProducts,
      safeLength: safeDropProducts.length,
    });

    // Return the complete structure
    const result = {
      ...drop,
      dropProducts: safeDropProducts,
    };

    console.log(
      '✅ API: Returning result with drop products count:',
      result.dropProducts.length,
      'Result structure:',
      {
        hasDropProducts: !!result.dropProducts,
        dropProductsType: typeof result.dropProducts,
        dropProductsIsArray: Array.isArray(result.dropProducts),
        dropProductsLength: result.dropProducts?.length,
      }
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ API: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { dropProducts } = body;

    if (!Array.isArray(dropProducts)) {
      return NextResponse.json(
        { error: 'Drop products must be an array' },
        { status: 400 }
      );
    }

    // Update each drop product
    for (const item of dropProducts) {
      const { product_id, stock_quantity, selling_price } = item;

      if (!product_id || stock_quantity === undefined || !selling_price) {
        return NextResponse.json(
          {
            error: 'Product ID, stock quantity, and selling price are required',
          },
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
        .eq('drop_id', id)
        .eq('product_id', product_id);

      if (error) {
        console.error('Error updating drop product:', error);
        return NextResponse.json(
          { error: 'Failed to update drop product' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      message: 'Drop products updated successfully',
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
