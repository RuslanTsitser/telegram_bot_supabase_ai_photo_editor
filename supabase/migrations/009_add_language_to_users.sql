-- Добавляем поле языка в таблицу пользователей
ALTER TABLE users 
ADD COLUMN language_code VARCHAR(5) DEFAULT 'ru';

-- Добавляем комментарий к полю
COMMENT ON COLUMN users.language_code IS 'Код языка пользователя (ru, en)';

-- Создаем индекс для быстрого поиска по языку
CREATE INDEX idx_users_language_code ON users(language_code);

-- Обновляем существующих пользователей, устанавливая русский язык по умолчанию
UPDATE users SET language_code = 'ru' WHERE language_code IS NULL;
