import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { ProcessPaymentResult, SuccessfulPayment } from "./payment_types.ts";
import { getSubscriptionPlan } from "./plans.ts";
import { getUserByTelegramId } from "./users.ts";

// Функция для обработки успешного платежа
export async function processSuccessfulPayment(
  supabase: SupabaseClient,
  payment: SuccessfulPayment,
): Promise<ProcessPaymentResult> {
  try {
    // Парсим invoice_payload для получения planId
    const payload = payment.invoice_payload;
    if (!payload) {
      return {
        success: false,
        message: "Неверные данные платежа",
      };
    }

    const [planId, userId] = payload.split("_");
    if (!planId || !userId) {
      return {
        success: false,
        message: "Неверный формат данных платежа",
      };
    }

    // Получаем пользователя
    const user = await getUserByTelegramId(supabase, Number(userId));
    if (!user) {
      return {
        success: false,
        message: "Пользователь не найден в базе данных",
      };
    }

    const plan = await getSubscriptionPlan(supabase, planId);
    if (!plan) {
      return {
        success: false,
        message: "Тарифный план не найден",
      };
    }

    // Добавляем запись об успешном платеже
    const { error: paymentError } = await supabase
      .from("payments")
      .insert([{
        user_id: user.id,
        plan_id: planId,
        youkassa_payment_id: payment.telegram_payment_charge_id,
        amount: payment.total_amount,
        currency: payment.currency,
        status: "succeeded",
      }]);

    if (paymentError) {
      return {
        success: false,
        message: "Ошибка при создании записи о платеже",
      };
    }

    // Обрабатываем тариф
    if (plan.type === "subscription") {
      // Используем SQL функцию для обновления подписки
      const { error: premiumError } = await supabase.rpc(
        "update_premium_subscription",
        {
          user_id_param: user.id,
          days_param: plan.value,
        },
      );

      if (premiumError) {
        return {
          success: false,
          message: "Ошибка при установке подписки",
        };
      }
    } else if (plan.type === "one_time") {
      // Для разового платежа добавляем запросы к существующему лимиту
      const { error: limitError } = await supabase.rpc("add_generation_limit", {
        user_id_param: user.id,
        amount_param: plan.value,
      });

      if (limitError) {
        return {
          success: false,
          message: "Ошибка при добавлении лимита",
        };
      }
    }

    return {
      success: true,
      message: "Платеж успешно обработан",
      planName: plan.name,
    };
  } catch (error) {
    console.error("Ошибка при обработке платежа:", error);
    return { success: false, message: "Внутренняя ошибка сервера" };
  }
}
