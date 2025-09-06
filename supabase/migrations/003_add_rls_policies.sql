-- Включаем RLS для всех таблиц
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы users
-- Пользователи могут видеть только свои данные
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Пользователи могут обновлять только свои данные
CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- Пользователи могут вставлять только свои данные
CREATE POLICY "Users can insert own data" ON users
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Политики для таблицы premium_statuses
-- Пользователи могут видеть только свой премиум статус
CREATE POLICY "Users can view own premium status" ON premium_statuses
    FOR SELECT USING (auth.uid() = user_id);

-- Пользователи могут обновлять только свой премиум статус
CREATE POLICY "Users can update own premium status" ON premium_statuses
    FOR UPDATE USING (auth.uid() = user_id);

-- Пользователи могут вставлять только свой премиум статус
CREATE POLICY "Users can insert own premium status" ON premium_statuses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Политики для таблицы subscription_plans
-- Все пользователи могут видеть активные планы
CREATE POLICY "Anyone can view active plans" ON subscription_plans
    FOR SELECT USING (is_active = true);

-- Политики для таблицы payments
-- Пользователи могут видеть только свои платежи
CREATE POLICY "Users can view own payments" ON payments
    FOR SELECT USING (auth.uid() = user_id);

-- Пользователи могут вставлять только свои платежи
CREATE POLICY "Users can insert own payments" ON payments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Пользователи могут обновлять только свои платежи
CREATE POLICY "Users can update own payments" ON payments
    FOR UPDATE USING (auth.uid() = user_id);

-- Создаем функцию для получения пользователя по telegram_id
CREATE OR REPLACE FUNCTION get_user_by_telegram_id(telegram_id_param BIGINT)
RETURNS TABLE (
    id UUID,
    telegram_id BIGINT,
    telegram_username VARCHAR(255),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),
    telegram_photo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT u.id, u.telegram_id, u.telegram_username, u.telegram_first_name, 
           u.telegram_last_name, u.telegram_photo_url, u.created_at, u.updated_at
    FROM users u
    WHERE u.telegram_id = telegram_id_param;
END;
$$;

-- Создаем функцию для создания/обновления пользователя
CREATE OR REPLACE FUNCTION upsert_user(
    telegram_id_param BIGINT,
    telegram_username_param VARCHAR(255) DEFAULT NULL,
    telegram_first_name_param VARCHAR(255) DEFAULT NULL,
    telegram_last_name_param VARCHAR(255) DEFAULT NULL,
    telegram_photo_url_param TEXT DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    telegram_id BIGINT,
    telegram_username VARCHAR(255),
    telegram_first_name VARCHAR(255),
    telegram_last_name VARCHAR(255),
    telegram_photo_url TEXT,
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
    SELECT * INTO user_record FROM users WHERE telegram_id = telegram_id_param;
    
    IF FOUND THEN
        -- Обновляем существующего пользователя
        UPDATE users SET
            telegram_username = COALESCE(telegram_username_param, telegram_username),
            telegram_first_name = COALESCE(telegram_first_name_param, telegram_first_name),
            telegram_last_name = COALESCE(telegram_last_name_param, telegram_last_name),
            telegram_photo_url = COALESCE(telegram_photo_url_param, telegram_photo_url),
            updated_at = NOW()
        WHERE telegram_id = telegram_id_param
        RETURNING * INTO user_record;
    ELSE
        -- Создаем нового пользователя
        INSERT INTO users (telegram_id, telegram_username, telegram_first_name, telegram_last_name, telegram_photo_url)
        VALUES (telegram_id_param, telegram_username_param, telegram_first_name_param, telegram_last_name_param, telegram_photo_url_param)
        RETURNING * INTO user_record;
        
        -- Создаем запись премиум статуса для нового пользователя
        INSERT INTO premium_statuses (user_id, is_premium, generation_limit)
        VALUES (user_record.id, false, 5);
    END IF;
    
    RETURN QUERY SELECT * FROM users WHERE id = user_record.id;
END;
$$;
