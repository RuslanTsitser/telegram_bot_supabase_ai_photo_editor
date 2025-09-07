-- Создаем функцию для уменьшения лимита генерации
CREATE OR REPLACE FUNCTION decrement_generation_limit(
    user_id_param UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE premium_statuses 
    SET 
        generation_limit = GREATEST(generation_limit - 1, 0),
        updated_at = NOW()
    WHERE user_id = user_id_param;
END;
$$;
