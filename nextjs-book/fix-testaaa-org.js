// Quick fix for testaaa organization
const { createClient } = require('@supabase/supabase-js');

async function fixTestOrg() {
  try {
    // You'll need to run this with environment variables
    console.log('This script needs to be run with proper environment variables');
    console.log('Run this instead:');
    console.log('');
    console.log('UPDATE organizations SET');
    console.log('  max_seats = 25,');
    console.log('  trial_ends_at = \'2025-09-15T23:59:59.000Z\'');
    console.log('WHERE slug = \'testaaa\';');
    console.log('');
    console.log('This will set:');
    console.log('- max_seats to 25 (correct for STARTER tier)');
    console.log('- trial_ends_at to September 15, 2025');
  } catch (error) {
    console.error('Error:', error);
  }
}

fixTestOrg();