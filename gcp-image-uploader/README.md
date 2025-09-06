# GCP Image Uploader API

Простой API для загрузки изображений по URL в Google AI.

## Переменные окружения

- `GEMINI_API_KEY` - API ключ для Google Gemini AI
- `PORT` - порт сервера (по умолчанию 8080)

## Запуск локально

```bash
# Установка зависимостей
go mod tidy

# Установка переменной окружения
export GEMINI_API_KEY="<GEMINI_API_KEY>"

# Запуск сервера
go run main.go
```

## Деплой

```bash
# 1. Установите переменную окружения
export GEMINI_API_KEY="<GEMINI_API_KEY>"

# 2. Сделайте скрипт исполняемым
chmod +x deploy.sh

# 3. Запустите развертывание
./deploy.sh
```

## API Endpoint

### Пример использования (локально)

```bash
curl -X POST http://localhost:8080/upload \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://api.telegram.org/file/bot8017415486:AAFNOhR1ENhfhKqM133aMY4U5ORm4sUfGK4/photos/file_28.jpg",
    "caption": "Добавь кота"
  }'
```
