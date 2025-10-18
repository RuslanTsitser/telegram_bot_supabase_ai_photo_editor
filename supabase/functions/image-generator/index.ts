console.log(`Function "image-generator" up and running!`);

import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processImageGroup } from "./processImageGroup.ts";
import {
  generateImageFromText,
  generateImageWithPiapi,
} from "./src/api/generateImageWithPiapi.ts";
import { onboarding } from "./src/bot/onboarding.ts";
import {
  addImageToGroup,
  createImageGroup,
  getImageGroupByMediaId,
  updateGroupCaption,
} from "./src/database/imageGroups.ts";
import { processSuccessfulPayment } from "./src/database/payments.ts";
import {
  getSubscriptionPlan,
  getSubscriptionPlans,
} from "./src/database/plans.ts";
import {
  canUserGenerate,
  decrementGenerationLimit,
  getPremiumStatus,
} from "./src/database/premium.ts";
import {
  getUserByTelegramId,
  getUserLanguage,
  upsertUser,
} from "./src/database/users.ts";
import { getImageUrlFromTelegram } from "./src/telegram/getImageUrlFromTelegram.ts";
import { createSubscriptionInvoice } from "./src/telegram/subscriptionHandlers.ts";
import { createI18n } from "./src/utils/i18n.ts";

const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "", // TODO: add supabase url
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", // TODO: add supabase service role key
);

