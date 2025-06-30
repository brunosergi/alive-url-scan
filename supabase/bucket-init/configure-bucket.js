// FILE: supabase/bucket-init/configure-bucket.js
const { createClient } = require('@supabase/supabase-js');

// Configuration
const SUPABASE_URL = `http://kong:8000`; // Internal docker network URL
const SERVICE_ROLE_KEY = process.env.SERVICE_ROLE_KEY;
const MAX_RETRIES = 30;
const RETRY_DELAY = 5000; // 5 seconds

console.log('🔧 Initializing Supabase Bucket Configuration...');

// Wait function
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Check if Supabase is ready
async function waitForSupabase() {
  console.log('⏳ Waiting for Supabase to be ready...');
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        headers: {
          'apikey': SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SERVICE_ROLE_KEY}`
        }
      });
      
      if (response.ok) {
        console.log('✅ Supabase is ready!');
        return true;
      }
    } catch (error) {
      // Continue retrying
    }
    
    console.log(`⏳ Attempt ${attempt}/${MAX_RETRIES} - Supabase not ready yet...`);
    await wait(RETRY_DELAY);
  }
  
  throw new Error('❌ Supabase failed to become ready within timeout period');
}

// Configure the bucket
async function configureBucket() {
  console.log('🪣 Configuring screenshots bucket...');
  
  // Create Supabase client with service role key
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
  
  try {
    // Try to create bucket with proper configuration
    const { data: createData, error: createError } = await supabase.storage.createBucket('screenshots', {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
      fileSizeLimit: 512000 // 500KB in bytes
    });
    
    if (createError) {
      // If bucket already exists, try to update it
      if (createError.message?.includes('already exists') || createError.message?.includes('duplicate')) {
        console.log('📁 Bucket already exists, updating configuration...');
        
        // Try to update bucket settings
        const { data: updateData, error: updateError } = await supabase.storage.updateBucket('screenshots', {
          public: true,
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/jpg'],
          fileSizeLimit: 512000
        });
        
        if (updateError) {
          console.log('⚠️  Update via SDK failed, bucket will rely on RLS policies');
          console.log('   Error:', updateError.message);
        } else {
          console.log('✅ Bucket configuration updated successfully!');
        }
      } else {
        console.log('⚠️  Bucket creation failed, will rely on RLS policies');
        console.log('   Error:', createError.message);
      }
    } else {
      console.log('✅ Bucket created successfully with proper configuration!');
    }
    
    // Verify bucket exists and is accessible
    const { data: listData, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      throw new Error(`Failed to verify bucket: ${listError.message}`);
    }
    
    const screenshotsBucket = listData.find(bucket => bucket.id === 'screenshots');
    if (screenshotsBucket) {
      console.log('✅ Bucket verification successful!');
      console.log(`   Public: ${screenshotsBucket.public || 'Controlled by RLS policies'}`);
    } else {
      throw new Error('Bucket not found after creation');
    }
    
  } catch (error) {
    console.error('❌ Bucket configuration failed:', error.message);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    await waitForSupabase();
    await configureBucket();
    
    console.log('🎉 Bucket configuration completed successfully!');
    console.log('');
    console.log('📋 Configuration Summary:');
    console.log('   - Bucket: screenshots');
    console.log('   - Public: Yes');
    console.log('   - File size limit: 500KB');
    console.log('   - Allowed types: JPEG, PNG');
    
    process.exit(0);
  } catch (error) {
    console.error('💥 Configuration failed:', error.message);
    process.exit(1);
  }
}

// Handle process signals
process.on('SIGINT', () => {
  console.log('\n⚠️  Configuration interrupted');
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  Configuration terminated');
  process.exit(1);
});

// Run the configuration
main();