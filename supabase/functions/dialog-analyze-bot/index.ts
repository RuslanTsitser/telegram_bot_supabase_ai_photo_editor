console.log(`Function "dialog-analyze-bot" up and running!`);

import { Bot, webhookCallback } from "https://deno.land/x/grammy@v1.8.3/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const bot = new Bot(Deno.env.get("DIALOG_ANALYZE_BOT_TOKEN") || "");

// Initialize Supabase client
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
);

// Функция для формирования содержимого сообщения
function buildMessageContent(
  message: {
    text?: string;
    caption?: string;
    photo?: unknown[];
    video?: unknown;
    document?: unknown;
    audio?: unknown;
    voice?: unknown;
    sticker?: unknown;
    date?: number;
    edit_date?: number;
  },
  chat: { id: number; type: string; title?: string; username?: string },
  from?: {
    id: number;
    is_bot?: boolean;
    first_name?: string;
    last_name?: string;
    username?: string;
    language_code?: string;
  },
  isEdited = false,
): Record<string, unknown> {
  const messageContent: Record<string, unknown> = {};

  // Текст сообщения
  if (message.text) {
    messageContent.text = message.text;
  }

  // Подпись к медиа
  if (message.caption) {
    messageContent.caption = message.caption;
  }

  // Тип медиа
  if (
    message.photo && Array.isArray(message.photo) && message.photo.length > 0
  ) {
    messageContent.media_type = "photo";
    const lastPhoto = message.photo[message.photo.length - 1] as {
      file_id?: string;
      file_unique_id?: string;
    };
    messageContent.photo = {
      file_id: lastPhoto?.file_id,
      file_unique_id: lastPhoto?.file_unique_id,
    };
  } else if (message.video) {
    messageContent.media_type = "video";
    const video = message.video as {
      file_id: string;
      file_unique_id: string;
      duration?: number;
      width?: number;
      height?: number;
    };
    messageContent.video = {
      file_id: video.file_id,
      file_unique_id: video.file_unique_id,
      duration: video.duration,
      width: video.width,
      height: video.height,
    };
  } else if (message.document) {
    messageContent.media_type = "document";
    const doc = message.document as {
      file_id: string;
      file_unique_id: string;
      file_name?: string;
      mime_type?: string;
      file_size?: number;
    };
    messageContent.document = {
      file_id: doc.file_id,
      file_unique_id: doc.file_unique_id,
      file_name: doc.file_name,
      mime_type: doc.mime_type,
      file_size: doc.file_size,
    };
  } else if (message.audio) {
    messageContent.media_type = "audio";
    const audio = message.audio as {
      file_id: string;
      file_unique_id: string;
      duration?: number;
      performer?: string;
      title?: string;
    };
    messageContent.audio = {
      file_id: audio.file_id,
      file_unique_id: audio.file_unique_id,
      duration: audio.duration,
      performer: audio.performer,
      title: audio.title,
    };
  } else if (message.voice) {
    messageContent.media_type = "voice";
    const voice = message.voice as {
      file_id: string;
      file_unique_id: string;
      duration?: number;
    };
    messageContent.voice = {
      file_id: voice.file_id,
      file_unique_id: voice.file_unique_id,
      duration: voice.duration,
    };
  } else if (message.sticker) {
    messageContent.media_type = "sticker";
    const sticker = message.sticker as {
      file_id: string;
      file_unique_id: string;
      emoji?: string;
      set_name?: string;
    };
    messageContent.sticker = {
      file_id: sticker.file_id,
      file_unique_id: sticker.file_unique_id,
      emoji: sticker.emoji,
      set_name: sticker.set_name,
    };
  }

  // Информация об отправителе
  if (from) {
    messageContent.from = {
      id: from.id,
      is_bot: from.is_bot,
      first_name: from.first_name,
      last_name: from.last_name,
      username: from.username,
      language_code: from.language_code,
    };
  }

  // Информация о чате
  messageContent.chat = {
    id: chat.id,
    type: chat.type,
    title: chat.type !== "private" ? chat.title : undefined,
    username: chat.username,
  };

  // Дата сообщения
  if (message.date) {
    messageContent.date = new Date(message.date * 1000).toISOString();
  }

  // Флаг редактирования и дата редактирования
  if (isEdited) {
    messageContent.is_edited = true;
    if (message.edit_date) {
      messageContent.edit_date = new Date(message.edit_date * 1000)
        .toISOString();
    }
  }

  return messageContent;
}

