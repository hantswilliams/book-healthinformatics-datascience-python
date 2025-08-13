import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './supabase';

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// Export singleton instance for client-side usage
export const supabase = createClient();