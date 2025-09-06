import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * Сохраняет base64 изображение в Supabase Storage
 */
export async function saveImageToStorage(
  supabase: SupabaseClient,
  base64Data: string,
  fileName: string,
): Promise<
  {
    publicUrl: string;
    path: string;
  } | null
> {
  try {
    // Конвертируем base64 в Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Загружаем напрямую Uint8Array в Storage
    const { data, error } = await supabase.storage
      .from("ai-images")
      .upload(fileName, bytes, {
        contentType: "image/png",
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
    console.error("Ошибка при сохранении изображения:", error);
    return null;
  }
}
