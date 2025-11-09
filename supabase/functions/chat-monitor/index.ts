import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Max-Age": "86400",
};

interface ChatMessageData {
  chat_id: number;
  message_id: number;
  bot_name: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Parse request body
    const body: ChatMessageData = await req.json();

    // Validate required fields
    if (!body.chat_id || !body.message_id || !body.bot_name) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: chat_id, message_id, bot_name",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate types
    if (
      typeof body.chat_id !== "number" ||
      typeof body.message_id !== "number" ||
      typeof body.bot_name !== "string"
    ) {
      return new Response(
        JSON.stringify({
          error:
            "chat_id and message_id must be numbers, bot_name must be a string",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Validate bot_name format (basic check)
    if (!body.bot_name.trim() || body.bot_name.length < 1) {
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

    // Insert data into chat_messages table
    // Используем ON CONFLICT для предотвращения дубликатов
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: body.chat_id,
        message_id: body.message_id,
        bot_name: body.bot_name.trim(),
      })
      .select()
      .single();

    if (error) {
      // Если ошибка из-за дубликата (unique constraint), возвращаем успех
      if (error.code === "23505") {
        return new Response(
          JSON.stringify({
            success: true,
            message: "Message already exists",
            data: {
              chat_id: body.chat_id,
              message_id: body.message_id,
              bot_name: body.bot_name,
            },
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          },
        );
      }

      console.error("Error inserting chat message:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to save data",
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
        data: {
          id: data.id,
          chat_id: data.chat_id,
          message_id: data.message_id,
          bot_name: data.bot_name,
          created_at: data.created_at,
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
