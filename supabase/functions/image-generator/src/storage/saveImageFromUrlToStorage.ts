import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { generateFileName } from "../utils/storage.ts";

/**
 * Сохраняет изображение по URL в Supabase Storage
 */

export async function saveImageFromUrlToStorage(
  supabase: SupabaseClient,
  imageUrl: string,
  fileName?: string,
): Promise<
  {
    publicUrl: string;
    path: string;
  } | null
> {
  try {
    // Загружаем изображение по URL
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Ошибка загрузки изображения: ${response.status}`);
    }

    // Получаем данные изображения
    const imageBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(imageBuffer);

    // Генерируем имя файла если не передано
    const finalFileName = fileName || generateFileName();

    // Загружаем в Storage
    const { data, error } = await supabase.storage
      .from("ai-images")
      .upload(finalFileName, bytes, {
        contentType: response.headers.get("content-type") || "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Ошибка загрузки в Storage:", error);
      return null;
    }

    // Получаем публичный URL
    const { data: urlData } = supabase.storage
      .from("ai-images")
      .getPublicUrl(data.path);

    return {
      publicUrl: urlData.publicUrl,
      path: data.path,
    };
  } catch (error) {
    console.error("Ошибка при сохранении изображения по URL:", error);
    return null;
  }
}
