import { Context } from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// Функция для создания/обновления пользователя
export async function upsertUser(ctx: Context, supabase: SupabaseClient) {
  if (!ctx.from) return;

  try {
    await supabase.rpc("upsert_user", {
      telegram_id_param: ctx.from.id,
      telegram_username_param: ctx.from.username || null,
      telegram_first_name_param: ctx.from.first_name || null,
      telegram_last_name_param: ctx.from.last_name || null,
      telegram_photo_url_param: null,
    });
  } catch (error) {
    console.error("Ошибка при создании/обновлении пользователя:", error);
  }
}
