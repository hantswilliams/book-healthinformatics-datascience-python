const { createClient } = require('@supabase/supabase-js');

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function updateTestOrg() {
  try {
    console.log('Updating testaaa organization to Starter tier...');
    
    const { data, error } = await supabase
      .from('organizations')
      .update({
        subscription_tier: 'STARTER',
        max_seats: 25,
        subscription_status: 'ACTIVE',
        updated_at: new Date().toISOString()
      })
      .eq('slug', 'testaaa')
      .select();

    if (error) {
      console.error('Error updating organization:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Successfully updated organization:', data[0]);
      console.log('✅ testaaa now has:');
      console.log('   - Subscription Tier: STARTER');
      console.log('   - Max Seats: 25');
      console.log('   - Status: ACTIVE');
    } else {
      console.log('No organization found with slug "testaaa"');
    }
    
  } catch (error) {
    console.error('Script error:', error);
  }
}

updateTestOrg();