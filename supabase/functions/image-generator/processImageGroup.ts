import { Bot } from "https://deno.land/x/grammy@v1.8.3/bot.ts";
import SupabaseClient from "https://esm.sh/@supabase/supabase-js@2.49.4/dist/module/SupabaseClient.js";
import { generateImageWithGemini } from "./src/api/generateImageWithGemini.ts";
import {
  getGroupImages,
  updateGroupStatus,
} from "./src/database/imageGroups.ts";
import {
  canUserGenerate,
  decrementGenerationLimit,
} from "./src/database/premium.ts";
import { deleteImageFromStorage } from "./src/storage/deleteImageFromStorage.ts";
import { saveImageToStorage } from "./src/storage/saveImageToStorage.ts";
import { getImageUrlFromTelegram } from "./src/telegram/getImageUrlFromTelegram.ts";
import { generateFileName } from "./src/utils/storage.ts";

/**
 * Обрабатывает завершенную группу изображений
 */
export async function processImageGroup(
  supabase: SupabaseClient,
  bot: Bot,
  groupId: string,
  userId: string,
  telegramUserId: number,
) {
  try {
    await bot.api.sendMessage(
      telegramUserId,
      "Понял, обрабатываю несколько фотографий...",
    );
    // Получаем все изображения группы
    const groupImages = await getGroupImages(supabase, groupId);
    if (groupImages.length === 0) {
      console.log("No images found in group:", groupId);
      await bot.api.sendMessage(userId, "Не найдено изображений в группе");
      return;
    }

    // Обновляем статус на "processing"
    await updateGroupStatus(supabase, groupId, "processing");

    // Получаем URL изображений из Telegram
    const imageUrls: string[] = [];
    for (const groupImage of groupImages) {
      const imageUrl = await getImageUrlFromTelegram(
        groupImage.telegram_file_id,
        bot.token,
      );
      if (imageUrl) {
        imageUrls.push(imageUrl);
      }
    }

    console.log(
      `Found ${imageUrls.length} image URLs for group ${groupId}:`,
      imageUrls,
    );

    if (imageUrls.length === 0) {
      console.log("No valid image URLs found for group:", groupId);
      await updateGroupStatus(supabase, groupId, "failed");
      await bot.api.sendMessage(
        userId,
        "Не найдено валидных URL изображений для группы",
      );
      return;
    }

    // Получаем группу для caption по ID группы
    const { data: group, error: groupError } = await supabase
      .from("image_groups")
      .select("*")
      .eq("id", groupId)
      .single();

    if (groupError) {
      console.error("Error getting group for caption:", groupError);
      await bot.api.sendMessage(
        userId,
        "Ошибка при получении группы для caption",
      );
      return;
    }

    console.log(`Retrieved group for caption:`, group);
    const caption = group?.caption ||
      "Верни такое же изображение в мультяшном стилеs";
    console.log(`Using caption: "${caption}"`);

    console.log(
      `Calling generateImageWithGemini with ${imageUrls.length} images, otherImages: ${
        imageUrls.slice(1).length
      }`,
    );

    // Генерируем изображение с помощью Gemini
    const uploadResult = await generateImageWithGemini(
      imageUrls[0], // Основное изображение
      caption,
      imageUrls.slice(1),
    );

    if (!uploadResult) {
      console.log("Failed to generate image for group:", groupId);
      await updateGroupStatus(supabase, groupId, "failed");
      await bot.api.sendMessage(
        userId,
        "Ошибка при генерации изображения для группы",
      );
      return;
    }

    // Сохраняем результат в Supabase Storage
    const fileName = generateFileName();
    const result = await saveImageToStorage(
      supabase,
      uploadResult.imageData,
      fileName,
    );

    if (!result?.publicUrl) {
      console.log("Failed to save generated image for group:", groupId);
      await updateGroupStatus(supabase, groupId, "failed");
      await bot.api.sendMessage(
        userId,
        "Ошибка при сохранении сгенерированного изображения для группы",
      );
      return;
    }

    // Получаем пользователя по UUID
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      console.error(`User not found for userId: ${userId}`, userError);
      await bot.api.sendMessage(userId, "Пользователь не найден для userId");
      return;
    }

    console.log(
      `Sending result to user ${user.telegram_id} (${user.telegram_first_name})`,
    );
    await bot.api.sendDocument(user.telegram_id, result.publicUrl, {
      caption: "Ваше фото готово!",
    });

    // Уменьшаем лимит генераций
    const limits = await canUserGenerate(supabase, user.id);
    if (limits?.canGenerate && limits.limit !== -1) {
      await decrementGenerationLimit(supabase, user.id);
    }

    // Обновляем статус на "completed"
    await updateGroupStatus(supabase, groupId, "completed");

    // Удаляем временный файл
    if (result.path) {
      await deleteImageFromStorage(supabase, result.path);
    }
  } catch (error) {
    console.error("Error processing image group:", error);
    await updateGroupStatus(supabase, groupId, "failed");
  }
}
