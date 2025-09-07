# Telegram Bot для генерации изображений

Telegram бот, который помогает генерировать изображения.
Бот использует Google Gemini AI для генерации изображений.

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

## Переменные окружения

Указываются в .env файле в директории supabase/functions/image-generator

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

/start - начать работу с ботом. Получить базовую инструкцию
/subscriptions - список доступных тарифов
/limits - список лимитов пользователя
