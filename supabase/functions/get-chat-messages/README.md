# Get Chat Messages Edge Function

Edge функция для получения списка сообщений из чата по сохраненным ID.

## Описание

Эта функция получает список сообщений из таблицы `chat_messages` по указанным параметрам (ID чата, название бота, даты). Функция поддерживает фильтрацию по датам и пагинацию.

## Использование

### Endpoint

```
GET /functions/v1/get-chat-messages
POST /functions/v1/get-chat-messages
```

### Запрос (GET с query параметрами)

**URL:**

```
GET /functions/v1/get-chat-messages?chat_id=-1001234567890&bot_name=@my_bot&date_from=2025-01-15T00:00:00Z&date_to=2025-01-15T23:59:59Z&limit=100&offset=0
```

**Query параметры:**

- `chat_id` (обязательный) - ID чата в Telegram
- `bot_name` (обязательный) - Название бота
- `date_from` (опциональный) - Начальная дата в формате ISO (например: `2025-01-15T00:00:00Z`)
- `date_to` (опциональный) - Конечная дата в формате ISO (например: `2025-01-15T23:59:59Z`)
- `limit` (опциональный) - Количество записей (по умолчанию: 100, максимум: 1000)
- `offset` (опциональный) - Смещение для пагинации (по умолчанию: 0)

### Запрос (POST с body)

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "chat_id": -1001234567890,
  "bot_name": "@my_bot",
  "date_from": "2025-01-15T00:00:00Z",
  "date_to": "2025-01-15T23:59:59Z",
  "limit": 100,
  "offset": 0
}
```

**Обязательные поля:**

- `chat_id` - ID чата в Telegram (число)
- `bot_name` - Название бота (строка)

**Опциональные поля:**

- `date_from` - Начальная дата в формате ISO
- `date_to` - Конечная дата в формате ISO
- `limit` - Количество записей (по умолчанию: 100, максимум: 1000)
- `offset` - Смещение для пагинации (по умолчанию: 0)

### Ответ

**Успешный ответ (200):**

```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "chat_id": -1001234567890,
      "message_id": 12345,
      "bot_name": "@my_bot",
      "created_at": "2025-01-15T10:30:00Z"
    },
    {
      "id": "uuid",
      "chat_id": -1001234567890,
      "message_id": 12346,
      "bot_name": "@my_bot",
      "created_at": "2025-01-15T10:31:00Z"
    }
  ],
  "pagination": {
    "total": 250,
    "limit": 100,
    "offset": 0,
    "has_more": true
  }
}
```

**Ошибка валидации (400):**

```json
{
  "error": "Missing required query parameters: chat_id, bot_name"
}
```

или

```json
{
  "error": "Invalid date_from format. Use ISO date string (e.g., 2025-01-15T00:00:00Z)"
}
```

**Ошибка сервера (500):**

```json
{
  "error": "Failed to fetch messages",
  "details": "error message"
}
```

## Примеры использования

### cURL (GET)

```bash
curl "https://YOUR_PROJECT.supabase.co/functions/v1/get-chat-messages?chat_id=-1001234567890&bot_name=@my_bot&date_from=2025-01-15T00:00:00Z&date_to=2025-01-15T23:59:59Z&limit=100"
```

### cURL (POST)

```bash
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/get-chat-messages \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": -1001234567890,
    "bot_name": "@my_bot",
    "date_from": "2025-01-15T00:00:00Z",
    "date_to": "2025-01-15T23:59:59Z",
    "limit": 100,
    "offset": 0
  }'
```

### JavaScript/TypeScript (GET)

```typescript
const params = new URLSearchParams({
  chat_id: '-1001234567890',
  bot_name: '@my_bot',
  date_from: '2025-01-15T00:00:00Z',
  date_to: '2025-01-15T23:59:59Z',
  limit: '100',
  offset: '0'
});

const response = await fetch(
  `https://YOUR_PROJECT.supabase.co/functions/v1/get-chat-messages?${params}`
);

const data = await response.json();
console.log(data);
```

### JavaScript/TypeScript (POST)

```typescript
const response = await fetch(
  'https://YOUR_PROJECT.supabase.co/functions/v1/get-chat-messages',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: -1001234567890,
      bot_name: '@my_bot',
      date_from: '2025-01-15T00:00:00Z',
      date_to: '2025-01-15T23:59:59Z',
      limit: 100,
      offset: 0
    })
  }
);

const data = await response.json();
console.log(data);
```

### Python (GET)

```python
import requests
from urllib.parse import urlencode

