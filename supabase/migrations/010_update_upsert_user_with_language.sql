-- Обновляем функцию upsert_user для поддержки языка
CREATE OR REPLACE FUNCTION upsert_user(
    telegram_id_param BIGINT,
    telegram_username_param VARCHAR(255) DEFAULT NULL,
    telegram_first_name_param VARCHAR(255) DEFAULT NULL,
    telegram_last_name_param VARCHAR(255) DEFAULT NULL,
    telegram_photo_url_param TEXT DEFAULT NULL,
    language_code_param VARCHAR(5) DEFAULT 'ru'
)
RETURNS TABLE (
    id UUID,
    telegram_id BIGINT,
    telegram_username VARCHAR(255),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),
    telegram_photo_url TEXT,
    language_code VARCHAR(5),
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_record RECORD;
BEGIN
    -- Пытаемся найти существующего пользователя
    SELECT * INTO user_record FROM users WHERE users.telegram_id = telegram_id_param;
    
    IF FOUND THEN
        -- Обновляем существующего пользователя
        UPDATE users SET
            telegram_username = COALESCE(telegram_username_param, users.telegram_username),
            telegram_first_name = COALESCE(telegram_first_name_param, users.telegram_first_name),
            telegram_last_name = COALESCE(telegram_last_name_param, users.telegram_last_name),
            telegram_photo_url = COALESCE(telegram_photo_url_param, users.telegram_photo_url),
            language_code = COALESCE(language_code_param, users.language_code),
            updated_at = NOW()
        WHERE users.id = user_record.id
        RETURNING * INTO user_record;
    ELSE
        -- Создаем нового пользователя
        INSERT INTO users (telegram_id, telegram_username, telegram_first_name, telegram_last_name, telegram_photo_url, language_code)
        VALUES (telegram_id_param, telegram_username_param, telegram_first_name_param, telegram_last_name_param, telegram_photo_url_param, language_code_param)
        RETURNING * INTO user_record;
        
        -- Создаем запись премиум статуса для нового пользователя
        INSERT INTO premium_statuses (user_id, is_premium, generation_limit)
        VALUES (user_record.id, false, 5);
    END IF;
    
    RETURN QUERY SELECT * FROM users WHERE users.id = user_record.id;
END;
$$;
