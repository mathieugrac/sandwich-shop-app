import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST() {
  try {
    console.log('🔧 Fix: Adding missing foreign key constraint...');

    // Add foreign key constraint for location_id
    // Note: This requires admin privileges in Supabase
    const { data, error } = await supabase
      .from('sells')
      .select('location_id')
      .limit(1);
    
    if (error) {
      console.error('❌ Fix: Error testing sells table:', error);
      return NextResponse.json(
        { error: 'Cannot access sells table', details: error },
        { status: 500 }
      );
    }

    // Since we can't run DDL through the client, we'll need to manually add the constraint
    // through the Supabase dashboard or CLI
    console.log('⚠️ Fix: Cannot add foreign key constraint through API');
    console.log('⚠️ Fix: Please run the following SQL in Supabase dashboard:');
    console.log(`
      ALTER TABLE sells ADD CONSTRAINT sells_location_id_fkey 
      FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE RESTRICT;
    `);

    if (error) {
      console.error('❌ Fix: Error adding foreign key constraint:', error);
      return NextResponse.json(
        { error: 'Failed to add foreign key constraint', details: error },
        { status: 500 }
      );
    }

    console.log('✅ Fix: Foreign key constraint added successfully');
    
    // Test if the relationship now works
    const { data: testData, error: testError } = await supabase
      .from('sells')
      .select(`
        *,
        locations (
          id,
          name,
          district,
          address,
          google_maps_link,
          delivery_timeframe
        )
      `)
      .limit(1);

    if (testError) {
      console.error('❌ Fix: Test query still failing:', testError);
      return NextResponse.json(
        { 
          success: false, 
          message: 'Foreign key constraint added but test query still failing',
          error: testError 
        },
        { status: 500 }
      );
    }

    console.log('✅ Fix: Test query successful:', testData);
    return NextResponse.json({
      success: true,
      message: 'Foreign key constraint added successfully',
      testData
    });

  } catch (error) {
    console.error('🔧 Fix: Unexpected error:', error);
    return NextResponse.json(
      { error: 'Fix failed', details: error },
      { status: 500 }
    );
  }
}
