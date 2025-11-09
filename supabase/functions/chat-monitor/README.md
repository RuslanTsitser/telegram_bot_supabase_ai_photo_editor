# Chat Monitor Edge Function

Edge функция для сохранения ссылок на сообщения из Telegram чатов.

## Описание

Эта функция принимает данные о сообщениях из Telegram чатов (ID чата, ID сообщения и название бота) и сохраняет их в таблице `chat_messages` базы данных Supabase. Функция предназначена для мониторинга сообщений в чатах, которые можно будет анализировать позже.

## Использование

### Endpoint

```
POST /functions/v1/chat-monitor
```

### Запрос

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "chat_id": -1001234567890,
  "message_id": 12345,
  "bot_name": "@my_bot"
}
```

**Обязательные поля:**

- `chat_id` - ID чата в Telegram (число, может быть отрицательным для групп)
- `message_id` - ID сообщения в Telegram (число)
- `bot_name` - Название бота (строка, например: "@my_bot" или "my_bot")

### Ответ

**Успешный ответ (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "chat_id": -1001234567890,
    "message_id": 12345,
    "bot_name": "@my_bot",
    "created_at": "2025-01-15T10:30:00Z"
  }
}
```

**Сообщение уже существует (200):**

Если сообщение с такими же `chat_id`, `message_id` и `bot_name` уже существует, функция вернет успешный ответ:

```json
{
  "success": true,
  "message": "Message already exists",
  "data": {
    "chat_id": -1001234567890,
    "message_id": 12345,
    "bot_name": "@my_bot"
  }
}
```

**Ошибка валидации (400):**

```json
{
  "error": "Missing required fields: chat_id, message_id, bot_name"
}
```

или

```json
{
  "error": "chat_id and message_id must be numbers, bot_name must be a string"
}
```

или

```json
{
  "error": "bot_name cannot be empty"
}
```

**Ошибка сервера (500):**

```json
{
  "error": "Failed to save data",
  "details": "error message"
}
```

## Примеры использования

### cURL

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/chat-monitor \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": -1001234567890,
    "message_id": 12345,
    "bot_name": "@my_bot"
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch(
  'https://YOUR_PROJECT.supabase.co/functions/v1/chat-monitor',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: -1001234567890,
      message_id: 12345,
      bot_name: '@my_bot'
    })
  }
);

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

