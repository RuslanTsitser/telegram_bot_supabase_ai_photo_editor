-- Создание таблицы групп изображений
CREATE TABLE IF NOT EXISTS image_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    media_group_id VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'collecting' CHECK (status IN ('collecting', 'processing', 'completed', 'failed')),
    total_images INTEGER DEFAULT 0,
    processed_images INTEGER DEFAULT 0,
    caption TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание таблицы изображений в группах
CREATE TABLE IF NOT EXISTS group_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    group_id UUID NOT NULL REFERENCES image_groups(id) ON DELETE CASCADE,
    telegram_file_id VARCHAR(255) NOT NULL,
    image_url TEXT,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Создание индексов для оптимизации запросов
CREATE INDEX IF NOT EXISTS idx_image_groups_media_group_id ON image_groups(media_group_id);
CREATE INDEX IF NOT EXISTS idx_image_groups_user_id ON image_groups(user_id);
CREATE INDEX IF NOT EXISTS idx_image_groups_status ON image_groups(status);
CREATE INDEX IF NOT EXISTS idx_image_groups_created_at ON image_groups(created_at);
CREATE INDEX IF NOT EXISTS idx_group_images_group_id ON group_images(group_id);
CREATE INDEX IF NOT EXISTS idx_group_images_telegram_file_id ON group_images(telegram_file_id);
CREATE INDEX IF NOT EXISTS idx_group_images_order_index ON group_images(group_id, order_index);

-- Создание триггеров для автоматического обновления updated_at
CREATE TRIGGER update_image_groups_updated_at BEFORE UPDATE ON image_groups
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