bot.on("message", async (ctx) => {
  const chatType = ctx.message.chat.type;
  console.log(`${chatType} message`, ctx.message.chat.id);

  // Обрабатываем пользователя при каждом сообщении
  await upsertUser(ctx, supabase);

  const userLanguage = await getUserLanguage(supabase, ctx.from?.id || 0);
  const i18n = createI18n(userLanguage);

  // Handle successful payment
  if (ctx.message.successful_payment) {
    try {
      const payment = ctx.message.successful_payment;

      // Обрабатываем успешный платеж
      const result = await processSuccessfulPayment(supabase, payment);

      if (result.success) {
        await ctx.reply(
          i18n.t("payment_success", { planName: result.planName || "" }),
        );
      } else {
        await ctx.reply(
          i18n.t("payment_error", { message: result.message || "" }),
        );
      }
    } catch (error) {
      console.error("Ошибка при обработке успешного платежа:", error);
      await ctx.reply(i18n.t("payment_received_error") || "");
    }
  }

  // Handle text messages
  if (ctx.message.text) {
    const message = ctx.message.text;

    if (message === "/start") {
      await onboarding(ctx, supabase);
      return;
    }

    if (message === "/subscriptions" || message === "/subscriptions_test") {
      const plans = await getSubscriptionPlans(supabase);
      const isTest = message === "/subscriptions_test";
      const subscriptionMessage = isTest
        ? i18n.t("subscriptions_test_title")
        : i18n.t("subscriptions_title");

      // Создаем inline кнопки для каждого тарифа
      const keyboard = {
        inline_keyboard: plans?.map((plan) => [{
          text: `💳 ${plan.name} за ${plan.price / 100}₽`,
          callback_data: isTest ? `plan_test_${plan.id}` : `plan_${plan.id}`,
        }]) || [],
      };

      await ctx.reply(subscriptionMessage, { reply_markup: keyboard });
      return;
    }

    if (message === "/limits") {
      const userId = ctx.from?.id;
      const user = await getUserByTelegramId(supabase, userId);
      if (!user) {
        await ctx.reply(i18n.t("user_not_found"));
        return;
      }
      const premiumStatus = await getPremiumStatus(supabase, user.id);
      if (!premiumStatus) {
        await ctx.reply(i18n.t("limits_not_found"));
        return;
      }
      let message = `${i18n.t("limits_title")}\n`;
      if (premiumStatus.is_premium) {
        message += `- ${i18n.t("premium_active")}. Докупать ничего не нужно`;
      }
      if (premiumStatus.premium_expires_at) {
        const expiresAt = new Date(premiumStatus.premium_expires_at);
        const now = new Date();
        if (expiresAt > now) {
          message += `- ${
            i18n.t("subscription_expires", {
              date: expiresAt.toLocaleDateString(),
            })
          }`;
        }
      }

      message += `- ${
        i18n.t("free_generations")
      } ${premiumStatus.generation_limit}`;

      await ctx.reply(message);
      return;
    }

    if (!message.startsWith("/")) {
      // Обработка текстовых сообщений для генерации изображений по тексту
      const userId = ctx.from?.id;
      const user = await getUserByTelegramId(supabase, userId);
      if (!user) {
        await ctx.reply(i18n.t("user_not_found"));
        return;
      }

      const limits = await canUserGenerate(supabase, user.id);
      if (!limits) {
        await ctx.reply(i18n.t("generation_info_not_found"));
        return;
      }

      if (!limits.canGenerate) {
        await ctx.reply(limits.reason || i18n.t("no_access"));
        return;
      }

      // Проверяем, что сообщение не пустое
      if (!message.trim()) {
        await ctx.reply(i18n.t("text_generation_empty_prompt"));
        return;
      }

      await ctx.reply(i18n.t("text_generation_processing"));

      try {
        // Генерируем изображение по тексту
        const result = await generateImageFromText(message.trim());

        if (!result) {
          await ctx.reply(i18n.t("text_generation_error"));
          return;
        }

        const url = result.imageData;

        if (!url) {
          await ctx.reply(i18n.t("generation_save_error"));
          return;
        }

        // Отправляем изображение по URL
        await ctx.replyWithPhoto(url);
        await ctx.replyWithDocument(url, {
          caption: i18n.t("text_generation_success"),
        });

        // Уменьшаем лимит генераций
        if (limits.limit !== -1) {
          await decrementGenerationLimit(supabase, user.id);
        }
      } catch (error) {
        console.error("Error generating image from text:", error);
        await ctx.reply(
          i18n.t("text_generation_error"),
        );
      }
      return;
    }
  }

  // Handle photo messages
  if (ctx.message.photo) {
    if (ctx.message.caption === "file_id" && chatType === "private") {
      const fileId = ctx.message.photo[0].file_id;
      await ctx.reply(fileId);
      return;
    }

    const mediaGroup = ctx.message.media_group_id;
    const userId = ctx.from?.id;
    const user = await getUserByTelegramId(supabase, userId);
    if (!user) {
      await ctx.reply(i18n.t("user_not_found"));
      return;
    }
    const limits = await canUserGenerate(supabase, user.id);
    if (!limits) {
      await ctx.reply(i18n.t("generation_info_not_found"));
      return;
    }

    if (!limits.canGenerate) {
      await ctx.reply(limits.reason || i18n.t("no_access"));
      return;
    }

    // Если это группа изображений
    if (mediaGroup) {
      // Проверяем, существует ли уже группа
      let group = await getImageGroupByMediaId(supabase, mediaGroup);

      if (!group) {
        // Создаем новую группу
        group = await createImageGroup(supabase, mediaGroup, user.id);
        if (!group) {
          await ctx.reply(i18n.t("generation_upload_error"));
          return;
        }
      }

      // Добавляем изображение в группу
      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const orderIndex = group.total_images; // Используем текущее количество как индекс

      console.log(
        `Adding image to group ${group.id}, order: ${orderIndex}, file_id: ${photo.file_id}`,
      );
      await addImageToGroup(supabase, group.id, photo.file_id, orderIndex);

      // Обновляем caption если есть
      if (ctx.message.caption) {
        console.log(
          `Updating caption for group ${group.id}: ${ctx.message.caption}`,
        );
        await updateGroupCaption(supabase, group.id, ctx.message.caption);
      }

      // Обновляем счетчик изображений
      const newCount = group.total_images + 1;
      console.log(
        `Updating group ${group.id} image count from ${group.total_images} to ${newCount}`,
      );
      await supabase
        .from("image_groups")
        .update({ total_images: newCount })
        .eq("id", group.id);

      // Ждем 2 секунды и обрабатываем группу
      setTimeout(async () => {
        try {
          // Проверяем, что группа все еще в статусе "collecting" (защита от race condition)
          const currentGroup = await getImageGroupByMediaId(
            supabase,
            mediaGroup,
          );
          if (currentGroup && currentGroup.status === "collecting") {
            console.log(
              `Processing group ${currentGroup.id} with ${currentGroup.total_images} images`,
            );
            await processImageGroup(
              supabase,
              bot,
              currentGroup.id,
              currentGroup.user_id,
              user.telegram_id,
            );
          }
        } catch (error) {
          console.error("Error processing group after timeout:", error);
        }
      }, 2000);

      // НЕ отвечаем пользователю - ждем завершения группы
      return;
    }

    // Обработка одиночного изображения (существующая логика)
    const photo = ctx.message.photo[ctx.message.photo.length - 1];
    const photoUrl = await getImageUrlFromTelegram(photo.file_id, bot.token);

    if (photoUrl) {
      const caption = ctx.message.caption;
      await ctx.reply(i18n.t("generation_processing"));
      // Загружаем изображение через внешний API
      const uploadResult = await generateImageWithPiapi(
        photoUrl,
        caption || "Верни такое же изображение в мультяшном стиле",
      );
      if (!uploadResult) {
        await ctx.reply(i18n.t("generation_error"));
        return;
      }

      try {
        const url = uploadResult.imageData;

        if (!url) {
          await ctx.reply(i18n.t("generation_save_error"));
          return;
        }

        // Отправляем изображение по URL
        await ctx.replyWithPhoto(url);
        await ctx.replyWithDocument(url, {
          caption: i18n.t("generation_success"),
        });
        if (limits.limit !== -1) {
          await decrementGenerationLimit(supabase, user.id);
        }
      } catch (error) {
        await ctx.reply(
          i18n.t("generation_process_error", { error: String(error) }),
        );
      }
    } else {
      await ctx.reply(i18n.t("generation_photo_error"));
    }
  }
});

