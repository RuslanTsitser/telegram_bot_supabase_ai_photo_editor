-- Включение RLS для таблиц групп изображений
ALTER TABLE image_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_images ENABLE ROW LEVEL SECURITY;

-- Политики для таблицы image_groups
-- Только service role может работать с группами изображений
CREATE POLICY "Service role can manage image groups" ON image_groups
    FOR ALL USING (auth.role() = 'service_role');

-- Политики для таблицы group_images
-- Только service role может работать с изображениями в группах
CREATE POLICY "Service role can manage group images" ON group_images
    FOR ALL USING (auth.role() = 'service_role');