// JS client for Supabase Initialization
const SUPABASE_URL = 'https://pviwplgdiotrxbplaemf.supabase.co';

const SUPABASE_KEY = 'sb_publishable_XIBR30cHhRhp9XXUijS2eg_D7EW9mgy';

// Inicializamos el cliente de Supabase
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
