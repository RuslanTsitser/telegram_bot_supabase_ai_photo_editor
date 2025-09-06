import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SubscriptionPlan } from "./db_types.ts";

// Функция для получения тарифного плана по ID
export async function getSubscriptionPlan(
  supabase: SupabaseClient,
  planId: string,
): Promise<SubscriptionPlan | null> {
  const { data: plan, error } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("id", planId)
    .single();

  if (error || !plan) {
    return null;
  }

  return plan;
}
