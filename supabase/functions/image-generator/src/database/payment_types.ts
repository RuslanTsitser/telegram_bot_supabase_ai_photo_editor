export interface SuccessfulPayment {
  invoice_payload: string;
  telegram_payment_charge_id: string;
  total_amount: number;
  currency: string;
  provider_payment_charge_id: string;
}
export interface ProcessPaymentResult {
  success: boolean;
  error?: string;
  planName?: string;
  message?: string;
}
