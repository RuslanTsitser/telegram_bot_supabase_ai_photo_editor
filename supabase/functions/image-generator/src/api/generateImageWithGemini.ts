/**
 * Утилиты для работы с внешними API
 */

interface UploadResponse {
  success: boolean;
  imageData?: string; // base64 encoded image
  mimeType?: string;
  originalUrl?: string;
  error?: string;
}

/**
 * Загружает изображение по URL в Google AI через внешний API
 */
export async function generateImageWithGemini(
  imageUrl: string,
  caption: string,
  otherImages?: string[],
): Promise<{ imageData: string; mimeType: string } | null> {
  try {
    const apiUrl = Deno.env.get("IMAGE_UPLOADER_API_URL");
    if (!apiUrl) {
      console.error("IMAGE_UPLOADER_API_URL environment variable is not set");
      return null;
    }

    console.log("Uploading image to Google AI:", imageUrl, caption);
    console.log("Other images count:", otherImages?.length || 0);
    console.log("Other images:", otherImages);
    const url = `${apiUrl}/upload`;
    console.log("API URL:", url);

    const requestBody = {
      imageUrl: imageUrl,
      caption: caption,
      otherImages: otherImages,
    };
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    console.log("Response:", response);

    const data: UploadResponse = await response.json();

    if (!data.success || !data.imageData) {
      console.error("API returned error:", data.error);
      return null;
    }

    console.log(
      "Image uploaded successfully:",
      "MIME type:",
      data.mimeType,
    );
    return {
      imageData: data.imageData,
      mimeType: data.mimeType || "image/png", // fallback
    };
  } catch (error) {
    console.error("Error calling upload API:", error);
    return null;
  }
}
