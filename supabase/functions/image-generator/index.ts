console.log(`Function "image-generator" up and running!`);

import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { processImageGroup } from "./processImageGroup.ts";
import { generateImageWithGemini } from "./src/api/generateImageWithGemini.ts";
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
import { getUserByTelegramId, upsertUser } from "./src/database/users.ts";
import { deleteImageFromStorage } from "./src/storage/deleteImageFromStorage.ts";
import { saveImageToStorage } from "./src/storage/saveImageToStorage.ts";
import { getImageUrlFromTelegram } from "./src/telegram/getImageUrlFromTelegram.ts";
import { createSubscriptionInvoice } from "./src/telegram/subscriptionHandlers.ts";
import { generateFileName } from "./src/utils/storage.ts";

const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

bot.on("message", async (ctx) => {
  const chatType = ctx.message.chat.type;
  console.log(`${chatType} message`, ctx.message.chat.id);

  // Обрабатываем пользователя при каждом сообщении
  await upsertUser(ctx, supabase);

  // Handle successful payment
  if (ctx.message.successful_payment) {
    try {
      const payment = ctx.message.successful_payment;

      // Обрабатываем успешный платеж
      const result = await processSuccessfulPayment(supabase, payment);

      if (result.success) {
        await ctx.reply(
          `✅ Платеж успешно обработан! Купленный тариф: ${result.planName}`,
        );
      } else {
        await ctx.reply(`❌ Ошибка при обработке платежа: ${result.message}`);
      }
    } catch (error) {
      console.error("Ошибка при обработке успешного платежа:", error);
      await ctx.reply(
        "✅ Платеж получен, но произошла ошибка при обновлении статуса.",
      );
    }
  }

  // Handle text messages
  if (ctx.message.text) {
    const message = ctx.message.text;

    if (message === "/start") {
      await ctx.reply(
        "Привет! Я бот для генерации фотографий. Отправь мне фотографию, добавь описание и я сгенерирую для тебя новое фото",
      );
      return;
    }

    if (message === "/subscriptions") {
      const plans = await getSubscriptionPlans(supabase);
      let subscriptionMessage = "💳 Доступные тарифы:\n\n";

      plans?.forEach((plan) => {
        const emoji = plan.price === 0 ? "🆓" : "💳";
        if (plan.type === "subscription") {
          subscriptionMessage += `${emoji} ${plan.name} - ${
            plan.price / 100
          }₽\n`;
        } else if (plan.type === "one_time") {
          subscriptionMessage += `${emoji} ${plan.name} - ${
            plan.price / 100
          }₽\n`;
        }
        if (plan.description) {
          subscriptionMessage += `   ${plan.description}\n`;
        }
        subscriptionMessage += "\n";
      });

      // Создаем inline кнопки для каждого тарифа
      const keyboard = {
        inline_keyboard: plans?.map((plan) => [{
          text: `💳 Купить ${plan.name}`,
          callback_data: `plan_${plan.id}`,
        }]) || [],
      };

      await ctx.reply(subscriptionMessage, { reply_markup: keyboard });
      return;
    }

    if (message === "/limits") {
      const userId = ctx.from?.id;
      const user = await getUserByTelegramId(supabase, userId);
      if (!user) {
        await ctx.reply("Пользователь не найден");
        return;
      }
      const premiumStatus = await getPremiumStatus(supabase, user.id);
      if (!premiumStatus) {
        await ctx.reply("Информация о лимитах не найдена");
        return;
      }
      let message = `Текущий статус:\n`;
      if (premiumStatus.is_premium) {
        message += `- Премиум навсегда. Докупать ничего не нужно`;
      }
      if (premiumStatus.premium_expires_at) {
        const expiresAt = new Date(premiumStatus.premium_expires_at);
        const now = new Date();
        if (expiresAt > now) {
          message += `- Подписка до ${expiresAt.toLocaleDateString()}`;
        }
      }

      message +=
        `- Количество доступных генераций: ${premiumStatus.generation_limit}`;

      await ctx.reply(message);
      return;
    }

    if (!message.startsWith("/")) {
      // TODO: add text message handler. Generate image with Gemini without picture.
      await ctx.reply(
        "Пришлите картинку и описание, чтобы я сгенерировал для тебя новое фото",
      );
      return;
    }
  }

  // Handle photo messages
  if (ctx.message.photo) {
    const mediaGroup = ctx.message.media_group_id;
    const userId = ctx.from?.id;
    const user = await getUserByTelegramId(supabase, userId);
    if (!user) {
      await ctx.reply("Пользователь не найден");
      return;
    }
    const limits = await canUserGenerate(supabase, user.id);
    if (!limits) {
      await ctx.reply("Информация о возможности генерации не найдена");
      return;
    }

    if (!limits.canGenerate) {
      await ctx.reply(limits.reason || "У тебя нет доступа к генерации");
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
          await ctx.reply("Ошибка при создании группы изображений");
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
      await ctx.reply("Понял, генерирую фото...");
      // Загружаем изображение через внешний API
      const uploadResult = await generateImageWithGemini(
        photoUrl,
        caption || "Generate a description of the photo",
      );
      if (!uploadResult) {
        await ctx.reply("Ошибка при загрузке изображения в Google AI");
        return;
      }

      try {
        // Сохраняем в Supabase Storage
        const fileName = generateFileName();
        const result = await saveImageToStorage(
          supabase,
          uploadResult.imageData,
          fileName,
        );
        const imageUrl = result?.publicUrl;
        const path = result?.path;

        if (!imageUrl) {
          await ctx.reply("Ошибка при сохранении изображения");
          return;
        }

        // Отправляем изображение по URL
        await ctx.replyWithDocument(imageUrl, {
          caption: "Ваше фото готово!",
        });
        if (limits.limit !== -1) {
          await decrementGenerationLimit(supabase, user.id);
        }
        if (path) {
          // delete image from storage
          await deleteImageFromStorage(supabase, path);
        }
      } catch (error) {
        await ctx.reply("Не удалось обработать изображение " + error);
      }
    } else {
      await ctx.reply("Ошибка при получении фото");
    }
  }
});

// Обработчик для inline кнопок подписок
bot.on("callback_query", async (ctx) => {
  if (ctx.callbackQuery.data?.startsWith("plan_")) {
    const planId = ctx.callbackQuery.data.replace("plan_", "");

    const plan = await getSubscriptionPlan(supabase, planId);
    if (!plan) {
      await ctx.answerCallbackQuery("❌ Ошибка при получении тарифа");
      return;
    }

    await createSubscriptionInvoice(ctx, plan);
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
