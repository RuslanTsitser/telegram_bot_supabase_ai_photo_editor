# GCP Image Uploader API

Простой API для загрузки изображений по URL в Google AI.

## Переменные окружения

- `GEMINI_API_KEY` - API ключ для Google Gemini AI
- `PORT` - порт сервера (по умолчанию 8080)

## Запуск локально

```bash
bash gcp-image-uploader/scripts/run.sh
```

## Деплой

```bash
bash gcp-image-uploader/scripts/deploy.sh
```

## API Endpoint

### Пример использования (локально)

```bash
curl -X POST http://localhost:8080/upload \
  -H "Content-Type: application/json" \
  -d '{
    "imageUrl": "https://api.telegram.org/file/bot8017415486:AAFNOhR1ENhfhKqM133aMY4U5ORm4sUfGK4/photos/file_49.jpg",
    "caption": "Нужно рядом с этим велосипедом поставить эту машину",
    "otherImages": ["https://api.telegram.org/file/bot8017415486:AAFNOhR1ENhfhKqM133aMY4U5ORm4sUfGK4/photos/file_48.jpg"]
  }' | jq -r '.imageData' | base64 -d > generated_image.png
```
