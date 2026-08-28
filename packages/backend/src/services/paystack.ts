const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY || "";
const PAYSTACK_BASE = "https://api.paystack.co";

/**
 * Initialize a Paystack transaction.
 * Returns the authorization_url for redirecting the user.
 */
export async function initializePaystackTransaction(data: {
  email: string;
  amount: number; // in the smallest currency unit (kobo/pesewas)
  reference: string;
  callback_url?: string;
  metadata?: Record<string, unknown>;
}): Promise<{ authorization_url: string; reference: string; access_code: string }> {
  if (!PAYSTACK_SECRET) {
    throw new Error("Paystack is not configured. Please add PAYSTACK_SECRET_KEY to your environment.");
  }

  const response = await fetch(`${PAYSTACK_BASE}/transaction/initialize`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: data.email,
      amount: data.amount,
      reference: data.reference,
      callback_url: data.callback_url,
      metadata: data.metadata,
    }),
  });

  const result: any = await response.json();

  if (!result.status) {
    throw new Error(result.message || "Failed to initialize payment");
  }

  return result.data;
}

/**
 * Verify a Paystack transaction by reference.
 */
export async function verifyPaystackTransaction(reference: string): Promise<{
  status: string;
  amount: number;
  reference: string;
  gateway_response: string;
  paid_at: string;
  channel: string;
}> {
  if (!PAYSTACK_SECRET) {
    throw new Error("Paystack is not configured.");
  }

  const response = await fetch(`${PAYSTACK_BASE}/transaction/verify/${reference}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
    },
  });

  const result: any = await response.json();

  if (!result.status) {
    throw new Error(result.message || "Failed to verify payment");
  }

  return result.data;
}

/**
 * Check if Paystack is configured.
 */
export function isPaystackConfigured(): boolean {
  return !!PAYSTACK_SECRET;
}
