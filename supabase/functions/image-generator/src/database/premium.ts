import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PremiumStatus } from "./db_types.ts";

// Функция для получения премиум статуса пользователя
export async function getPremiumStatus(
  supabase: SupabaseClient,
  userId: string,
): Promise<PremiumStatus | null> {
  const { data, error } = await supabase
    .from("premium_statuses")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

// Функция для проверки, может ли пользователь генерировать изображения
export async function canUserGenerate(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ canGenerate: boolean; reason?: string; limit?: number }> {
  const premiumStatus = await getPremiumStatus(supabase, userId);

  if (!premiumStatus) {
    return { canGenerate: false, reason: "Пользователь не найден" };
  }

  // 1) Сначала проверяем is_premium - это перманентный премиум от админа
  if (premiumStatus.is_premium) {
    // Перманентный премиум - можно генерировать без ограничений
    return { canGenerate: true, limit: -1 }; // -1 означает безлимит
  }

  // 2) Если не премиум, то проверяем активна ли подписка
  if (premiumStatus.premium_expires_at) {
    const expiresAt = new Date(premiumStatus.premium_expires_at);
    const now = new Date();

    if (expiresAt > now) {
      // Подписка активна - можно генерировать без ограничений
      return { canGenerate: true, limit: -1 }; // -1 означает безлимит
    }
  }

  // 3) Если нет подписки, то проверяем generation_limit
  if (premiumStatus.generation_limit <= 0) {
    return {
      canGenerate: false,
      reason: "Исчерпан лимит генерации",
      limit: 0,
    };
  }
  return { canGenerate: true, limit: premiumStatus.generation_limit };
}

// Функция для уменьшения лимита генерации
export async function decrementGenerationLimit(
  supabase: SupabaseClient,
  userId: string,
): Promise<void> {
  const premiumStatus = await getPremiumStatus(supabase, userId);

  if (!premiumStatus) {
    return;
  }

  // Если премиум или подписка - просто return
  if (premiumStatus.is_premium) {
    return;
  }

  if (premiumStatus.premium_expires_at) {
    const expiresAt = new Date(premiumStatus.premium_expires_at);
    const now = new Date();

    if (expiresAt > now) {
      return;
    }
  }

  // Декремент, но не меньше 0
  await supabase.rpc("decrement_generation_limit", {
    user_id_param: userId,
  });
}
