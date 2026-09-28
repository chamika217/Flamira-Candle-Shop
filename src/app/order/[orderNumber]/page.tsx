import { notFound } from "next/navigation";
import Link from "next/link";
import { getOrderByNumber } from "@/lib/orderService";
import type { OrderItem } from "@/lib/types";
import PurchaseTracker from "./PurchaseTracker";
import ReviewSection from "./ReviewSection";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

// ---------------------------------------------------------------------------
// Sub-components (server-renderable — no client state needed)
// ---------------------------------------------------------------------------

function CheckCircleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="56"
      height="56"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-emerald-500"
      aria-hidden="true"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function ItemRow({ item }: { item: OrderItem }) {
  return (
    <li className="flex items-center justify-between gap-4 py-3 border-b border-brand-border last:border-b-0">
      <span className="text-sm text-brand-stone leading-snug flex-1">
        {item.title}
        <span className="text-brand-muted ml-1.5">× {item.qty}</span>
      </span>
      <span className="text-sm font-semibold text-brand-brown shrink-0">
        {formatPrice(item.price * item.qty)}
      </span>
    </li>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function OrderConfirmationPage(
  props: PageProps<"/order/[orderNumber]">
) {
  const { orderNumber } = await props.params;
  const order = await getOrderByNumber(orderNumber);

  if (!order) notFound();

  const total = order.subtotal + order.deliveryFee - order.discount;

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        {/* Success header */}
        <div className="flex flex-col items-center text-center gap-4 mb-10">
          <CheckCircleIcon />
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-brand-brown">
            Order Confirmed!
          </h1>
          <p className="text-brand-stone text-sm sm:text-base max-w-sm">
            Thank you for your order. Our team will call you shortly to confirm
            and arrange delivery.
          </p>
          <div className="inline-block bg-brand-ivory border border-brand-border rounded-full px-5 py-2 text-sm font-semibold text-brand-terracotta tracking-wide">
            {order.orderNumber}
          </div>
        </div>

        {/* Order details card */}
        <div className="bg-brand-white rounded-2xl border border-brand-border divide-y divide-brand-border overflow-hidden">

          {/* Items */}
          <div className="p-5 sm:p-6">
            <h2 className="font-serif text-base font-semibold text-brand-brown mb-2">
              Items
            </h2>
            <ul>
              {order.items.map((item, i) => (
                <ItemRow key={`${item.productId}-${i}`} item={item} />
              ))}
            </ul>
          </div>

          {/* Price summary */}
          <div className="p-5 sm:p-6">
            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-brand-stone">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-brand-stone">
                <span>Delivery</span>
                <span>{formatPrice(order.deliveryFee)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount</span>
                  <span>− {formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between font-semibold text-brand-brown border-t border-brand-border pt-2.5 mt-1 text-base">
                <span>Total</span>
                <span className="text-brand-terracotta">{formatPrice(total)}</span>
              </div>
            </div>
          </div>

          {/* Delivery address */}
          <div className="p-5 sm:p-6">
            <h2 className="font-serif text-base font-semibold text-brand-brown mb-2">
              Delivery Address
            </h2>
            <address className="not-italic text-sm text-brand-stone leading-relaxed">
              <p className="font-medium text-brand-brown">{order.customer.name}</p>
              <p>{order.address.line1}</p>
              <p>
                {order.address.city}, {order.address.district}
                {order.address.postalCode ? ` ${order.address.postalCode}` : ""}
              </p>
              <p className="mt-1">{order.customer.phone}</p>
              {order.customer.email && <p>{order.customer.email}</p>}
            </address>
          </div>

          {/* Payment + estimated delivery */}
          <div className="p-5 sm:p-6 bg-brand-ivory">
            <p className="text-sm text-brand-stone">
              <span className="font-medium text-brand-brown">Payment: </span>
              Cash on Delivery
            </p>
            <p className="text-sm text-brand-stone mt-1.5">
              <span className="font-medium text-brand-brown">Estimated delivery: </span>
              Our team will call you shortly to confirm your order and
              arrange a convenient delivery time.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="mt-8 flex justify-center">
          <Link
            href="/shop"
            className="inline-block px-8 py-3 rounded-full bg-brand-terracotta text-brand-white font-medium text-sm hover:bg-brand-terracotta-dark active:scale-95 transition-all"
          >
            Continue Shopping
          </Link>
        </div>

        {/* Track purchase event once — invisible client component */}
        <PurchaseTracker
          orderNumber={order.orderNumber}
          total={total}
          items={order.items.map((item) => ({ productId: item.productId, qty: item.qty }))}
        />

        {/* Review section */}
        <ReviewSection
          orderNumber={order.orderNumber}
          items={order.items}
          orderStatus={order.orderStatus}
        />
      </div>
    </div>
  );
}
