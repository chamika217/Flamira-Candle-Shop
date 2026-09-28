/**
 * sendOrderEmail.ts
 * Sends an order-confirmation email to the customer via EmailJS.
 *
 * This must NEVER throw — a failed or slow email must never block
 * the checkout redirect. All errors are caught and logged only.
 *
 * Env vars required (set in .env.local):
 *   NEXT_PUBLIC_EMAILJS_SERVICE_ID
 *   NEXT_PUBLIC_EMAILJS_TEMPLATE_ID
 *   NEXT_PUBLIC_EMAILJS_PUBLIC_KEY
 */

import emailjs from "@emailjs/browser";
import type { Order } from "@/lib/types";

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  // No-op if the customer didn't provide an email address
  if (!order.customer.email?.trim()) return;

  const SERVICE_ID  = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
  const TEMPLATE_ID = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
  const PUBLIC_KEY  = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;

  // No-op if any env var is missing (avoids confusing EmailJS errors in dev)
  if (!SERVICE_ID || !TEMPLATE_ID || !PUBLIC_KEY) return;

  // Build a readable delivery address string
  const addr = order.address;
  const deliveryAddress = [
    addr.line1,
    addr.city,
    addr.district,
    addr.postalCode,
  ]
    .filter(Boolean)
    .join(", ");

  // One line per item: "Lavender Candle x2 — Rs. 2,400"
  const itemsText = order.items
    .map(
      (item) =>
        `${item.title} x${item.qty} — Rs. ${(item.price * item.qty).toLocaleString("en-LK")}`
    )
    .join("\n");

  const templateParams: Record<string, string> = {
    customer_name:    order.customer.name,
    customer_email:   order.customer.email,
    customer_phone:   order.customer.phone,
    order_number:     order.orderNumber,
    delivery_address: deliveryAddress,
    items:            itemsText,
    subtotal:         order.subtotal.toLocaleString("en-LK"),
    delivery_fee:     order.deliveryFee.toLocaleString("en-LK"),
    total:            order.total.toLocaleString("en-LK"),
  };

  try {
    await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, {
      publicKey: PUBLIC_KEY,
    });
  } catch (err) {
    // Log but never rethrow — a failed email must never break the checkout flow
    console.error("[EmailJS] Failed to send order confirmation email:", err);
  }
}
