console.log(`Function "image-generator" up and running!`);

import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateImageWithGemini } from "./src/api/generateImageWithGemini.ts";
import { processSuccessfulPayment } from "./src/database/payments.ts";
import {
  getSubscriptionPlan,
  getSubscriptionPlans,
} from "./src/database/plans.ts";
import { upsertUser } from "./src/database/users.ts";
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
      // TODO: add limits handler
    }

    if (!message.startsWith("/")) {
      // TODO: add text message handler
      await ctx.reply("Hello, world!");
      return;
    }
  }

  // Handle photo messages
  if (ctx.message.photo) {
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
bot.on("pre_checkout_query", async (_) => {
  // TODO: add pre checkout query handler
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
