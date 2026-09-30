"use client";

import { useState, useEffect, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { createOrder } from "@/lib/orderService";
import { getCouponByCode } from "@/lib/couponService";
import { getSettings, getDeliveryFeeForDistrict, DEFAULT_SETTINGS } from "@/lib/settingsService";
import { trackInitiateCheckout } from "@/lib/pixels";
import { sendOrderConfirmationEmail } from "@/lib/sendOrderEmail";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import { updateCustomerProfile } from "@/lib/customerAuthService";
import type { OrderItem, Settings, Coupon } from "@/lib/types";

// ---------------------------------------------------------------------------
// Coupon error prefix — must match orderService.ts
// ---------------------------------------------------------------------------
const COUPON_ERROR_PREFIX = "COUPON_INVALID:";

// ---------------------------------------------------------------------------
// Districts (ordered alphabetically)
// ---------------------------------------------------------------------------

const SL_DISTRICTS = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
] as const;

// ---------------------------------------------------------------------------
// Form state types
// ---------------------------------------------------------------------------

interface FormValues {
  name: string;
  phone: string;
  whatsapp: string;
  sameAsPhone: boolean;
  email: string;
  line1: string;
  city: string;
  district: string;
  postalCode: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  phone?: string;
  line1?: string;
  city?: string;
  district?: string;
}

const INITIAL_VALUES: FormValues = {
  name: "",
  phone: "",
  whatsapp: "",
  sameAsPhone: false,
  email: "",
  line1: "",
  city: "",
  district: "",
  postalCode: "",
  notes: "",
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

function validate(v: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!v.name.trim())  errors.name     = "Name is required.";
  if (!v.phone.trim()) errors.phone    = "Phone number is required.";
  if (!v.line1.trim()) errors.line1    = "Address is required.";
  if (!v.city.trim())  errors.city     = "City is required.";
  if (!v.district)     errors.district = "Please select a district.";
  return errors;
}

/** Compute discount amount from a coupon and subtotal. */
function computeDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.type === "percentage") {
    return Math.min(subtotal, (subtotal * coupon.value) / 100);
  }
  return Math.min(subtotal, coupon.value);
}

// ---------------------------------------------------------------------------
// Reusable field component
// ---------------------------------------------------------------------------

