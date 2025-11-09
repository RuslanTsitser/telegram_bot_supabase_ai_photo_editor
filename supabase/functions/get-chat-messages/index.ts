import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

interface GetChatMessagesParams {
  chat_id: number;
  bot_name: string;
  date_from?: string; // ISO date string
  date_to?: string; // ISO date string
  limit?: number; // default 100, max 1000
  offset?: number; // default 0
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let params: GetChatMessagesParams;

    // Поддерживаем как GET (query params), так и POST (body)
    if (req.method === "GET") {
      const url = new URL(req.url);
      const chatId = url.searchParams.get("chat_id");
      const botName = url.searchParams.get("bot_name");
      const dateFrom = url.searchParams.get("date_from");
      const dateTo = url.searchParams.get("date_to");
      const limit = url.searchParams.get("limit");
      const offset = url.searchParams.get("offset");

      if (!chatId || !botName) {
        return new Response(
          JSON.stringify({
            error: "Missing required query parameters: chat_id, bot_name",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      params = {
        chat_id: parseInt(chatId, 10),
        bot_name: botName,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        limit: limit ? parseInt(limit, 10) : undefined,
        offset: offset ? parseInt(offset, 10) : undefined,
      };
    } else {
      // POST request
      const body: GetChatMessagesParams = await req.json();

      if (!body.chat_id || !body.bot_name) {
        return new Response(
          JSON.stringify({
            error: "Missing required fields: chat_id, bot_name",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      params = body;
    }

    // Validate types
    if (
      typeof params.chat_id !== "number" ||
      typeof params.bot_name !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error: "chat_id must be a number, bot_name must be a string",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate bot_name
    if (!params.bot_name.trim()) {
      return new Response(
        JSON.stringify({
          error: "bot_name cannot be empty",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate and set defaults for limit and offset
    const limit = Math.min(params.limit || 100, 1000); // max 1000
    const offset = params.offset || 0;

    // Validate dates if provided
    if (params.date_from && isNaN(Date.parse(params.date_from))) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid date_from format. Use ISO date string (e.g., 2025-01-15T00:00:00Z)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (params.date_to && isNaN(Date.parse(params.date_to))) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid date_to format. Use ISO date string (e.g., 2025-01-15T23:59:59Z)",
        }),
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

    // Build query
    let query = supabase
      .from("chat_messages")
      .select("*", { count: "exact" })
      .eq("chat_id", params.chat_id)
      .eq("bot_name", params.bot_name.trim())
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Add date filters if provided
    if (params.date_from) {
      query = query.gte("created_at", params.date_from);
    }

    if (params.date_to) {
      query = query.lte("created_at", params.date_to);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching chat messages:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to fetch messages",
          details: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        data: data || [],
        pagination: {
          total: count || 0,
          limit,
          offset,
          has_more: count ? offset + limit < count : false,
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
