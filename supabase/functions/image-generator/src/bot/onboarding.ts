import { Context } from "https://deno.land/x/grammy@v1.8.3/context.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPremiumStatus } from "../database/premium.ts";
import { getUserByTelegramId } from "../database/users.ts";
import { createI18n } from "../utils/i18n.ts";

export async function onboarding(ctx: Context, supabase?: SupabaseClient) {
  console.log("onboarding command");

  // Получаем язык пользователя из базы данных или используем русский по умолчанию
  let language = "ru";
  if (supabase && ctx.from?.id) {
    const user = await getUserByTelegramId(supabase, ctx.from.id);
    language = user?.language || "ru";
  }

  const i18n = createI18n(language);

  // Основное приветственное сообщение
  await ctx.reply(
    `${i18n.t("onboarding_welcome")}\n\n${
      i18n.t("onboarding_description")
    }\n\n${i18n.t("onboarding_instructions")}\n> ${
      i18n.t("onboarding_example1")
    }\n\n${i18n.t("onboarding_example_photo")}\n${
      i18n.t("onboarding_example_result")
    }\n\n${i18n.t("onboarding_free_generations")}\n${
      i18n.t("onboarding_subscribe_hint")
    }\n${i18n.t("onboarding_limits_hint")}`,
  );

  // Отправляем примеры изображений
  await ctx.replyWithMediaGroup(
    [
      {
        type: "photo",
        media:
          "AgACAgIAAxkBAAICm2jQFzT8662KSxUsHSPbrLtRA-ULAAKt-DEbDMWJSkYgtCiYMdZFAQADAgADcwADNgQ",
      },
      // {
      //   type: "photo",
      //   media:
      //     "AgACAgIAAxkBAAICpWjQF8QSOPvLEH_KIfEQYQ6p6I0-AAK9-DEbDMWJSjD1gT0WycbMAQADAgADcwADNgQ",
      // },
      // {
      //   type: "photo",
      //   media:
      //     "AgACAgIAAxkBAAICp2jQF8vZyditRe539WVwbL063bRSAAK--DEbDMWJShLXg5ux5CBUAQADAgADcwADNgQ",
      // },
      // {
      //   type: "photo",
      //   media:
      //     "AgACAgIAAxkBAAICqWjQF9LM2HeByDKK0e-y3crWWk-VAAK_-DEbDMWJShMVPqgESbktAQADAgADcwADNgQ",
      // },
    ],
  );

  // Отправляем второе сообщение через 5 минут для неактивных пользователей
  const userId = ctx.from?.id;
  if (userId && supabase) {
    setTimeout(async () => {
      try {
        // Проверяем, использовал ли пользователь свои генерации
        const user = await getUserByTelegramId(supabase, userId);
        if (user) {
          const premiumStatus = await getPremiumStatus(supabase, user.id);
          if (premiumStatus && premiumStatus.generation_limit < 2) {
            // Пользователь уже использовал генерации - не отправляем follow-up
            return;
          }
        }
        await ctx.reply(i18n.t("onboarding_followup"));
      } catch (_error) {
        console.log(
          "Follow-up message not sent (user might have left or blocked bot)",
        );
      }
    }, 300000); // 5 минут = 300000 миллисекунд
  }
}
