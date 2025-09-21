#!/bin/bash

source supabase/functions/image-generator/.env

echo "GEMINI_API_KEY: $GEMINI_API_KEY"
export GEMINI_API_KEY="$GEMINI_API_KEY"

cd gcp-image-uploader

go mod tidy

go run main.go

cd ..