bot.on("message", async (ctx) => {
  try {
    console.log("Received message event");
    const chatId = ctx.chat.id;
    const messageId = ctx.message.message_id;

    // Получаем актуальное имя бота
    const me = await bot.api.getMe();
    const currentBotName = `@${me.username || "dialog_analyze_bot"}`;

    // Формируем содержимое сообщения в формате JSON
    const messageContent = buildMessageContent(
      ctx.message,
      ctx.chat,
      ctx.from,
      false,
    );

    console.log(
      `Attempting to insert message: chat_id=${chatId}, message_id=${messageId}, bot_name=${currentBotName}`,
    );

    // Сохраняем сообщение в таблицу chat_messages
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        message_id: messageId,
        bot_name: currentBotName,
        message_content: messageContent,
      })
      .select()
      .single();

    if (error) {
      // Если ошибка из-за дубликата (unique constraint), это нормально
      if (error.code === "23505") {
        console.log(
          `Message already exists: chat_id=${chatId}, message_id=${messageId}`,
        );
      } else {
        console.error("Error inserting chat message:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error, null, 2),
        });
      }
    } else {
      console.log(
        `Message saved successfully: chat_id=${chatId}, message_id=${messageId}, bot_name=${currentBotName}, id=${data?.id}`,
      );
    }
  } catch (error) {
    console.error("Error processing message:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      fullError: JSON.stringify(error, null, 2),
    });
  }
});

// Обработчик отредактированных сообщений
bot.on("edited_message", async (ctx) => {
  try {
    console.log("Received edited_message event");
    const chatId = ctx.chat.id;
    const messageId = ctx.editedMessage.message_id;

    // Получаем актуальное имя бота
    const me = await bot.api.getMe();
    const currentBotName = `@${me.username || "dialog_analyze_bot"}`;

    // Формируем содержимое отредактированного сообщения
    const messageContent = buildMessageContent(
      ctx.editedMessage,
      ctx.chat,
      ctx.from,
      true,
    );

    console.log(
      `Attempting to insert edited message: chat_id=${chatId}, message_id=${messageId}, bot_name=${currentBotName}`,
    );

    // Сохраняем отредактированное сообщение в таблицу chat_messages
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        chat_id: chatId,
        message_id: messageId,
        bot_name: currentBotName,
        message_content: messageContent,
      })
      .select()
      .single();

    if (error) {
      // Если ошибка из-за дубликата (unique constraint), это нормально
      if (error.code === "23505") {
        console.log(
          `Edited message already exists: chat_id=${chatId}, message_id=${messageId}`,
        );
      } else {
        console.error("Error inserting edited chat message:", {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          fullError: JSON.stringify(error, null, 2),
        });
      }
    } else {
      console.log(
        `Edited message saved successfully: chat_id=${chatId}, message_id=${messageId}, bot_name=${currentBotName}, id=${data?.id}`,
      );
    }
  } catch (error) {
    console.error("Error processing edited message:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      fullError: JSON.stringify(error, null, 2),
    });
  }
});

// Set up the webhook with 4 minutes timeout
const handleUpdate = webhookCallback(bot, "std/http", "throw", 4 * 60 * 1000);

Deno.serve(async (req) => {
  try {
    console.log("Webhook request received");
    const url = new URL(req.url);
    const secret = url.searchParams.get("secret");
    const expectedSecret = Deno.env.get("BOT_FUNCTION_SECRET");

    if (secret !== expectedSecret) {
      console.error("Secret mismatch:", {
        received: secret ? "present" : "missing",
        expected: expectedSecret ? "present" : "missing",
      });
      return new Response("not allowed", { status: 405 });
    }

    console.log("Secret validated, processing update");
    const response = await handleUpdate(req);
    console.log("Update processed successfully");
    return response;
  } catch (err) {
    console.error("Error in webhook handler:", {
      error: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
      fullError: JSON.stringify(err, null, 2),
    });
    return new Response("Internal server error", { status: 500 });
  }
});
