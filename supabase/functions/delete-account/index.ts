import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // First verify the user with their token
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid user token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = user.id;
    console.log("Deleting account for user:", userId);

    // Create admin client to delete user data and auth record
    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Delete user's data in order (respecting foreign key constraints)
    // 1. Delete user_playlist_items (via cascade from user_playlists)
    // 2. Delete user_playlists
    await adminClient.from("user_playlists").delete().eq("profile_id", userId);
    console.log("Deleted user playlists");

    // 3. Delete watch_history
    await adminClient.from("watch_history").delete().eq("profile_id", userId);
    console.log("Deleted watch history");

    // 4. Delete likes
    await adminClient.from("likes").delete().eq("profile_id", userId);
    console.log("Deleted likes");

    // 5. Delete favorites
    await adminClient.from("favorites").delete().eq("profile_id", userId);
    console.log("Deleted favorites");

    // 6. Delete channel_notifications
    await adminClient.from("channel_notifications").delete().eq("profile_id", userId);
    console.log("Deleted channel notifications");

    // 7. Delete indie_channel_favorites
    await adminClient.from("indie_channel_favorites").delete().eq("profile_id", userId);
    console.log("Deleted indie channel favorites");

    // 8. Delete channel_views
    await adminClient.from("channel_views").delete().eq("profile_id", userId);
    console.log("Deleted channel views");

    // 9. Delete user_profiles (all profiles for this account)
    await adminClient.from("user_profiles").delete().eq("account_id", userId);
    console.log("Deleted user profiles");

    // 10. Delete indie_channels owned by user
    await adminClient.from("indie_channels").delete().eq("owner_id", userId);
    console.log("Deleted indie channels");

    // 11. Delete talents profile if exists
    await adminClient.from("talents").delete().eq("user_id", userId);
    console.log("Deleted talents profile");

    // 12. Delete user_roles
    await adminClient.from("user_roles").delete().eq("user_id", userId);
    console.log("Deleted user roles");

    // 13. Delete profiles table entry
    await adminClient.from("profiles").delete().eq("id", userId);
    console.log("Deleted profile");

    // Finally, delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    
    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user account", details: deleteError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Successfully deleted user account:", userId);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in delete-account function:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
