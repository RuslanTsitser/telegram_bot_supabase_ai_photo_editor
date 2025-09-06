/**
 * Генерирует уникальное имя файла
 */
export function generateFileName(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `ai_generated_${timestamp}_${random}.png`;
}
