import config from "../config/env.js";
import { createHmac } from "crypto";

const PAYMOB_API = "https://accept.paymob.com/v1";

// creates a payment intention on Paymob and returns the checkout URL
export async function createPaymentIntention({
  amountCents,
  currency = "EGP",
  subscriptionId,
  subscriptionType, // "gym" or "coach"
  traineeEmail,
  traineeName,
}) {
  const response = await fetch(`${PAYMOB_API}/intention/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Token ${config.PAYMOB_SECRET_KEY}`,
    },
    body: JSON.stringify({
      amount: amountCents,
      currency,
      payment_methods: [parseInt(config.PAYMOB_INTEGRATION_ID, 10)],
      special_reference: `${subscriptionId.toString()}_${Date.now()}`,
      items: [
        {   
          name: `${subscriptionType} subscription`,
          amount: amountCents,
          description: `FitLink ${subscriptionType} subscription`,
          quantity: 1,
        },
      ],
      billing_data: {
        email: traineeEmail,
        first_name: traineeName.split(" ")[0] || "Trainee",
        last_name: traineeName.split(" ")[1] || "User",
        phone_number: "N/A",
        country: "EG",
        street: "N/A",
        city: "N/A",
        state: "N/A",
      },
      metadata: {
        subscriptionId: subscriptionId.toString(),
        subscriptionType,
      },
      notification_url: `${(process.env.BACKEND_URL || "http://localhost:3000").replace(/\/+$/, "")}/api/payments/webhook`,
      redirection_url: `${(process.env.FRONTEND_URL || "http://localhost:4200").replace(/\/+$/, "")}/payment-result`,
    }),
  });

  const data = await response.json();
  // console.log("[Paymob] status:", response.status);
  // console.log("[Paymob] response:", JSON.stringify(data, null, 2));

  if (!response.ok) {
    const error = new Error("Failed to create Paymob intention");
    error.statusCode = 502;
    error.details = data;
    throw error;
  }

  // --- DEBUG: log the full Paymob response so you can diagnose dashboard issues ---
  // console.log("[Paymob] intention created:", JSON.stringify({
  //   id: data.id,
  //   status: data.status,
  //   payment_methods: data.payment_methods,
  //   payment_keys: data.payment_keys?.map((k) => ({
  //     integration: k.integration,
  //     gateway_type: k.gateway_type,
  //     iframe_id: k.iframe_id,
  //     has_key: !!k.key,
  //   })),
  // }, null, 2));

  // Build checkout URL:
  // • New Paymob (egy_pk_* keys + Card Online integration) → eg.checkout.paymob.com
  // • Legacy / MIGS integrations → accept.paymob.com iframe with payment_key
  let checkoutUrl;

  const firstPaymentMethod = data.payment_methods?.[0];
  const firstPaymentKey = data.payment_keys?.[0];

  const isCardOnline =
    firstPaymentMethod?.method_type === "online" &&
    firstPaymentKey?.gateway_type !== "MIGS";

  if (isCardOnline || !firstPaymentKey?.key) {
    // New unified checkout (requires Card Online integration in Paymob dashboard)
    checkoutUrl = `https://eg.checkout.paymob.com/?public_key=${config.PAYMOB_PUBLIC_KEY}&client_secret=${data.client_secret}`;
  } else {
    // Legacy iframe checkout using payment_key (works with MIGS integrations)
    const iframeId = firstPaymentKey.iframe_id || config.PAYMOB_IFRAME_ID;
    if (!iframeId) {
      throw Object.assign(
        new Error(
          "Paymob checkout cannot be rendered: integration is MIGS type but no iframe_id " +
          "is configured. Go to Paymob Dashboard → Developers → Iframes and add PAYMOB_IFRAME_ID to .env"
        ),
        { statusCode: 500 }
      );
    }
    checkoutUrl = `https://accept.paymob.com/api/acceptance/iframes/${iframeId}?payment_token=${firstPaymentKey.key}`;
  }

  return {
    clientSecret: data.client_secret,
    checkoutUrl,
    paymobOrderId: data.id,
  };
}

// Verifies the HMAC signature Paymob sends in the webhook
export function verifyWebhookHmac(receivedHmac, transactionData) {
  const fields = [
    "amount_cents",
    "created_at",
    "currency",
    "error_occured",
    "has_parent_transaction",
    "id",
    "integration_id",
    "is_3d_secure",
    "is_auth",
    "is_capture",
    "is_refunded",
    "is_standalone_payment",
    "is_voided",
    "order.id",
    "owner",
    "pending",
    "source_data.pan",
    "source_data.sub_type",
    "source_data.type",
    "success",
  ];

  // Build the string Paymob signs
  const str = fields
    .map((field) => {
      if (field.includes(".")) {
        const [parent, child] = field.split(".");
        return transactionData[parent]?.[child] ?? "";
      }
      return transactionData[field] ?? "";
    })
    .join("");

 const computed = createHmac("sha512", config.PAYMOB_HMAC_KEY)
    .update(str)
    .digest("hex");

  return computed === receivedHmac;
}
