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
  onboarding_welcome: "👋 Hello! I'm a photo generation bot.",
  onboarding_description:
    "Send me a photo, add a description and I'll generate a new photo for you",
  onboarding_rules: "Simple rules:",
  onboarding_rule1: "1) Choose any photo from your gallery",
  onboarding_rule2:
    "2) Add a description of what you want to do with this photo",
  onboarding_rule3: "3) Send it to me",
  onboarding_rule4: "4) I'll generate a new photo for you",
  onboarding_examples: "Below are screenshots of generated photo examples",
  onboarding_important: "⚠️ Important:",
  onboarding_tip1:
    "- Describe in as much detail as possible what you want to do with your photo",
  onboarding_tip2:
    "- If you don't add a description, I'll generate a photo in cartoon style",
  onboarding_tip3: "- I can't generate images from description only yet",
  onboarding_tip4:
    "- Sometimes I may have problems with generation. In that case, the attempt won't be counted and you can try again",
  onboarding_initial_generations: "📝 You initially have 2 generations.",
  onboarding_try_buy:
    "Try it, and if you like it, you can buy additional generations.",
  onboarding_subscribe_command:
    "💫 To buy additional generations, press /subscriptions",
  onboarding_limits_command: "🔢 To view available generations, press /limits",

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
