-- Миграция для переименования поля language_code в language
-- Дата: 2024-12-19

-- Переименовываем колонку language_code в language
ALTER TABLE users 
RENAME COLUMN language_code TO language;

-- Обновляем функцию upsert_user для использования нового поля
CREATE OR REPLACE FUNCTION upsert_user(
  telegram_id_param BIGINT,
  telegram_username_param TEXT,
  telegram_first_name_param TEXT,
  telegram_last_name_param TEXT,
  telegram_photo_url_param TEXT,
  language_param TEXT DEFAULT 'ru'
)
RETURNS TABLE(
  id UUID,
  telegram_id BIGINT,
  telegram_username TEXT,
  telegram_first_name TEXT,
  telegram_last_name TEXT,
  telegram_photo_url TEXT,
  language TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  -- Вставляем или обновляем пользователя
  INSERT INTO users (
    telegram_id,
    telegram_username,
    telegram_first_name,
    telegram_last_name,
    telegram_photo_url,
    language,
    created_at,
    updated_at
  )
  VALUES (
    telegram_id_param,
    telegram_username_param,
    telegram_first_name_param,
    telegram_last_name_param,
    telegram_photo_url_param,
    language_param,
    NOW(),
    NOW()
  )
  ON CONFLICT (telegram_id)
  DO UPDATE SET
    telegram_username = EXCLUDED.telegram_username,
    telegram_first_name = EXCLUDED.telegram_first_name,
    telegram_last_name = EXCLUDED.telegram_last_name,
    telegram_photo_url = EXCLUDED.telegram_photo_url,
    language = EXCLUDED.language,
    updated_at = NOW()
  RETURNING *;
END;
$$;

-- Обновляем RLS политики если они ссылаются на старое поле
-- (обычно RLS политики не зависят от названий полей, но на всякий случай)

-- Добавляем комментарий к колонке
COMMENT ON COLUMN users.language IS 'Язык пользователя (ru, en, etc.)';
