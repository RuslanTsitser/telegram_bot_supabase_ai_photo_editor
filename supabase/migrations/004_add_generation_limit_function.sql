-- Создаем функцию для добавления лимита генерации
CREATE OR REPLACE FUNCTION add_generation_limit(
    user_id_param UUID,
    amount_param INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE premium_statuses 
    SET 
        generation_limit = generation_limit + amount_param,
        updated_at = NOW()
    WHERE user_id = user_id_param;
END;
$$;

-- Создаем функцию для обновления премиум подписки
CREATE OR REPLACE FUNCTION update_premium_subscription(
    user_id_param UUID,
    days_param INTEGER
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_expires_at TIMESTAMP WITH TIME ZONE;
    new_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Получаем текущую дату истечения подписки
    SELECT premium_expires_at INTO current_expires_at 
    FROM premium_statuses 
    WHERE user_id = user_id_param;
    
    -- Определяем новую дату истечения
    IF current_expires_at IS NOT NULL AND current_expires_at > NOW() THEN
        -- Если подписка активна, прибавляем дни к существующей дате
        new_expires_at := current_expires_at + (days_param || ' days')::INTERVAL;
    ELSE
        -- Если подписки нет или она истекла, начинаем с текущей даты
        new_expires_at := NOW() + (days_param || ' days')::INTERVAL;
    END IF;
    
    -- Обновляем премиум статус
    UPDATE premium_statuses 
    SET 
        premium_expires_at = new_expires_at,
        updated_at = NOW()
    WHERE user_id = user_id_param;
END;
$$;
