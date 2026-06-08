import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const email = "1sammystore1@gmail.com"; // 

const { data: user } = await supabase.auth.admin.getUserByEmail(email);
console.log("User ID:", user?.user?.id);

const { error } = await supabase.from("user_roles").upsert({
  user_id: user?.user?.id,
  role: "admin"
});

console.log(error ? "Error: " + error.message : "Done! Admin role set.");
