export const en = {
  // General messages
  welcome: "👋 Welcome! I'll help you generate images.",
  error: "❌ An error occurred",
  cancel: "Cancel",

  // Commands
  start: "Start",
  help: "Help",
  profile: "Profile",
  limits: "Limits",
  subscriptions: "Subscriptions",
  language: "Language",
  set_promo: "Promo code",

  // Onboarding
  onboarding_welcome: "🪄 Hello!",
  onboarding_description: "I turn ordinary photos into art and fantasies ✨",
  onboarding_instructions:
    "Send me a photo and tell me what to do with it, or just describe an image:",
  onboarding_example1:
    '"add a cat" 🐱, "make it Pixar style" 🎬 or "cat in space" 🚀',
  onboarding_example_photo: "📸 Example:",
  onboarding_example_result: "Ordinary photo → Art with cat 🐾",
  onboarding_free_generations:
    "💡 You have **2 free generations** — try it right now!",
  onboarding_subscribe_hint:
    "If you like it, you can buy more 👉 /subscriptions",
  onboarding_limits_hint: "Check limits 👉 /limits",

  // Follow-up message for inactive users
  onboarding_followup: "Try: add a cat 🐱 or make it Pixar style 🎬",

  // Payments
  payment_success:
    "✅ Payment successfully processed! Purchased plan: {planName}",
  payment_error: "❌ Error processing payment: {message}",
  payment_received_error:
    "✅ Payment received, but an error occurred while updating status.",

  // Subscriptions
  subscriptions_title: "💳 Available plans:",
  subscriptions_test_title: "💳 Available test plans:",
  subscription_activated:
    '🎉 Subscription "{planName}" successfully activated!',
  subscription_expires: "Available until: {date}",
  subscription_full_access: "Now you have full access to all features!",

  // Limits
  limits_title: "📊 Your current limits:",
  premium_active: "✅ Premium status active",
  premium_unlimited: "🎉 Unlimited access to all features:",
  premium_generations: "• Image generations: unlimited",
  free_account: "🆓 Free account",
  free_features: "📝 Available features:",
  free_generations: "• Image generations:",
  free_generations_limit: "out of 2 per day",
  free_generations_exhausted: "limit exhausted",
  subscribe_prompt:
    "💎 Subscribe with /subscriptions command to get full access",

  // Image generation
  generation_instruction:
    "Send an image and description so I can generate a new photo for you",
  generation_processing: "Got it, generating photo...",
  generation_success: "Your photo is ready!",
  generation_error: "Error uploading image to Google AI",
  generation_save_error: "Error saving image",
  generation_upload_error: "Error creating image group",
  generation_photo_error: "Error getting photo",
  generation_process_error: "Failed to process image {error}",

  // Text-to-image generation
  text_generation_instruction:
    "Write a description of the image you want to create, for example: 'cat in space' or 'sunset over the sea'",
  text_generation_processing: "Got it, creating image from your description...",
  text_generation_success: "Your image is ready!",
  text_generation_error: "Error generating image from text",
  text_generation_empty_prompt: "Please describe what you want to create",

  // Access
  user_not_found: "User not found",
  limits_not_found: "Limits information not found",
  generation_info_not_found: "Generation capability information not found",
  no_access: "You don't have access to generation",

  // Promo codes
  enter_promo_code: "🎟️ Enter your promo code or type /cancel to cancel",
  invalid_promo_code:
    "🎟️ Please enter a valid promo code or type /cancel to cancel",
  promo_code_update_error: "❌ Error updating promo code",
  promo_code_updated: "✅ Promo code successfully updated: {code}",

  // Languages
  language_changed: "🌐 Language changed to English",
  select_language: "🌐 Select language:",

  // Units
  cm: "cm",
  kg: "kg",
  g: "g",
  kcal: "kcal",
} as const;
