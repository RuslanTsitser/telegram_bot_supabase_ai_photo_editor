export const ru = {
  // Общие сообщения
  welcome: "👋 Добро пожаловать! Я помогу вам генерировать изображения.",
  error: "❌ Произошла ошибка",
  cancel: "Отмена",

  // Команды
  start: "Начать",
  help: "Помощь",
  profile: "Профиль",
  limits: "Лимиты",
  subscriptions: "Подписки",
  language: "Язык",
  set_promo: "Промо-код",

  // Onboarding
  onboarding_welcome: "🪄 Привет!",
  onboarding_description: "Я превращаю обычные фото в арты и фантазии ✨",
  onboarding_instructions:
    "Отправь фото и напиши, что с ним сделать, или просто опиши изображение:",
  onboarding_example1:
    "«добавь кота» 🐱, «сделай в стиле Pixar» 🎬 или «кот в космосе» 🚀",
  onboarding_example_photo: "📸 Пример:",
  onboarding_example_result: "Обычное фото → Арт с котом 🐾",
  onboarding_free_generations:
    "💡 У тебя есть **2 бесплатные генерации** — попробуй прямо сейчас!",
  onboarding_subscribe_hint:
    "Если понравится, можешь докупить 👉 /subscriptions",
  onboarding_limits_hint: "Проверить лимиты 👉 /limits",

  // Follow-up message for inactive users
  onboarding_followup: "Попробуй: добавь кота 🐱 или сделай в стиле Pixar 🎬",

  // Платежи
  payment_success: "✅ Платеж успешно обработан! Купленный тариф: {planName}",
  payment_error: "❌ Ошибка при обработке платежа: {message}",
  payment_received_error:
    "✅ Платеж получен, но произошла ошибка при обновлением статуса.",

  // Подписки
  subscriptions_title: "💳 Доступные тарифы:",
  subscriptions_test_title: "💳 Доступные тарифы для теста:",
  subscription_activated: '🎉 Подписка "{planName}" успешно активирована!',
  subscription_expires: "Доступен до: {date}",
  subscription_full_access: "Теперь у вас есть полный доступ ко всем функциям!",

  // Лимиты
  limits_title: "📊 Ваши текущие лимиты:",
  premium_active: "✅ Премиум статус активен",
  premium_unlimited: "🎉 Безлимитный доступ ко всем функциям:",
  premium_generations: "• Генерации изображений: без ограничений",
  free_account: "🆓 Бесплатный аккаунт",
  free_features: "📝 Доступные функции:",
  free_generations: "• Генерации изображений:",
  free_generations_limit: "из 2 в день",
  free_generations_exhausted: "лимит исчерпан",
  subscribe_prompt:
    "💎 Оформите подписку командой /subscriptions для получения полного доступа",

  // Генерация изображений
  generation_instruction:
    "Пришлите картинку и описание, чтобы я сгенерировал для тебя новое фото",
  generation_processing: "Понял, генерирую фото...",
  generation_success: "Ваше фото готово!",
  generation_error: "Ошибка при загрузке изображения в Google AI",
  generation_save_error: "Ошибка при сохранении изображения",
  generation_upload_error: "Ошибка при создании группы изображений",
  generation_photo_error: "Ошибка при получении фото",
  generation_process_error: "Не удалось обработать изображение {error}",

  // Генерация по тексту
  text_generation_instruction:
    "Напишите описание изображения, которое хотите создать, например: 'кот в космосе' или 'закат над морем'",
  text_generation_processing: "Понял, создаю изображение по вашему описанию...",
  text_generation_success: "Ваше изображение готово!",
  text_generation_error: "Ошибка при генерации изображения по тексту",
  text_generation_empty_prompt: "Пожалуйста, опишите что вы хотите создать",

  // Доступ
  user_not_found: "Пользователь не найден",
  limits_not_found: "Информация о лимитах не найдена",
  generation_info_not_found: "Информация о возможности генерации не найдена",
  no_access: "У тебя нет доступа к генерации",

  // Промо-коды
  enter_promo_code: "🎟️ Введите ваш промо-код или введите /cancel для отмены",
  invalid_promo_code:
    "🎟️ Пожалуйста, введите корректный промо-код или введите /cancel для отмены",
  promo_code_update_error: "❌ Ошибка при обновлении промо-кода",
  promo_code_updated: "✅ Промо-код успешно обновлен: {code}",

  // Языки
  language_changed: "🌐 Язык изменен на русский",
  select_language: "🌐 Выберите язык:",

  // Единицы измерения
  cm: "см",
  kg: "кг",
  g: "г",
  kcal: "ккал",
} as const;
