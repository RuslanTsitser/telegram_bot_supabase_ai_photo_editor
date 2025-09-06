import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

/**
 * Удаляет изображение из Supabase Storage
 */
export async function deleteImageFromStorage(
  supabase: SupabaseClient,
  imageUrl: string,
) {
  const { data, error } = await supabase.storage.from("ai-images").remove([
    imageUrl,
  ]);
  if (data) {
    console.log("Изображение удалено:", data);
  }
  if (error) {
    console.error("Ошибка удаления изображения:", error);
  }
}
