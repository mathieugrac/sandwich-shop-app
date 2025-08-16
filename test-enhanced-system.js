#!/usr/bin/env node

/**
 * Enhanced Drop Management System - Phase 4 Testing
 * Tests all enhanced functions and validates the system
 */

const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  console.error('Please check your .env file');
  process.exit(1);
}

// Create Supabase client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

console.log('🚀 Starting Enhanced Drop Management System - Phase 4 Testing');
console.log('='.repeat(60));

async function runTests() {
  try {
    console.log('\n📋 Test 1: Database Schema Validation');
    await testDatabaseSchema();

    console.log('\n📋 Test 2: Core Functions Testing');
    await testCoreFunctions();

    console.log('\n📋 Test 3: Data Integrity Validation');
    await testDataIntegrity();

    console.log('\n📋 Test 4: Performance Testing');
    await testPerformance();

    console.log('\n📋 Test 5: Edge Case Validation');
    await testEdgeCases();

    console.log('\n📋 Test 6: API Endpoint Testing');
    await testAPIEndpoints();

    console.log('\n✅ All tests completed!');
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

async function testDatabaseSchema() {
  console.log('  🔍 Checking database schema updates...');

  // Check if new columns exist
  const { data: columns, error: columnsError } = await supabase
    .from('information_schema.columns')
    .select('column_name, data_type, is_nullable')
    .eq('table_name', 'drops')
    .in('column_name', [
      'pickup_deadline',
      'status_changed_at',
      'last_modified_by',
    ]);

  if (columnsError) {
    console.log('    ⚠️ Could not check columns (using direct query)');
    // Try direct query
    const { data: directColumns, error: directError } =
      await supabase.rpc('check_drops_schema');

    if (directError) {
      console.log('    ❌ Schema check failed:', directError.message);
      return;
    }

    console.log('    ✅ Schema check completed via direct query');
  } else {
    console.log(`    ✅ Found ${columns.length} new columns`);
    columns.forEach(col => {
      console.log(
        `      - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`
      );
    });
  }

  // Check if admin_users table exists
  const { data: adminTable, error: adminError } = await supabase
    .from('admin_users')
    .select('count')
    .limit(1);

  if (adminError) {
    console.log('    ❌ admin_users table not found or not accessible');
  } else {
    console.log('    ✅ admin_users table exists and accessible');
  }
}

async function testCoreFunctions() {
  console.log('  🔍 Testing core database functions...');

  // Test get_admin_upcoming_drops
  try {
    const { data: upcomingDrops, error: upcomingError } = await supabase.rpc(
      'get_admin_upcoming_drops'
    );

    if (upcomingError) {
      console.log(
        '    ❌ get_admin_upcoming_drops failed:',
        upcomingError.message
      );
    } else {
      console.log(
        `    ✅ get_admin_upcoming_drops: ${upcomingDrops?.length || 0} drops found`
      );
    }
  } catch (error) {
    console.log('    ❌ get_admin_upcoming_drops error:', error.message);
  }

  // Test get_admin_past_drops
  try {
    const { data: pastDrops, error: pastError } = await supabase.rpc(
      'get_admin_past_drops'
    );

    if (pastError) {
      console.log('    ❌ get_admin_past_drops failed:', pastError.message);
    } else {
      console.log(
        `    ✅ get_admin_past_drops: ${pastDrops?.length || 0} drops found`
      );
    }
  } catch (error) {
    console.log('    ❌ get_admin_past_drops error:', error.message);
  }

  // Test get_next_active_drop
  try {
    const { data: nextActive, error: nextError } = await supabase.rpc(
      'get_next_active_drop'
    );

    if (nextError) {
      console.log('    ❌ get_next_active_drop failed:', nextError.message);
    } else {
      console.log(
        `    ✅ get_next_active_drop: ${nextActive?.length || 0} drops found`
      );
    }
  } catch (error) {
    console.log('    ❌ get_next_active_drop error:', error.message);
  }

  // Test calculate_pickup_deadline
  try {
    // Get a sample location first
    const { data: locations, error: locError } = await supabase
      .from('locations')
      .select('id, name, pickup_hour_end')
      .eq('active', true)
      .limit(1);

    if (locError || !locations?.length) {
      console.log('    ⚠️ No locations available for deadline testing');
    } else {
      const location = locations[0];
      const { data: deadline, error: deadlineError } = await supabase.rpc(
        'calculate_pickup_deadline',
        {
          p_drop_date: new Date().toISOString().split('T')[0],
          p_location_id: location.id,
        }
      );

      if (deadlineError) {
        console.log(
          '    ❌ calculate_pickup_deadline failed:',
          deadlineError.message
        );
      } else {
        console.log(`    ✅ calculate_pickup_deadline: ${deadline}`);
      }
    }
  } catch (error) {
    console.log('    ❌ calculate_pickup_deadline error:', error.message);
  }
}

async function testDataIntegrity() {
  console.log('  🔍 Validating data integrity...');

  // Check if all drops have pickup_deadline
  const { data: drops, error: dropsError } = await supabase
    .from('drops')
    .select('id, status, pickup_deadline');

  if (dropsError) {
    console.log('    ❌ Could not fetch drops:', dropsError.message);
    return;
  }

  const totalDrops = drops.length;
  const dropsWithDeadline = drops.filter(d => d.pickup_deadline).length;
  const dropsMissingDeadline = totalDrops - dropsWithDeadline;

  console.log(`    📊 Total drops: ${totalDrops}`);
  console.log(`    📊 Drops with deadline: ${dropsWithDeadline}`);
  console.log(`    📊 Drops missing deadline: ${dropsMissingDeadline}`);

  if (dropsMissingDeadline === 0) {
    console.log('    ✅ All drops have pickup_deadline');
  } else {
    console.log('    ⚠️ Some drops are missing pickup_deadline');
  }

  // Check drop status distribution
  const statusCounts = {};
  drops.forEach(drop => {
    statusCounts[drop.status] = (statusCounts[drop.status] || 0) + 1;
  });

  console.log('    📊 Drop status distribution:');
  Object.entries(statusCounts).forEach(([status, count]) => {
    console.log(`      - ${status}: ${count}`);
  });
}

async function testPerformance() {
  console.log('  🔍 Testing function performance...');

  // Test execution time for key functions
  const functions = [
    'get_admin_upcoming_drops',
    'get_admin_past_drops',
    'get_next_active_drop',
  ];

  for (const funcName of functions) {
    try {
      const startTime = Date.now();

      const { data, error } = await supabase.rpc(funcName);

      const endTime = Date.now();
      const executionTime = endTime - startTime;

      if (error) {
        console.log(`    ❌ ${funcName} failed:`, error.message);
      } else {
        console.log(`    ✅ ${funcName}: ${executionTime}ms`);

        if (executionTime > 200) {
          console.log(`      ⚠️ Slow execution (>200ms)`);
        }
      }
    } catch (error) {
      console.log(`    ❌ ${funcName} error:`, error.message);
    }
  }
}

async function testEdgeCases() {
  console.log('  🔍 Testing edge cases...');

  // Check for drops with past dates but active status
  const { data: pastActiveDrops, error: pastActiveError } = await supabase
    .from('drops')
    .select('id, date, status')
    .lt('date', new Date().toISOString().split('T')[0])
    .eq('status', 'active');

  if (pastActiveError) {
    console.log(
      '    ❌ Could not check past active drops:',
      pastActiveError.message
    );
  } else {
    console.log(
      `    📊 Drops with past dates but active status: ${pastActiveDrops?.length || 0}`
    );

    if (pastActiveDrops?.length > 0) {
      console.log('      ⚠️ Found drops that should be completed');
      pastActiveDrops.forEach(drop => {
        console.log(`        - Drop ${drop.id}: ${drop.date} (${drop.status})`);
      });
    }
  }

  // Check for drops with future dates but completed status
  const { data: futureCompletedDrops, error: futureCompletedError } =
    await supabase
      .from('drops')
      .select('id, date, status')
      .gt('date', new Date().toISOString().split('T')[0])
      .eq('status', 'completed');

  if (futureCompletedError) {
    console.log(
      '    ❌ Could not check future completed drops:',
      futureCompletedError.message
    );
  } else {
    console.log(
      `    📊 Drops with future dates but completed status: ${futureCompletedDrops?.length || 0}`
    );

    if (futureCompletedDrops?.length > 0) {
      console.log('      ⚠️ Found drops marked as completed in the future');
    }
  }
}

async function testAPIEndpoints() {
  console.log('  🔍 Testing API endpoints...');

  // Test the admin upcoming drops API using curl command
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    const { stdout: upcomingResponse } = await execAsync('curl -s "http://localhost:3001/api/drops/admin/upcoming"');
    const upcomingData = JSON.parse(upcomingResponse);
    console.log(`    ✅ /api/drops/admin/upcoming: ${upcomingData?.length || 0} drops`);
    
    const { stdout: pastResponse } = await execAsync('curl -s "http://localhost:3001/api/drops/admin/past"');
    const pastData = JSON.parse(pastResponse);
    console.log(`    ✅ /api/drops/admin/past: ${pastData?.length || 0} drops`);
    
  } catch (error) {
    console.log('    ⚠️ API testing failed:', error.message);
  }
}

// Run the test suite
runTests().catch(console.error);
