# Traffic Register Edge Function

Edge функция для регистрации пользователей и источников трафика.

## Описание

Эта функция принимает данные о пользователях (email, имя, источник трафика, название приложения и ответы на вопросы формы) и сохраняет их в таблице `traffic_users` базы данных Supabase.

## Использование

### Endpoint

```
POST /functions/v1/traffic-register
```

### Запрос

**Headers:**

```
Content-Type: application/json
```

**Body:**

```json
{
  "email": "user@example.com",
  "name": "Иван Иванов",
  "traffic_source": "google_ads",
  "app_name": "MyApp",
  "answers": {
    "question_1": "ответ на вопрос 1",
    "question_2": "ответ на вопрос 2",
    "question_3": ["вариант 1", "вариант 2"]
  }
}
```

**Обязательные поля:**

- `email` - Email пользователя (должен быть валидным форматом)
- `name` - Имя пользователя
- `traffic_source` - Источник трафика (например: "google_ads", "facebook", "telegram", "direct" и т.д.)

**Опциональные поля:**

- `app_name` - Название приложения (необязательно)
- `answers` - Ответы на вопросы формы в формате JSON (необязательно)

### Ответ

**Успешный ответ (200):**

```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Иван Иванов",
    "traffic_source": "google_ads",
    "app_name": "MyApp",
    "answers": {
      "question_1": "ответ на вопрос 1",
      "question_2": "ответ на вопрос 2"
    }
  }
}
```

**Ошибка валидации (400):**

```json
{
  "error": "Missing required fields: email, name, traffic_source"
}
```

или

```json
{
  "error": "Invalid email format"
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
curl -X POST https://YOUR_PROJECT.supabase.co/functions/v1/traffic-register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "name": "Иван Иванов",
    "traffic_source": "google_ads",
    "app_name": "MyApp",
    "answers": {
      "question_1": "ответ на вопрос 1",
      "question_2": "ответ на вопрос 2"
    }
  }'
```

### JavaScript/TypeScript

```typescript
const response = await fetch(
  'https://YOUR_PROJECT.supabase.co/functions/v1/traffic-register',
  {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: 'user@example.com',
      name: 'Иван Иванов',
      traffic_source: 'google_ads',
      app_name: 'MyApp',
      answers: {
        question_1: 'ответ на вопрос 1',
        question_2: 'ответ на вопрос 2'
      }
    })
  }
);

const data = await response.json();
console.log(data);
```

### Python

```python
import requests

url = "https://YOUR_PROJECT.supabase.co/functions/v1/traffic-register"
headers = {
    "Content-Type": "application/json"
}
data = {
    "email": "user@example.com",
    "name": "Иван Иванов",
    "traffic_source": "google_ads",
    "app_name": "MyApp",
    "answers": {
        "question_1": "ответ на вопрос 1",
        "question_2": "ответ на вопрос 2"
    }
}

response = requests.post(url, json=data, headers=headers)
print(response.json())
```

## Структура таблицы

Данные сохраняются в таблицу `traffic_users` со следующей структурой:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | UUID | Уникальный идентификатор записи |
| `email` | VARCHAR(255) | Email пользователя |
| `name` | VARCHAR(255) | Имя пользователя |
| `traffic_source` | VARCHAR(255) | Источник трафика |
| `app_name` | VARCHAR(255) | Название приложения (опционально) |
| `answers` | JSONB | Ответы на вопросы формы в формате JSON (опционально) |
| `created_at` | TIMESTAMPTZ | Дата создания записи |
| `updated_at` | TIMESTAMPTZ | Дата последнего обновления |

## Аутентификация

**JWT токен не требуется** - функция доступна публично без авторизации.

## CORS

Функция поддерживает CORS и может быть вызвана из браузера. Все запросы получают соответствующие CORS заголовки.

## Валидация

- Обязательные поля: `email`, `name`, `traffic_source`
- Опциональные поля: `app_name`, `answers`
- Email проверяется на соответствие формату `user@domain.com`
- Все строковые поля обрезаются от пробелов
- Поле `answers` должно быть объектом (JSON), если передано

## Безопасность

- Функция использует `SUPABASE_SERVICE_ROLE_KEY` для доступа к базе данных
- Таблица `traffic_users` имеет включенный Row Level Security (RLS)
- Политики безопасности настроены для разрешения публичных вставок

## Деплой

```bash
supabase functions deploy traffic-register
```

## Локальная разработка

```bash
supabase functions serve traffic-register
```

Затем функция будет доступна по адресу:

```
http://localhost:54321/functions/v1/traffic-register
```
