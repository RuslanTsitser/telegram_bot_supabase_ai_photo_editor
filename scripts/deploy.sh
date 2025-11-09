#!/bin/bash

# название функции
FUNCTION_NAME=$1
PROJECT_REF=jutmiptqsbfxntlckuhu

if [ -z "$FUNCTION_NAME" ]; then
    echo "Usage: $0 <function_name>"
    exit 1
fi

supabase functions deploy $FUNCTION_NAME --project-ref $PROJECT_REF --no-verify-jwt
