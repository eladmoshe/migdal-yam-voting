import { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

// Helper function to introduce realistic delays
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Handler for the keep-alive endpoint
export const handler: Handler = async (event) => {
  const startTime = Date.now();
  
  // Validate request method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed. Use POST.' }),
    };
  }

  // Validate secret token
  const providedSecret = event.headers['x-keep-alive-secret'];
  const expectedSecret = process.env.KEEP_ALIVE_SECRET;
  
  if (!expectedSecret) {
    console.error('KEEP_ALIVE_SECRET environment variable is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }
  
  if (providedSecret !== expectedSecret) {
    console.warn('Invalid keep-alive secret provided');
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized. Invalid secret token.' }),
    };
  }

  // Initialize Supabase client
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials not found in environment variables');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database configuration error' }),
    };
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Step 1: Count apartments (realistic query)
    console.log('Step 1: Counting apartments...');
    const { count: apartmentsCount, error: apartmentsError } = await supabase
      .from('apartments')
      .select('*', { count: 'exact', head: true });
    
    if (apartmentsError) throw apartmentsError;
    await delay(800); // Realistic delay

    // Step 2: Fetch recent voting issues (realistic read)
    console.log('Step 2: Fetching recent voting issues...');
    const { data: recentIssues, error: issuesError } = await supabase
      .from('voting_issues')
      .select('id, title, active, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (issuesError) throw issuesError;
    const issuesCount = recentIssues?.length || 0;
    await delay(600); // Realistic delay

    // Step 3: Count total votes (aggregate query)
    console.log('Step 3: Counting total votes...');
    const { count: votesCount, error: votesError } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true });
    
    if (votesError) throw votesError;
    await delay(500); // Realistic delay

    // Step 4: Insert health check record (write operation)
    console.log('Step 4: Inserting health check record...');
    const responseTime = Date.now() - startTime;
    const { data: healthCheck, error: insertError } = await supabase
      .from('health_checks')
      .insert({
        source: 'github-actions',
        apartments_count: apartmentsCount,
        issues_count: issuesCount,
        votes_count: votesCount,
        response_time_ms: responseTime,
      })
      .select()
      .single();
    
    if (insertError) throw insertError;
    await delay(400); // Realistic delay

    // Step 5: Read back the inserted record (verification)
    console.log('Step 5: Verifying health check record...');
    const { data: verification, error: verifyError } = await supabase
      .from('health_checks')
      .select('*')
      .eq('id', healthCheck.id)
      .single();
    
    if (verifyError) throw verifyError;

    const totalTime = Date.now() - startTime;
    
    // Success response with detailed stats
    console.log(`Keep-alive completed successfully in ${totalTime}ms`);
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        success: true,
        timestamp: new Date().toISOString(),
        stats: {
          apartments: apartmentsCount,
          issues: issuesCount,
          votes: votesCount,
        },
        performance: {
          totalTimeMs: totalTime,
          operationsCompleted: 5,
        },
        healthCheckId: healthCheck.id,
      }),
    };
  } catch (error) {
    console.error('Keep-alive error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString(),
      }),
    };
  }
};


