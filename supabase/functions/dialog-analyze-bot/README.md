# Dialog Analyze Bot Edge Function

Edge функция для вебхука Telegram бота, который сохраняет сообщения и их редактирования в таблице `chat_messages`.

## Описание

Эта функция является вебхуком для Telegram бота с токеном `DIALOG_ANALYZE_BOT_TOKEN`. Она автоматически сохраняет все входящие сообщения и их редактирования в таблицу `chat_messages` базы данных Supabase с полным содержимым сообщений в формате JSON.

## Возможности

- ✅ Сохранение обычных сообщений
- ✅ Сохранение отредактированных сообщений
- ✅ Сохранение полного содержимого сообщений (текст, медиа, метаданные)
- ✅ Сохранение информации об отправителе и чате
- ✅ Обработка различных типов медиа (фото, видео, документы, аудио, голосовые сообщения, стикеры)

## Настройка вебхука

### Автоматическая настройка (рекомендуется)

Используйте готовый скрипт для настройки вебхука:

```bash
bash scripts/set_dialog_analyze_bot_webhook.sh
```

Скрипт автоматически:

1. Загрузит переменные окружения из `.env` файла
2. Проверит наличие необходимых переменных
3. Установит вебхук для бота
4. Покажет информацию о текущем вебхуке

### Ручная настройка

1. Убедитесь, что у вас есть следующие переменные окружения:
   - `DIALOG_ANALYZE_BOT_TOKEN` - токен Telegram бота
   - `SUPABASE_URL` - URL вашего Supabase проекта
   - `BOT_FUNCTION_SECRET` - секретный ключ для защиты вебхука

2. Установите вебхук через Telegram API:

```bash
curl "https://api.telegram.org/bot<DIALOG_ANALYZE_BOT_TOKEN>/setWebhook?url=https://<PROJECT_URL>.supabase.co/functions/v1/dialog-analyze-bot?secret=<BOT_FUNCTION_SECRET>&allowed_updates=["message","edited_message"]"
```

Замените:

- `<DIALOG_ANALYZE_BOT_TOKEN>` на токен вашего бота
- `<SUPABASE_URL>` на URL вашего Supabase проекта (например: `https://xxxxx.supabase.co`)
- `<BOT_FUNCTION_SECRET>` на секретный ключ

### Проверка вебхука

Проверить текущий статус вебхука:

```bash
curl "https://api.telegram.org/bot<DIALOG_ANALYZE_BOT_TOKEN>/getWebhookInfo"
```

### Удаление вебхука

Если нужно удалить вебхук:

```bash
curl "https://api.telegram.org/bot<DIALOG_ANALYZE_BOT_TOKEN>/deleteWebhook"
```

## Переменные окружения

Функция требует следующие переменные окружения:

| Переменная | Описание | Обязательная |
|------------|----------|--------------|
| `DIALOG_ANALYZE_BOT_TOKEN` | Токен Telegram бота | ✅ |
| `SUPABASE_URL` | URL Supabase проекта | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key для Supabase | ✅ |
| `BOT_FUNCTION_SECRET` | Секретный ключ для защиты вебхука | ✅ |

## Структура сохраняемых данных

Данные сохраняются в таблицу `chat_messages` со следующей структурой:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Уникальный идентификатор записи |
| `chat_id` | BIGINT | ID чата в Telegram |
| `message_id` | BIGINT | ID сообщения в Telegram |
| `bot_name` | TEXT | Название бота (например: @dialog_analyze_bot) |
| `message_content` | JSONB | Полное содержимое сообщения в формате JSON |
| `created_at` | TIMESTAMPTZ | Дата создания записи |

### Структура `message_content`

Поле `message_content` содержит JSON объект со следующей структурой:

```json
{
  "text": "Текст сообщения",
  "caption": "Подпись к медиа",
  "media_type": "photo|video|document|audio|voice|sticker",
  "photo": {
    "file_id": "...",
    "file_unique_id": "..."
  },
  "from": {
    "id": 123456789,
    "is_bot": false,
    "first_name": "Имя",
    "last_name": "Фамилия",
    "username": "username",
    "language_code": "ru"
  },
  "chat": {
    "id": -1001234567890,
    "type": "group|private|supergroup|channel",
    "title": "Название чата",
    "username": "chat_username"
  },
  "date": "2025-01-15T10:30:00.000Z",
  "is_edited": true,
  "edit_date": "2025-01-15T10:35:00.000Z"
}
```

## Примеры использования

### Проверка сохраненных сообщений

После того как бот начнет получать сообщения, вы можете проверить сохраненные данные через функцию `get-chat-messages`:

```bash
curl "https://<SUPABASE_URL>/functions/v1/get-chat-messages?chat_id=-1001234567890&bot_name=@dialog_analyze_bot"
```

## Безопасность

- Вебхук защищен секретным параметром `secret` в URL
- Используется `SUPABASE_SERVICE_ROLE_KEY` для доступа к базе данных
- Все запросы проверяются на наличие правильного секрета

## Логирование

Функция логирует:

- Успешное сохранение сообщений
- Ошибки при сохранении
- Дубликаты сообщений (не считаются ошибкой)

Логи можно просмотреть в Supabase Dashboard → Edge Functions → dialog-analyze-bot → Logs.
