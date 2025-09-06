#!/bin/bash

# Собираем Docker образ
gcloud builds submit --tag eu.gcr.io/$(gcloud config get-value project)/image-uploader

# Развертываем на Cloud Run
gcloud run deploy image-uploader \
  --image eu.gcr.io/$(gcloud config get-value project)/image-uploader \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GEMINI_API_KEY="$GEMINI_API_KEY" \
  --memory 512Mi \
  --timeout 300s

echo "Сервис успешно развернут на Google Cloud Run!"
echo "URL сервиса:"
gcloud run services describe image-uploader --region us-central1 --format="value(status.url)"
