import { Context } from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { User } from "./db_types.ts";

// Функция для создания/обновления пользователя
export async function upsertUser(ctx: Context, supabase: SupabaseClient) {
  if (!ctx.from) return;

  console.log("upsertUser", ctx.from);

  const userData = {
    telegram_id: ctx.from.id,
    telegram_username: ctx.from.username || null,
    telegram_first_name: ctx.from.first_name || null,
    telegram_last_name: ctx.from.last_name || null,
    telegram_photo_url: null,
    language: ctx.from.language_code || "ru",
    updated_at: new Date().toISOString(),
  };

  // Сначала пытаемся найти существующего пользователя
  const { data: existingUser } = await supabase
    .from("users")
    .select("id")
    .eq("telegram_id", ctx.from.id)
    .single();

  let result;
  if (existingUser) {
    // Обновляем существующего пользователя
    const { data, error } = await supabase
      .from("users")
      .update(userData)
      .eq("id", existingUser.id)
      .select()
      .single();

    if (error) {
      console.error("Ошибка обновления пользователя:", error);
      return;
    }
    result = data;
  } else {
    // Создаем нового пользователя
    const { data, error } = await supabase
      .from("users")
      .insert({
        ...userData,
        created_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("Ошибка создания пользователя:", error);
      return;
    }
    result = data;

    // Создаем запись премиум статуса для нового пользователя
    const { error: premiumError } = await supabase
      .from("premium_statuses")
      .insert({
        user_id: result.id,
        is_premium: false,
        generation_limit: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (premiumError) {
      console.error("Ошибка создания премиум статуса:", premiumError);
    }
  }

  console.log("Пользователь успешно обработан:", result);
  return result;
}

// Функция для получения пользователя по Telegram ID
export async function getUserByTelegramId(
  supabase: SupabaseClient,
  telegramId: number,
): Promise<User | null> {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("telegram_id", telegramId)
    .single();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function getUserLanguage(
  supabase: SupabaseClient,
  telegramId: number,
): Promise<string> {
  const { data, error } = await supabase
    .from("users")
    .select("language")
    .eq("telegram_id", telegramId)
    .single();

  if (error || !data) {
    console.error("Ошибка получения языка пользователя:", error);
    return "ru"; // По умолчанию русский
  }

  return data.language || "ru";
}
