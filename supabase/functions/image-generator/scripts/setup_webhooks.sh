#!/bin/bash

source supabase/functions/image-generator/.env

echo "BOT_TOKEN: ${BOT_TOKEN}"

# Setup webhook for deepseek-bot
curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook\
?url=${DOMAIN}\
?secret=${BOT_FUNCTION_SECRET}"
