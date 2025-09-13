import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

export interface ImageGroup {
  id: string;
  media_group_id: string;
  user_id: string;
  status: "collecting" | "processing" | "completed" | "failed";
  total_images: number;
  processed_images: number;
  caption?: string;
  created_at: string;
  updated_at: string;
}

export interface GroupImage {
  id: string;
  group_id: string;
  telegram_file_id: string;
  image_url?: string;
  order_index: number;
  created_at: string;
}

/**
 * Создает новую группу изображений
 */
export async function createImageGroup(
  supabase: SupabaseClient,
  mediaGroupId: string,
  userId: string,
): Promise<ImageGroup | null> {
  try {
    const { data, error } = await supabase
      .from("image_groups")
      .insert({
        media_group_id: mediaGroupId,
        user_id: userId,
        status: "collecting",
        total_images: 0,
        processed_images: 0,
        caption: null,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating image group:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error creating image group:", error);
    return null;
  }
}

/**
 * Получает группу изображений по media_group_id
 */
export async function getImageGroupByMediaId(
  supabase: SupabaseClient,
  mediaGroupId: string,
): Promise<ImageGroup | null> {
  try {
    const { data, error } = await supabase
      .from("image_groups")
      .select("*")
      .eq("media_group_id", mediaGroupId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      console.error("Error getting image group:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting image group:", error);
    return null;
  }
}

/**
 * Добавляет изображение в группу
 */
export async function addImageToGroup(
  supabase: SupabaseClient,
  groupId: string,
  telegramFileId: string,
  orderIndex: number,
): Promise<GroupImage | null> {
  try {
    const { data, error } = await supabase
      .from("group_images")
      .insert({
        group_id: groupId,
        telegram_file_id: telegramFileId,
        order_index: orderIndex,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding image to group:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error adding image to group:", error);
    return null;
  }
}

/**
 * Получает все изображения группы
 */
export async function getGroupImages(
  supabase: SupabaseClient,
  groupId: string,
): Promise<GroupImage[]> {
  try {
    const { data, error } = await supabase
      .from("group_images")
      .select("*")
      .eq("group_id", groupId)
      .order("order_index");

    if (error) {
      console.error("Error getting group images:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error getting group images:", error);
    return [];
  }
}

/**
 * Обновляет статус группы
 */
export async function updateGroupStatus(
  supabase: SupabaseClient,
  groupId: string,
  status: ImageGroup["status"],
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from("image_groups")
      .update({ status })
      .eq("id", groupId);

    if (error) {
      console.error("Error updating group status:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error updating group status:", error);
    return false;
  }
}

/**
 * Обновляет caption группы (если еще не установлен)
 */
export async function updateGroupCaption(
  supabase: SupabaseClient,
  groupId: string,
  caption: string,
): Promise<boolean> {
  try {
    // Сначала проверяем, есть ли уже caption
    const { data: existingGroup, error: fetchError } = await supabase
      .from("image_groups")
      .select("caption")
      .eq("id", groupId)
      .single();

    if (fetchError) {
      console.error("Error fetching group for caption update:", fetchError);
      return false;
    }

    // Обновляем только если caption пустой или null
    if (
      !existingGroup.caption ||
      existingGroup.caption === "Верни такое же изображение в мультяшном стилеs"
    ) {
      const { error } = await supabase
        .from("image_groups")
        .update({ caption })
        .eq("id", groupId);

      if (error) {
        console.error("Error updating group caption:", error);
        return false;
      }

      console.log(`Updated caption for group ${groupId}: "${caption}"`);
      return true;
    } else {
      console.log(
        `Caption already exists for group ${groupId}: "${existingGroup.caption}"`,
      );
      return true;
    }
  } catch (error) {
    console.error("Error updating group caption:", error);
    return false;
  }
}