url = "https://YOUR_PROJECT.supabase.co/functions/v1/chat-monitor"
headers = {
    "Content-Type": "application/json"
}
data = {
    "chat_id": -1001234567890,
    "message_id": 12345,
    "bot_name": "@my_bot"
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

### Telegram Bot (пример интеграции)

```typescript
import { Bot } from "https://deno.land/x/grammy@v1.8.3/mod.ts";

const bot = new Bot(Deno.env.get("BOT_TOKEN") || "");

bot.on("message", async (ctx) => {
  // Сохраняем сообщение через chat-monitor
  const response = await fetch(
    `${Deno.env.get("SUPABASE_URL")}/functions/v1/chat-monitor`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`
      },
      body: JSON.stringify({
        chat_id: ctx.chat.id,
        message_id: ctx.message.message_id,
        bot_name: "@my_bot"
      })
    }
  );
  
  const result = await response.json();
  console.log("Message saved:", result);
});
```

## Структура таблицы

Данные сохраняются в таблицу `chat_messages` со следующей структурой:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Уникальный идентификатор записи |
| `chat_id` | BIGINT | ID чата в Telegram |
| `message_id` | BIGINT | ID сообщения в Telegram |
| `bot_name` | TEXT | Название бота |
| `created_at` | TIMESTAMPTZ | Дата создания записи |

**Индексы:**

- Индекс на `(chat_id, created_at)` для быстрого поиска по датам
- Уникальный индекс на `(chat_id, message_id, bot_name)` для предотвращения дубликатов
- Индекс на `bot_name` для быстрого поиска по боту

## Аутентификация

**JWT токен не требуется** - функция доступна публично без авторизации. Однако рекомендуется использовать `SUPABASE_SERVICE_ROLE_KEY` для доступа к функции.

## CORS

Функция поддерживает CORS и может быть вызвана из браузера. Все запросы получают соответствующие CORS заголовки.

## Валидация

- Обязательные поля: `chat_id`, `message_id`, `bot_name`
- `chat_id` и `message_id` должны быть числами
- `bot_name` должен быть непустой строкой
- Все строковые поля обрезаются от пробелов

## Безопасность

- Функция использует `SUPABASE_SERVICE_ROLE_KEY` для доступа к базе данных
- Таблица `chat_messages` имеет включенный Row Level Security (RLS)
- Политики безопасности настроены для разрешения доступа только через service_role
- Название бота хранится в БД (не токен), что безопаснее

## Деплой

```bash
supabase functions deploy chat-monitor
```

## Локальная разработка

```bash
supabase functions serve chat-monitor
```

Затем функция будет доступна по адресу:

```
http://localhost:54321/functions/v1/chat-monitor
```

## Использование в n8n

### Настройка workflow в n8n

1. **Создайте новый workflow** в n8n

2. **Добавьте Telegram Trigger** (опционально, если хотите автоматически сохранять сообщения):
   - Добавьте ноду "Telegram Trigger"
   - Настройте подключение к вашему Telegram боту
   - Выберите событие "Message" или "New Message"

3. **Добавьте HTTP Request ноду**:
   - Метод: `POST`
   - URL: `https://YOUR_PROJECT.supabase.co/functions/v1/chat-monitor`
   - Headers:

     ```
     Content-Type: application/json
     ```

   - Body (JSON):

     ```json
     {
       "chat_id": {{ $json.chat.id }},
       "message_id": {{ $json.message.message_id }},
       "bot_name": "@your_bot"
     }
     ```

### Пример workflow

```
Telegram Trigger → HTTP Request (chat-monitor) → Success/Error Handler
```

### Настройка HTTP Request ноды

**URL:**

```
https://YOUR_PROJECT.supabase.co/functions/v1/chat-monitor
```

**Method:** `POST`

**Authentication:** None (или используйте Bearer Token с `SUPABASE_SERVICE_ROLE_KEY`)

**Headers:**

- `Content-Type`: `application/json`

**Body (JSON):**

```json
{
  "chat_id": "{{ $json.chat.id }}",
  "message_id": "{{ $json.message.message_id }}",
  "bot_name": "@your_bot"
}
```

### Пример с обработкой ответа

Добавьте ноду "IF" после HTTP Request для проверки результата:

**Condition:**

```
{{ $json.success }} === true
```

**True branch:** Успешное сохранение
**False branch:** Обработка ошибки

### Полный пример workflow

1. **Telegram Trigger** - получает новые сообщения
2. **HTTP Request** - вызывает chat-monitor
3. **IF** - проверяет успешность
4. **Set** (True) - логирует успех
5. **Set** (False) - логирует ошибку

### Переменные окружения в n8n

Рекомендуется использовать переменные окружения для URL:

```
SUPABASE_URL=https://YOUR_PROJECT.supabase.co
```

Тогда URL в HTTP Request будет:

```
{{ $env.SUPABASE_URL }}/functions/v1/chat-monitor
```

### Пример с несколькими ботами

Если у вас несколько ботов, можно использовать условие для выбора `bot_name`:

```json
{
  "chat_id": "{{ $json.chat.id }}",
  "message_id": "{{ $json.message.message_id }}",
  "bot_name": "{{ $json.bot.username }}"
}
```

## Примечания

- Функция сохраняет только ID сообщений, не их содержимое
- Содержимое сообщений можно получить позже через Telegram Bot API используя сохраненные ID
- Один и тот же `message_id` может существовать в разных чатах с разными ботами
- Дубликаты автоматически обрабатываются - если сообщение уже существует, функция вернет успешный ответ
