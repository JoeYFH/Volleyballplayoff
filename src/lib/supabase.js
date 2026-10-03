import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yjacbolmzmjutwvxowpe.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlqYWNib2xtem1qdXR3dnhvd3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA4MDc4NTQsImV4cCI6MjEwNjM4Mzg1NH0.6iB-dXLssRMT7gxRVpX1GF5IKkKz1xfQiUfO13GH3pA';

export function ogShareUrl(sessionId) {
  return `${SUPABASE_URL}/functions/v1/og?id=${encodeURIComponent(sessionId)}&apikey=${SUPABASE_ANON_KEY}`;
}

export const ADMIN_EMAILS = [
  'abc8038570@gmail.com',
];

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
