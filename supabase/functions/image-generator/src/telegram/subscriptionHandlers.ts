import { Context } from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import { SubscriptionPlan } from "../database/db_types.ts";
import { formatWithDeclension } from "../utils/declension.ts";

// Создание invoice для платного тарифа
export async function createSubscriptionInvoice(
  ctx: Context,
  plan: SubscriptionPlan,
) {
  const userId = ctx.from?.id;
  if (!userId) return;

  try {
    // Создаем invoice с правильными параметрами согласно документации
    let message: string = "";
    if (plan.description) {
      message += `${plan.description}`;
    } else if (plan.type === "subscription") {
      message += `Подписка на ${
        formatWithDeclension(plan.value, ["день", "дня", "дней"])
      }`;
    } else if (plan.type === "one_time") {
      message += `${
        formatWithDeclension(plan.value, [
          "генерация",
          "генерации",
          "генераций",
        ])
      }`;
    }

    const payload = `${plan.id}_${userId}`;
    const token = Deno.env.get("YOOKASSA_PROVIDER_TOKEN") || "";
    const currency = "RUB";

    await ctx.api.sendInvoice(
      ctx.chat?.id!,
      `Подписка: ${plan.name}`,
      message,
      payload,
      token,
      currency,
      [{
        label: plan.name,
        amount: Math.round(plan.price), // в копейках
      }],
    );

    await ctx.answerCallbackQuery("✅ Создан счет для оплаты");
  } catch (error) {
    console.error("Error creating invoice:", error);
    await ctx.answerCallbackQuery("❌ Ошибка при создании счета");
  }
}
