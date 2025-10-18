
#!/bin/bash

# Загружаем переменные окружения из .env файла
if [ -f supabase/functions/image-generator/.env ]; then
    export $(cat supabase/functions/image-generator/.env | grep -v '^#' | xargs)
fi

# Проверяем наличие необходимых переменных
[ -z "$TELEGRAM_BOT_TOKEN" ] && echo "Ошибка: TELEGRAM_BOT_TOKEN не найден" && exit 1
[ -z "$SUPABASE_URL" ] && echo "Ошибка: SUPABASE_URL не найден" && exit 1
[ -z "$SUPABASE_SECRET" ] && echo "Ошибка: SUPABASE_SECRET не найден" && exit 1

# Устанавливаем webhook для Telegram бота
if curl -s "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/setWebhook?url=${SUPABASE_URL}/functions/v1/image-generator?secret=${SUPABASE_SECRET}"; then
    echo "Webhook успешно установлен"
else
    echo "Ошибка при установке webhook"
    exit 1
fi