function Field({
  label, required, error, children,
}: {
  label: string; required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-brand-brown">
        {label}
        {required && <span className="text-brand-terracotta ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-600" role="alert">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-lg border border-brand-border bg-brand-white px-3 py-2.5 text-sm text-brand-brown placeholder:text-brand-muted focus:outline-none focus:border-brand-terracotta transition-colors";
const errorInputClass =
  "w-full rounded-lg border border-red-400 bg-brand-white px-3 py-2.5 text-sm text-brand-brown placeholder:text-brand-muted focus:outline-none focus:border-red-500 transition-colors";

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, clearCart, cartHydrated } = useCart();

  const [settings, setSettings]             = useState<Settings>(DEFAULT_SETTINGS);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const [values, setValues]           = useState<FormValues>(INITIAL_VALUES);
  const [errors, setErrors]           = useState<FormErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [hydrated, setHydrated]       = useState(false);

  // Customer auth — for pre-fill and post-order phone sync
  const { user, profile: customerProfile } = useCustomerAuth();

  // Coupon state
  const [couponInput, setCouponInput]   = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [couponError, setCouponError]   = useState<string | null>(null);
  const [couponLoading, setCouponLoading] = useState(false);

  // Load settings once on mount
  useEffect(() => {
    getSettings()
      .then(setSettings)
      .catch(() => setSettings(DEFAULT_SETTINGS))
      .finally(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => setHydrated(true), []);
  useEffect(() => {
    if (hydrated && cartHydrated && items.length === 0) router.replace("/cart");
  }, [hydrated, cartHydrated, items.length, router]);

  // Issue 5: Redirect to login if not signed in, preserving cart
  const { loading: authLoading } = useCustomerAuth();
  useEffect(() => {
    if (hydrated && !authLoading && !user) {
      router.replace("/account/login?redirect=/checkout");
    }
  }, [hydrated, authLoading, user, router]);

  // Pre-fill form from customer profile when available
  useEffect(() => {
    if (!customerProfile) return;
    setValues((prev) => ({
      ...prev,
      name:  prev.name  || customerProfile.name,
      phone: prev.phone || customerProfile.phone,
      email: prev.email || customerProfile.email,
    }));
  // Run once when the profile loads — deps intentionally limited
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerProfile?.uid]);

  // Fire InitiateCheckout once when the page first becomes visible with items
  useEffect(() => {
    if (hydrated && items.length > 0) {
      trackInitiateCheckout(subtotal, items.reduce((s, i) => s + i.qty, 0));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated]);

  // ---- Derived delivery fee ----
  const rawDistrictFee = settingsLoaded
    ? getDeliveryFeeForDistrict(settings, values.district)
    : 350;

  const isSettingsFreeDelivery =
    settings.freeDeliveryThreshold !== undefined &&
    subtotal >= settings.freeDeliveryThreshold;

  const isCouponFreeDelivery = appliedCoupon?.freeDelivery === true;

  // Delivery is free if settings threshold met OR coupon grants it
  const deliveryFee =
    isSettingsFreeDelivery || isCouponFreeDelivery ? 0 : rawDistrictFee;

  const discount = appliedCoupon ? computeDiscount(appliedCoupon, subtotal) : 0;
  const total    = subtotal + deliveryFee - discount;

  // ---- Coupon: Apply ----
  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    setCouponError(null);
    setCouponLoading(true);
    try {
      const coupon = await getCouponByCode(code);
      if (!coupon) {
        setCouponError("Invalid or expired coupon code.");
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }
      if (coupon.minOrderValue !== undefined && subtotal < coupon.minOrderValue) {
        setCouponError(
          `Minimum order of ${formatPrice(coupon.minOrderValue)} required for this coupon.`
        );
        setAppliedCoupon(null);
        setCouponLoading(false);
        return;
      }
      setAppliedCoupon(coupon);
      setCouponInput("");
    } catch {
      setCouponError("Could not validate coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
    setCouponInput("");
  }

  // ---- Form change handler ----
  function handleChange(
    e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) {
    const target = e.target;
    const key = target.name as keyof FormValues;

    if (target instanceof HTMLInputElement && target.type === "checkbox") {
      const checked = target.checked;
      setValues((prev) => ({
        ...prev, sameAsPhone: checked,
        whatsapp: checked ? prev.phone : prev.whatsapp,
      }));
      return;
    }

    setValues((prev) => {
      const updated = { ...prev, [key]: target.value };
      if (key === "phone" && prev.sameAsPhone) updated.whatsapp = target.value;
      return updated;
    });

    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  // ---- Submit ----
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (settings.deliveryPaused) return;
    setSubmitError(null);

    const validationErrors = validate(values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstField = document.querySelector("[aria-invalid='true']");
      (firstField as HTMLElement | null)?.focus();
      return;
    }

    setLoading(true);

    const orderItems: OrderItem[] = items.map((item) => ({
      productId: item.productId,
      sku:       item.productId,
      title:     item.title,
      price:     item.price,
      qty:       item.qty,
    }));

    try {
      const order = await createOrder({
        items: orderItems,
        customer: {
          name:     values.name.trim(),
          phone:    values.phone.trim(),
          ...(values.whatsapp.trim() ? { whatsapp: values.whatsapp.trim() } : {}),
          ...(values.email.trim()    ? { email:    values.email.trim()    } : {}),
        },
        address: {
          line1:    values.line1.trim(),
          city:     values.city.trim(),
          district: values.district,
          ...(values.postalCode.trim() ? { postalCode: values.postalCode.trim() } : {}),
        },
        subtotal,
        deliveryFee,
        discount,
        total,
        paymentMethod: "cod",
        orderStatus:   "pending",
        ...(values.notes.trim() ? { notes: values.notes.trim() } : {}),
        // Pass coupon code so orderService can re-validate + increment usedCount
        couponCode:    appliedCoupon?.code,
      });

      sendOrderConfirmationEmail(order); // fire-and-forget

      // Sync phone to customer profile if logged in and phone differs
      if (user && customerProfile && values.phone.trim() !== customerProfile.phone) {
        updateCustomerProfile(user.uid, { phone: values.phone.trim() }).catch(() => {});
      }

      // Clear cart first, then navigate to confirmation
      clearCart();
      router.push(`/order/${order.orderNumber}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";

      // Coupon-specific error: clear the applied coupon so the user can retry
      if (msg.startsWith(COUPON_ERROR_PREFIX)) {
        setAppliedCoupon(null);
        setCouponInput("");
        setSubmitError(
          msg.replace(COUPON_ERROR_PREFIX, "").trim() +
          " Your coupon has been removed — please review your order and resubmit."
        );
      } else {
        setSubmitError(msg);
      }

      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  if (!hydrated || authLoading) return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center">
      <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-brand-brown mb-8">
          Checkout
        </h1>

        {/* Delivery paused notice */}
        {settings.deliveryPaused && (
          <div role="alert"
            className="mb-6 rounded-xl border border-amber-300 bg-amber-50 px-4 py-4 text-sm text-amber-800 font-medium">
            🚚 We&apos;re temporarily not accepting new orders — please check back soon.
          </div>
        )}

        {/* Global submission error */}
        {submitError && (
          <div role="alert"
            className="mb-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {submitError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* ================================================================
                LEFT — delivery details form
                ================================================================ */}
            <div className="flex-1 min-w-0 flex flex-col gap-6">

              {/* Customer info */}
              <section className="bg-brand-white rounded-2xl border border-brand-border p-5 sm:p-6">
                <h2 className="font-serif text-lg font-semibold text-brand-brown mb-5">
                  Contact Details
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label="Full Name" required error={errors.name}>
                    <input name="name" type="text" autoComplete="name"
                      value={values.name} onChange={handleChange}
                      className={errors.name ? errorInputClass : inputClass}
                      aria-invalid={!!errors.name} placeholder="Amaya Perera" />
                  </Field>

                  <Field label="Phone" required error={errors.phone}>
                    <input name="phone" type="tel" autoComplete="tel"
                      value={values.phone} onChange={handleChange}
                      className={errors.phone ? errorInputClass : inputClass}
                      aria-invalid={!!errors.phone} placeholder="07X XXX XXXX" />
                  </Field>

                  <Field label="WhatsApp Number">
                    <input name="whatsapp" type="tel"
                      value={values.whatsapp} onChange={handleChange}
                      disabled={values.sameAsPhone}
                      className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                      placeholder="07X XXX XXXX" />
                    <label className="flex items-center gap-2 mt-1.5 cursor-pointer">
                      <input name="sameAsPhone" type="checkbox"
                        checked={values.sameAsPhone} onChange={handleChange}
                        className="w-3.5 h-3.5 accent-brand-terracotta" />
                      <span className="text-xs text-brand-stone">Same as phone</span>
                    </label>
                  </Field>

                  <Field label="Email (optional)">
                    <input name="email" type="email" autoComplete="email"
                      value={values.email} onChange={handleChange}
                      className={inputClass} placeholder="you@example.com" />
                  </Field>
                </div>
              </section>

              {/* Delivery address */}
              <section className="bg-brand-white rounded-2xl border border-brand-border p-5 sm:p-6">
                <h2 className="font-serif text-lg font-semibold text-brand-brown mb-5">
                  Delivery Address
                </h2>

                {/* Saved address picker — only shown for logged-in customers */}
                {customerProfile && customerProfile.addresses.length > 0 && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-brand-brown mb-1.5">
                      Use a saved address
                    </label>
                    <select
                      className={inputClass}
                      onChange={(e) => {
                        const idx = parseInt(e.target.value);
                        if (isNaN(idx)) return;
                        const addr = customerProfile.addresses[idx];
                        setValues((prev) => ({
                          ...prev,
                          line1:     addr.line1,
                          city:      addr.city,
                          district:  addr.district,
                          postalCode: addr.postalCode ?? "",
                        }));
                      }}
                      defaultValue=""
                    >
                      <option value="">— select —</option>
                      {customerProfile.addresses.map((addr, i) => (
                        <option key={i} value={i}>
                          {addr.label ? `${addr.label}: ` : ""}{addr.line1}, {addr.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <Field label="Address Line 1" required error={errors.line1}>
                      <input name="line1" type="text" autoComplete="street-address"
                        value={values.line1} onChange={handleChange}
                        className={errors.line1 ? errorInputClass : inputClass}
                        aria-invalid={!!errors.line1} placeholder="No. 12, Flower Road" />
                    </Field>
                  </div>

                  <Field label="City" required error={errors.city}>
                    <input name="city" type="text" autoComplete="address-level2"
                      value={values.city} onChange={handleChange}
                      className={errors.city ? errorInputClass : inputClass}
                      aria-invalid={!!errors.city} placeholder="Colombo" />
                  </Field>

                  <Field label="District" required error={errors.district}>
                    <select name="district" value={values.district} onChange={handleChange}
                      className={errors.district ? errorInputClass : inputClass}
                      aria-invalid={!!errors.district}>
                      <option value="">Select district…</option>
                      {SL_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </Field>

                  <Field label="Postal Code (optional)">
                    <input name="postalCode" type="text" autoComplete="postal-code"
                      value={values.postalCode} onChange={handleChange}
                      className={inputClass} placeholder="00300" />
                  </Field>
                </div>
              </section>

              {/* Gift note */}
              <section className="bg-brand-white rounded-2xl border border-brand-border p-5 sm:p-6">
                <h2 className="font-serif text-lg font-semibold text-brand-brown mb-5">
                  Gift Note{" "}
                  <span className="text-sm font-normal text-brand-muted">(optional)</span>
                </h2>
                <textarea name="notes" value={values.notes} onChange={handleChange}
                  rows={3} maxLength={500}
                  className={`${inputClass} resize-none`}
                  placeholder="Add a personalised message for the recipient…" />
              </section>

              {/* Payment method */}
              <section className="bg-brand-white rounded-2xl border border-brand-border p-5 sm:p-6">
                <h2 className="font-serif text-lg font-semibold text-brand-brown mb-3">
                  Payment Method
                </h2>
                <div className="flex items-center gap-3 rounded-xl border-2 border-brand-terracotta bg-brand-ivory px-4 py-3">
                  <div className="w-4 h-4 rounded-full border-2 border-brand-terracotta flex items-center justify-center shrink-0">
                    <div className="w-2 h-2 rounded-full bg-brand-terracotta" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-brown">Cash on Delivery</p>
                    <p className="text-xs text-brand-stone mt-0.5">
                      Pay when your order arrives. Our team will call to confirm.
                    </p>
                  </div>
                </div>
              </section>
            </div>

            {/* ================================================================
                RIGHT — order summary
                ================================================================ */}
            <div className="w-full lg:w-80 shrink-0 flex flex-col gap-4 sticky top-20">
              <div className="bg-brand-white rounded-2xl border border-brand-border p-5 sm:p-6">
                <h2 className="font-serif text-lg font-semibold text-brand-brown mb-4">
                  Order Summary
                </h2>

                {/* Item list */}
                <ul className="flex flex-col gap-3 mb-4">
                  {items.map((item) => (
                    <li key={item.productId} className="flex items-center justify-between gap-3 text-sm">
                      <span className="text-brand-stone line-clamp-2 leading-snug flex-1">
                        {item.title}
                        <span className="text-brand-muted ml-1">× {item.qty}</span>
                      </span>
                      <span className="text-brand-brown font-medium shrink-0">
                        {formatPrice(item.price * item.qty)}
                      </span>
                    </li>
                  ))}
                </ul>

                {/* ---- Coupon input ---- */}
                <div className="border-t border-brand-border pt-4 mb-4">
                  {appliedCoupon ? (
                    // Applied state
                    <div className="flex items-center justify-between gap-2 rounded-lg bg-emerald-50 border border-emerald-200 px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-600 text-sm">✓</span>
                        <div>
                          <p className="text-xs font-semibold text-emerald-700">
                            Coupon applied: {appliedCoupon.code}
                          </p>
                          <p className="text-[11px] text-emerald-600 mt-0.5">
                            {appliedCoupon.type === "percentage"
                              ? `${appliedCoupon.value}% off`
                              : `Rs. ${appliedCoupon.value.toLocaleString("en-LK")} off`}
                            {appliedCoupon.freeDelivery ? " + Free delivery" : ""}
                          </p>
                        </div>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon}
                        className="text-[11px] text-emerald-600 hover:text-emerald-800 underline underline-offset-2 transition-colors shrink-0">
                        Remove
                      </button>
                    </div>
                  ) : (
                    // Input state
                    <div className="flex flex-col gap-1.5">
                      <p className="text-xs text-brand-stone font-medium">Have a coupon code?</p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(null); }}
                          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleApplyCoupon(); } }}
                          placeholder="Enter code"
                          className="flex-1 rounded-lg border border-brand-border bg-brand-white px-3 py-2 text-sm text-brand-brown placeholder:text-brand-muted focus:outline-none focus:border-brand-terracotta transition-colors uppercase"
                        />
                        <button
                          type="button"
                          onClick={handleApplyCoupon}
                          disabled={couponLoading || !couponInput.trim()}
                          className="px-3 py-2 rounded-lg border border-brand-terracotta text-brand-terracotta text-xs font-semibold hover:bg-brand-terracotta hover:text-brand-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {couponLoading ? "…" : "Apply"}
                        </button>
                      </div>
                      {couponError && (
                        <p className="text-xs text-red-600" role="alert">{couponError}</p>
                      )}
                    </div>
                  )}
                </div>

                {/* Price breakdown */}
                <div className="flex flex-col gap-2.5 text-sm border-t border-brand-border pt-4">
                  <div className="flex justify-between text-brand-stone">
                    <span>Subtotal</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>

                  {/* Discount line — shown only when coupon applied */}
                  {discount > 0 && (
                    <div className="flex justify-between text-emerald-600">
                      <span>Discount ({appliedCoupon!.code})</span>
                      <span>− {formatPrice(discount)}</span>
                    </div>
                  )}

                  {/* Delivery */}
                  <div className="flex justify-between text-brand-stone">
                    <span>
                      Delivery
                      {values.district && (
                        <span className="text-xs text-brand-muted ml-1">({values.district})</span>
                      )}
                    </span>
                    {deliveryFee === 0 ? (
                      <span className="text-emerald-600 font-semibold">FREE</span>
                    ) : (
                      <span>
                        {values.district
                          ? formatPrice(deliveryFee)
                          : <span className="text-brand-muted text-xs">Select district</span>
                        }
                      </span>
                    )}
                  </div>

                  {/* Free delivery explanations */}
                  {isSettingsFreeDelivery && (
                    <p className="text-xs text-emerald-600">
                      🎉 Free delivery on orders over {formatPrice(settings.freeDeliveryThreshold!)}
                    </p>
                  )}
                  {isCouponFreeDelivery && !isSettingsFreeDelivery && (
                    <p className="text-xs text-emerald-600">
                      🎉 Free delivery with coupon {appliedCoupon!.code}
                    </p>
                  )}

                  <div className="flex justify-between font-semibold text-brand-brown border-t border-brand-border pt-2.5 mt-1 text-base">
                    <span>Total</span>
                    <span className="text-brand-terracotta">{formatPrice(total)}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || settings.deliveryPaused}
                className="w-full px-6 py-3.5 rounded-full bg-brand-terracotta text-brand-white font-medium text-sm hover:bg-brand-terracotta-dark active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? "Placing Order…"
                  : settings.deliveryPaused ? "Orders Paused"
                  : "Place Order"}
              </button>

              <Link href="/cart"
                className="block w-full text-center text-xs text-brand-muted hover:text-brand-stone transition-colors">
                ← Back to Cart
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
