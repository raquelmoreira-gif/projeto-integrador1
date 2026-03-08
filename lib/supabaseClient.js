import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://yheyhjcdzljcpoputsvo.supabase.co";

const supabaseKey = "sb_publishable_XKyEzrlSkHF_EqNHpsnxrQ__suhLExR";

export const supabase = createClient(supabaseUrl, supabaseKey);