// Обработчик для inline кнопок подписок
bot.on("callback_query", async (ctx) => {
  let planId: string;
  let isTest: boolean;

  if (
    ctx.callbackQuery.data?.startsWith("plan_") ||
    ctx.callbackQuery.data?.startsWith("plan_test_")
  ) {
    if (ctx.callbackQuery.data?.startsWith("plan_test_")) {
      isTest = true;
      planId = ctx.callbackQuery.data.replace("plan_test_", "");
    } else {
      isTest = false;
      planId = ctx.callbackQuery.data.replace("plan_", "");
    }

    const plan = await getSubscriptionPlan(supabase, planId);
    if (!plan) {
      await ctx.answerCallbackQuery("❌ Ошибка при получении тарифа");
      return;
    }

    await createSubscriptionInvoice(ctx, plan, isTest);
  }
});

// Webhook для проверки перед оплатой
bot.on("pre_checkout_query", async (ctx) => {
  console.log("pre_checkout_query received");

  try {
    // Получаем данные из payload
    const payload = ctx.preCheckoutQuery.invoice_payload;
    const [planId, userId] = payload.split("_");

    const user = await getUserByTelegramId(supabase, parseInt(userId));
    if (!user) {
      await ctx.answerPreCheckoutQuery(false, "Пользователь не найден");
      return;
    }

    const plan = await getSubscriptionPlan(supabase, planId);
    if (!plan) {
      await ctx.answerPreCheckoutQuery(false, "Тариф не найден или неактивен");
      return;
    }

    // Подтверждаем возможность оплаты
    await ctx.answerPreCheckoutQuery(true);
    console.log("Pre-checkout approved for plan:", planId);
  } catch (error) {
    console.error("Error in pre_checkout_query:", error);
    await ctx.answerPreCheckoutQuery(false, "Ошибка при проверке платежа");
  }
});

bot.on("edited_message", async (_) => {
  // TODO: add edited message handler
});

/// set up the webhook and timout for the bot 4 minutes
const handleUpdate = webhookCallback(bot, "std/http", "throw", 4 * 60 * 1000);

Deno.serve(async (req) => {
  try {
    const url = new URL(req.url);
    if (
      url.searchParams.get("secret") !==
        Deno.env.get("BOT_FUNCTION_SECRET")
    ) {
      return new Response("not allowed", { status: 405 });
    }

    return await handleUpdate(req);
  } catch (err) {
    console.error(err);
  }
});
