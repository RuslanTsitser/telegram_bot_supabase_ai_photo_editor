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
  onboarding_welcome: "👋 Привет! Я бот для генерации фотографий.",
  onboarding_description:
    "Отправь мне фотографию, добавь описание и я сгенерирую для тебя новое фото",
  onboarding_rules: "Правила простые:",
  onboarding_rule1: "1) Выбери любую фотографию из галереи",
  onboarding_rule2:
    "2) Добавь в описании, что ты хочешь сделать с этой фотографией",
  onboarding_rule3: "3) Отправь мне",
  onboarding_rule4: "4) Я сгенерирую для тебя новое фото",
  onboarding_examples:
    "Ниже приведены скриншоты примеров сгенерированных фотографий",
  onboarding_important: "⚠️ Важно:",
  onboarding_tip1:
    "- Опиши максимально подробно, что ты хочешь сделать со своей фотографией",
  onboarding_tip2:
    "- Если не добавишь описание, то я сгенерирую фотографию в мультяшном стиле",
  onboarding_tip3:
    "- Генерировать картинку только по описанию пока что не умею",
  onboarding_tip4:
    "- Иногда у меня могут быть проблемы с генерацией. В таком случае попытка не будет засчитана, и ты сможешь попробовать снова",
  onboarding_initial_generations: "📝 У тебя изначально есть 2 генерации.",
  onboarding_try_buy:
    "Попробуй, и если понравится, можешь купить дополнительные генерации.",
  onboarding_subscribe_command:
    "💫 Для покупки дополнительных генераций нажми /subscriptions",
  onboarding_limits_command:
    "🔢 Для просмотра количества доступных генераций нажми /limits",

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