params = {
    'chat_id': -1001234567890,
    'bot_name': '@my_bot',
    'date_from': '2025-01-15T00:00:00Z',
    'date_to': '2025-01-15T23:59:59Z',
    'limit': 100,
    'offset': 0
}

url = f"https://YOUR_PROJECT.supabase.co/functions/v1/get-chat-messages?{urlencode(params)}"
response = requests.get(url)
print(response.json())
```

### Python (POST)

```python
import requests

url = "https://YOUR_PROJECT.supabase.co/functions/v1/get-chat-messages"
headers = {
    "Content-Type": "application/json"
}
data = {
    "chat_id": -1001234567890,
    "bot_name": "@my_bot",
    "date_from": "2025-01-15T00:00:00Z",
    "date_to": "2025-01-15T23:59:59Z",
    "limit": 100,
    "offset": 0
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

## Пагинация

Функция поддерживает пагинацию через параметры `limit` и `offset`:

- `limit` - количество записей на странице (по умолчанию: 100, максимум: 1000)
- `offset` - смещение для получения следующей страницы

**Пример пагинации:**

```typescript
// Первая страница
const page1 = await fetch(
  `${url}?chat_id=${chatId}&bot_name=${botName}&limit=100&offset=0`
);

// Вторая страница
const page2 = await fetch(
  `${url}?chat_id=${chatId}&bot_name=${botName}&limit=100&offset=100`
);

// Третья страница
const page3 = await fetch(
  `${url}?chat_id=${chatId}&bot_name=${botName}&limit=100&offset=200`
);
```

## Фильтрация по датам

Функция поддерживает фильтрацию по датам через параметры `date_from` и `date_to`:

- `date_from` - начальная дата (включительно)
- `date_to` - конечная дата (включительно)

**Формат даты:** ISO 8601 (например: `2025-01-15T00:00:00Z`)

**Пример:**

```typescript
// Получить сообщения за 15 января 2025
const response = await fetch(
  `${url}?chat_id=${chatId}&bot_name=${botName}&date_from=2025-01-15T00:00:00Z&date_to=2025-01-15T23:59:59Z`
);
```

## Аутентификация

**JWT токен не требуется** - функция доступна публично без авторизации. Однако рекомендуется использовать `SUPABASE_SERVICE_ROLE_KEY` для доступа к функции.

## CORS

Функция поддерживает CORS и может быть вызвана из браузера. Все запросы получают соответствующие CORS заголовки.

## Валидация

- Обязательные поля: `chat_id`, `bot_name`
- `chat_id` должен быть числом
- `bot_name` должен быть непустой строкой
- `date_from` и `date_to` должны быть валидными ISO датами
- `limit` должен быть числом от 1 до 1000
- `offset` должен быть неотрицательным числом

## Безопасность

- Функция использует `SUPABASE_SERVICE_ROLE_KEY` для доступа к базе данных
- Таблица `chat_messages` имеет включенный Row Level Security (RLS)
- Политики безопасности настроены для разрешения доступа только через service_role

## Деплой

```bash
supabase functions deploy get-chat-messages
```

## Локальная разработка

```bash
supabase functions serve get-chat-messages
```

Затем функция будет доступна по адресу:

```
http://localhost:54321/functions/v1/get-chat-messages
```

## Использование в n8n

### Настройка HTTP Request ноды

**URL (GET):**

```
https://YOUR_PROJECT.supabase.co/functions/v1/get-chat-messages?chat_id={{ $json.chat_id }}&bot_name={{ $json.bot_name }}&date_from={{ $json.date_from }}&date_to={{ $json.date_to }}
```

**URL (POST):**

```
https://YOUR_PROJECT.supabase.co/functions/v1/get-chat-messages
```

**Method:** `GET` или `POST`

**Body (для POST):**

```json
{
  "chat_id": "{{ $json.chat_id }}",
  "bot_name": "{{ $json.bot_name }}",
  "date_from": "{{ $json.date_from }}",
  "date_to": "{{ $json.date_to }}",
  "limit": 100,
  "offset": 0
}
```

### Пример workflow

```
Manual Trigger → Set Variables → HTTP Request (get-chat-messages) → Process Messages
```

## Примечания

- Сообщения возвращаются в порядке убывания даты создания (новые первыми)
- Максимальное количество записей на странице: 1000
- Если не указаны даты, возвращаются все сообщения для указанного чата и бота
- Функция возвращает только ID сообщений, не их содержимое
- Для получения содержимого сообщений используйте Telegram Bot API с сохраненными ID
