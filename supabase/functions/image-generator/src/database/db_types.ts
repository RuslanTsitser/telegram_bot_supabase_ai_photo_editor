export interface User {
  id: string;
  telegram_id: number;
  telegram_username?: string;
  telegram_first_name?: string;
  telegram_last_name?: string;
  telegram_photo_url?: string;
  created_at: string;
  updated_at: string;
}

export interface PremiumStatus {
  id: string;
  user_id: string;
  is_premium: boolean;
  premium_expires_at?: string;
  generation_limit: number;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  price: number; // в копейках
  type: "subscription" | "one_time";
  value: number; // количество дней для подписки или количество запросов
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  plan_id: string;
  youkassa_payment_id?: string;
  amount: number; // в копейках
  currency: string;
  status: "pending" | "succeeded" | "canceled" | "failed";
  created_at: string;
  updated_at: string;
}
