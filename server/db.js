const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://ljlicipifdiirstjbgmc.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxqbGljaXBpZmRpaXJzdGpiZ21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg0MzExOTQsImV4cCI6MjA5NDAwNzE5NH0.PAFYYAXbc8SsvUooHkAnCVIPiRpz3GTI4LeYS0ZKGiQ';

let supabase = null;

function getDb() {
    if (!supabase) {
        supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }
    return supabase;
}

module.exports = { getDb, SUPABASE_URL, SUPABASE_ANON_KEY };
