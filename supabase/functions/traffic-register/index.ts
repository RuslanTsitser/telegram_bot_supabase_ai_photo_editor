import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

interface TrafficUserData {
  email: string;
  name: string;
  traffic_source: string;
  app_name?: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: TrafficUserData = await req.json();

    // Validate required fields
    if (!body.email || !body.name || !body.traffic_source) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: email, name, traffic_source",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Missing Supabase environment variables");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert data into traffic_users table
    const insertData: any = {
      email: body.email.trim(),
      name: body.name.trim(),
      traffic_source: body.traffic_source.trim(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Add app_name if provided
    if (body.app_name) {
      insertData.app_name = body.app_name.trim();
    }

    const { data, error } = await supabase
      .from("traffic_users")
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error("Error inserting traffic user:", error);
      return new Response(
        JSON.stringify({ error: "Failed to save data", details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          id: data.id,
          email: data.email,
          name: data.name,
          traffic_source: data.traffic_source,
          app_name: data.app_name || null,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});

