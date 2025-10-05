/**
 * Утилиты для работы с Piapi API
 */

interface PiapiTaskRequest {
  model: string;
  task_type: string;
  input: {
    prompt: string;
    image_urls: string[];
    num_images: 1 | 2 | 3 | 4;
    output_format: "jpg" | "png";
  };
}

interface PiapiTaskResponse {
  code: number;
  data: {
    task_id: string;
    model: string;
    task_type: string;
    status: string;
    config: {
      service_mode: string;
      webhook_config?: {
        endpoint: string;
        secret: string;
      };
    };
    input: {
      num_images: 1 | 2 | 3 | 4;
      output_format: "jpg" | "png";
      prompt: string;
    };
    output?: {
      image_urls: string[];
    };
    error: {
      code: number;
      raw_message: string;
      message: string;
      detail?: string | null;
    };
  };
}

interface PiapiStatusResponse {
  code: number;
  data: {
    task_id: string;
    status: string;
    output: {
      image_urls: string[];
    };
  };
  message: string;
}

/**
 * Создает задачу генерации изображения через Piapi API
 */
export async function createPiapiTask(
  imageUrl: string,
  caption: string,
  otherImages?: string[],
  numImages: 1 | 2 | 3 | 4 = 1,
  outputFormat: "jpg" | "png" = "png",
): Promise<string | null> {
  try {
    const apiKey = Deno.env.get("PIAPI_KEY");
    if (!apiKey) {
      console.error("PIAPI_KEY environment variable is not set");
      return null;
    }

    const requestBody: PiapiTaskRequest = {
      model: "gemini",
      task_type: "gemini-2.5-flash-image",
      input: {
        prompt: caption,
        image_urls: [imageUrl, ...(otherImages || [])],
        num_images: numImages,
        output_format: outputFormat,
      },
    };

    console.log("Creating Piapi task with prompt:", caption);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));

    const response = await fetch("https://api.piapi.ai/api/v1/task", {
      method: "POST",
      headers: {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error("Piapi API error:", response.status, response.statusText);
      return null;
    }

    const data: PiapiTaskResponse = await response.json();
    console.log("Piapi task response:", data);
    console.log(
      "Piapi task created:",
      data.data.task_id,
      "Status:",
      data.data.status,
    );

    return data.data.task_id;
  } catch (error) {
    console.error("Error creating Piapi task:", error);
    return null;
  }
}

/**
 * Проверяет статус задачи в Piapi API
 */
export async function checkPiapiTaskStatus(
  taskId: string,
): Promise<PiapiStatusResponse | null> {
  try {
    const apiKey = Deno.env.get("PIAPI_KEY");
    if (!apiKey) {
      console.error("PIAPI_KEY environment variable is not set");
      return null;
    }

    console.log("Checking Piapi task status:", taskId);

    const response = await fetch(`https://api.piapi.ai/api/v1/task/${taskId}`, {
      method: "GET",
      headers: {
        "X-API-Key": apiKey,
      },
    });

    console.log("Piapi task status response:", response);

    if (!response.ok) {
      console.error("Piapi API error:", response.status, response.statusText);
      return null;
    }

    const data: PiapiStatusResponse = await response.json();

    if (data.code !== 200) {
      console.error("Piapi API returned error:", data.message);
      return null;
    }

    console.log("Piapi task status:", data.data.status);
    return data;
  } catch (error) {
    console.error("Error checking Piapi task status:", error);
    return null;
  }
}

/**
 * Ждет завершения задачи и возвращает результат
 */
export async function waitForPiapiTaskCompletion(
  taskId: string,
  maxWaitTime: number = 300000, // 5 минут
  checkInterval: number = 5000, // 5 секунд
): Promise<PiapiStatusResponse | null> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitTime) {
    const taskStatus = await checkPiapiTaskStatus(taskId);

    if (!taskStatus) {
      console.error("Failed to get task status");
      return null;
    }

    if (taskStatus.data.status === "completed") {
      console.log("Piapi task completed successfully");
      return taskStatus;
    }

    if (
      taskStatus.data.status === "failed" || taskStatus.data.status === "error"
    ) {
      console.error("Piapi task failed:");
      return null;
    }

    console.log(
      `Task ${taskId} is still ${taskStatus.data.status}, waiting...`,
    );
    await new Promise((resolve) => setTimeout(resolve, checkInterval));
  }

  console.error("Piapi task timeout");
  return null;
}

/**
 * Генерирует изображение через Piapi API и возвращает URL изображения
 */
export async function generateImageWithPiapi(
  imageUrl: string,
  caption: string,
  otherImages?: string[],
  numImages: 1 | 2 | 3 | 4 = 1,
  outputFormat: "jpg" | "png" = "png",
): Promise<{ imageData: string; mimeType: string } | null> {
  try {
    console.log("Starting Piapi image generation with prompt:", caption);

    // Создаем задачу
    const taskId = await createPiapiTask(
      imageUrl,
      caption,
      otherImages,
      numImages,
      outputFormat,
    );

    if (!taskId) {
      console.error("Failed to create Piapi task");
      return null;
    }

    // Ждем завершения задачи
    const result = await waitForPiapiTaskCompletion(taskId);
    if (!result || !result.data.output || !result.data.output.image_urls) {
      console.error("Piapi task did not return image URLs");
      return null;
    }

    console.log("Piapi image generation completed successfully");
    console.log("Generated image URLs:", result.data.output.image_urls);

    const url = result.data.output.image_urls[0];

    return {
      imageData: url,
      mimeType: "image/png",
    };
  } catch (error) {
    console.error("Error generating image with Piapi:", error);
    return null;
  }
}
