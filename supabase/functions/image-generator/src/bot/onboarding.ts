import { Context } from "https://deno.land/x/grammy@v1.8.3/context.ts";
import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getUserByTelegramId } from "../database/users.ts";
import { createI18n } from "../utils/i18n.ts";

export async function onboarding(ctx: Context, supabase?: SupabaseClient) {
  console.log("help command");

  // Получаем язык пользователя из базы данных или используем русский по умолчанию
  let language = "ru";
  if (supabase && ctx.from?.id) {
    const user = await getUserByTelegramId(supabase, ctx.from.id);
    language = user?.language || "ru";
  }

  const i18n = createI18n(language);

  await ctx.reply(
    `${i18n.t("onboarding_welcome")}\n${i18n.t("onboarding_description")}\n\n${
      i18n.t("onboarding_rules")
    }\n${i18n.t("onboarding_rule1")}\n${i18n.t("onboarding_rule2")}\n${
      i18n.t("onboarding_rule3")
    }\n${i18n.t("onboarding_rule4")}\n\n${i18n.t("onboarding_examples")}`,
  );
  await ctx.replyWithMediaGroup(
    [
      {
        type: "photo",
        media:
          "AgACAgIAAxkBAAICm2jQFzT8662KSxUsHSPbrLtRA-ULAAKt-DEbDMWJSkYgtCiYMdZFAQADAgADcwADNgQ",
      },
      {
        type: "photo",
        media:
          "AgACAgIAAxkBAAICpWjQF8QSOPvLEH_KIfEQYQ6p6I0-AAK9-DEbDMWJSjD1gT0WycbMAQADAgADcwADNgQ",
      },
      {
        type: "photo",
        media:
          "AgACAgIAAxkBAAICp2jQF8vZyditRe539WVwbL063bRSAAK--DEbDMWJShLXg5ux5CBUAQADAgADcwADNgQ",
      },
      {
        type: "photo",
        media:
          "AgACAgIAAxkBAAICqWjQF9LM2HeByDKK0e-y3crWWk-VAAK_-DEbDMWJShMVPqgESbktAQADAgADcwADNgQ",
      },
    ],
  );
  await ctx.reply(
    `${i18n.t("onboarding_important")}\n\n${i18n.t("onboarding_tip1")}\n${
      i18n.t("onboarding_tip2")
    }\n${i18n.t("onboarding_tip3")}\n${i18n.t("onboarding_tip4")}\n\n${
      i18n.t("onboarding_initial_generations")
    }\n${i18n.t("onboarding_try_buy")}\n\n${
      i18n.t("onboarding_subscribe_command")
    }\n${i18n.t("onboarding_limits_command")}`,
  );
}
