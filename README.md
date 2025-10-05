# Telegram Bot для генерации изображений

Telegram бот, который помогает генерировать изображения с помощью Google Gemini AI.

## 🚀 Возможности

- Генерация изображений по описанию
- Обработка множественных изображений
- Система подписок и лимитов
- Интеграция с Yookassa для платежей
- Онбординг для новых пользователей

## 📋 Требования

- Deno 1.40+ (для Supabase Edge Functions)
- Go 1.21+ (для GCP Image Uploader)
- Supabase аккаунт
- Telegram Bot Token
- Google Gemini API ключ

## Структура проекта

```structure

telegram_bot_supabase_ai_photo_editor/
|--- gcp-image-uploader/                   # Внешний API для генерации изображений с Google Gemini AI
    |--- deploy.sh                         # Деплой
    |--- Dockerfile                        # Dockerfile
    |--- main.go                           # Основной файл
    |--- go.mod                            # Модули
    |--- go.sum                            # Сумма модулей
    |--- README.md                         # README
|--- supabase/
    |--- functions/
        |--- image-generator/              # Генератор изображений с Google Gemini AI
            |--- scripts/               # Скрипты
                |--- deploy.sh             # Деплой
                |--- run.sh                # Запуск локально
                |--- set_bot.sh            # Настройка webhook в боте
                |--- set_env.sh            # Настройка переменных окружения
            |--- src/               # Скрипты
                |--- api/                  # API
                |--- storage/              # Storage
                |--- telegram/             # Telegram обработчики
                |--- utils/                # Утилиты
            |--- .env                  # Переменные окружения
            |--- .env.example          # Пример переменных окружения
            |--- deno.json             # Deno зависимости
            |--- index.ts              # Основной файл бота
|--- README.md
```

## ⚙️ Настройка

### 1. Клонирование репозитория

```bash
git clone <repository-url>
cd telegram_bot_supabase_ai_photo_editor
```

### 2. Настройка переменных окружения

Скопируйте `.env.example` в `.env` и заполните переменные:

```bash
cp supabase/functions/image-generator/.env.example supabase/functions/image-generator/.env
```

**Обязательные переменные:**

- `BOT_TOKEN` - токен Telegram бота
- `BOT_FUNCTION_SECRET` - секрет для webhook
- `GEMINI_API_KEY` - API ключ Google Gemini
- `YOOKASSA_PROVIDER_TOKEN` - токен Yookassa для продакшена
- `YOOKASSA_PROVIDER_TOKEN_TEST` - тестовый токен Yookassa
- `PROJECT_ID` - ID проекта Supabase
- `IMAGE_UPLOADER_API_URL` - URL API для загрузки изображений

### 3. Запуск локально

```bash
# Запуск Supabase функции
cd supabase/functions/image-generator
bash scripts/run.sh

# Запуск GCP Image Uploader
cd gcp-image-uploader
bash scripts/run.sh
```

### 4. Деплой

```bash
# Деплой Supabase функции
cd supabase/functions/image-generator
bash scripts/deploy.sh

# Деплой GCP Image Uploader
cd gcp-image-uploader
bash scripts/deploy.sh
```

## Бизнес требования

### Таблицы

#### users

id - uuid
telegram_id - telegram id
telegram_username - telegram username
telegram_first_name - telegram first name
telegram_last_name - telegram last name
telegram_photo_url - telegram photo url

#### premium_statuses

id - uuid
user_id - uuid - внешний ключ к таблице users
is_premium - это поле перманентный премиум. Я как админ могу назначать, кому доступен полный функционал
premium_expires_at - для тех, кто купил премиум. С подпиской - безлимитное количество запросов
generation_limit - для тех, у кого нет подписки. Количество оставшихся запросов (изначально 5)

#### subscription_plans

id - uuid
name - название тарифа
description - описание тарифа
price - цена тарифа в рублях
type - тип тарифа (подписка или разовый платеж)
value - количество единиц (для подписки - количество дней, для разового платежа - количество запросов)

#### payments

id - uuid
user_id - uuid - внешний ключ к таблице users
plan_id - uuid - внешний ключ к таблице subscription_plans
youkassa_payment_id - id платежа в Юкассе
amount - сумма платежа
currency - валюта платежа
status - статус платежа

### Проверка премиума и тарифа

1) Сначала проверяю is_premium - это перманентный премиум. Я как админ могу назначать, кому доступен полный функционал
2) Если не премиум, то проверяю активна ли подписка. Нужно проверять premium_expires_at. Если дата истечения больше текущей даты, то подписка активна.
3) Если нет подписки, то проверяю generation_limit

### Тарифы

1) Недельный тариф на 7 дней
2) 5 запросов
3) 10 запросов

### Команды

- `/start` - начать работу с ботом. Получить базовую инструкцию
- `/subscriptions` - список доступных тарифов
- `/limits` - список лимитов пользователя

## 🤝 Вклад в проект

1. Форкните репозиторий
2. Создайте ветку для новой функции (`git checkout -b feature/amazing-feature`)
3. Зафиксируйте изменения (`git commit -m 'Add some amazing feature'`)
4. Отправьте в ветку (`git push origin feature/amazing-feature`)
5. Откройте Pull Request

## 📄 Лицензия

Этот проект лицензирован под MIT License - см. файл [LICENSE](LICENSE) для деталей.

## 📞 Поддержка

Если у вас есть вопросы или предложения, создайте [Issue](https://github.com/your-username/telegram_bot_supabase_ai_photo_editor/issues) в репозитории.
