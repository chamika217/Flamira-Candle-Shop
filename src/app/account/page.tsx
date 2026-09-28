"use client";

import { useState, useEffect, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCustomerAuth } from "@/context/CustomerAuthContext";
import {
  logoutCustomer, updateCustomerProfile,
  getOrdersByCustomerPhone,
} from "@/lib/customerAuthService";
import type { CustomerAddress, CustomerProfile, Order, OrderStatus } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}
function formatDate(ts: { toDate: () => Date } | undefined): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-LK", { day: "numeric", month: "short", year: "numeric" });
}

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Pending", confirmed: "Confirmed", processing: "Processing",
  ready_to_dispatch: "Ready", dispatched: "Dispatched", delivered: "Delivered",
  completed: "Completed", cancelled: "Cancelled", failed_delivery: "Failed Delivery",
};
const STATUS_BADGE: Record<OrderStatus, string> = {
  pending: "bg-gray-100 text-gray-600", confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-blue-100 text-blue-700", ready_to_dispatch: "bg-blue-100 text-blue-700",
  dispatched: "bg-purple-100 text-purple-700", delivered: "bg-teal-100 text-teal-700",
  completed: "bg-emerald-100 text-emerald-700", cancelled: "bg-red-100 text-red-600",
  failed_delivery: "bg-red-100 text-red-600",
};

const SL_DISTRICTS = [
  "Ampara","Anuradhapura","Badulla","Batticaloa","Colombo","Galle","Gampaha",
  "Hambantota","Jaffna","Kalutara","Kandy","Kegalle","Kilinochchi","Kurunegala",
  "Mannar","Matale","Matara","Monaragala","Mullaitivu","Nuwara Eliya",
  "Polonnaruwa","Puttalam","Ratnapura","Trincomalee","Vavuniya",
] as const;

const inputCls = "w-full rounded-lg border border-brand-border bg-brand-white px-3 py-2.5 text-sm text-brand-brown placeholder:text-brand-muted focus:outline-none focus:border-brand-terracotta transition-colors";

// ---------------------------------------------------------------------------
// Profile edit section
// ---------------------------------------------------------------------------
function ProfileSection({ profile, uid }: { profile: CustomerProfile; uid: string }) {
  const [name, setName]   = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [error, setError]   = useState<string | null>(null);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await updateCustomerProfile(uid, { name: name.trim(), phone: phone.trim() });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
    } catch {
      setError("Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="bg-brand-white rounded-2xl border border-brand-border p-5 sm:p-6 flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold text-brand-brown">Profile</h2>
      {error && <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-brand-stone mb-1.5">Full Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-stone mb-1.5">Email</label>
          <input type="email" value={profile.email} disabled className={`${inputCls} opacity-60 cursor-not-allowed`} />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-stone mb-1.5">Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving}
            className={`px-6 py-2.5 rounded-full text-sm font-medium transition-colors ${saved ? "bg-emerald-600 text-brand-white" : "bg-brand-terracotta text-brand-white hover:bg-brand-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed"}`}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Addresses section
// ---------------------------------------------------------------------------
const EMPTY_ADDR: CustomerAddress = { line1: "", city: "", district: "", postalCode: "", label: "" };

function AddressesSection({ profile, uid }: { profile: CustomerProfile; uid: string }) {
  const [addresses, setAddresses] = useState<CustomerAddress[]>(profile.addresses);
  const [editing, setEditing]     = useState<number | null>(null); // index, -1 = new
  const [form, setForm]           = useState<CustomerAddress>(EMPTY_ADDR);
  const [saving, setSaving]       = useState(false);

  async function save(next: CustomerAddress[]) {
    setSaving(true);
    try {
      await updateCustomerProfile(uid, { addresses: next });
      setAddresses(next);
    } finally {
      setSaving(false);
      setEditing(null);
    }
  }

  function startEdit(i: number) {
    setForm(i === -1 ? EMPTY_ADDR : { ...addresses[i] });
    setEditing(i);
  }

  function handleFormSave() {
    if (!form.line1.trim() || !form.city.trim() || !form.district) return;
    const next = editing === -1
      ? [...addresses, form]
      : addresses.map((a, i) => (i === editing ? form : a));
    save(next);
  }

  function handleRemove(i: number) {
    save(addresses.filter((_, idx) => idx !== i));
  }

  return (
    <div className="bg-brand-white rounded-2xl border border-brand-border p-5 sm:p-6 flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-lg font-semibold text-brand-brown">Saved Addresses</h2>
        <button type="button" onClick={() => startEdit(-1)}
          className="text-sm text-brand-terracotta hover:text-brand-terracotta-dark underline underline-offset-2 transition-colors">
          + Add address
        </button>
      </div>

      {addresses.length === 0 && editing === null && (
        <p className="text-sm text-brand-muted">No saved addresses yet.</p>
      )}

      <ul className="flex flex-col gap-3">
        {addresses.map((addr, i) => (
          <li key={i} className="border border-brand-border rounded-xl px-4 py-3 flex items-start justify-between gap-4">
            <div>
              {addr.label && <p className="text-xs font-semibold text-brand-terracotta mb-0.5">{addr.label}</p>}
              <p className="text-sm text-brand-brown">{addr.line1}</p>
              <p className="text-sm text-brand-stone">{addr.city}, {addr.district}{addr.postalCode ? ` ${addr.postalCode}` : ""}</p>
            </div>
            <div className="flex gap-3 shrink-0">
              <button type="button" onClick={() => startEdit(i)}
                className="text-xs text-brand-stone hover:text-brand-brown underline underline-offset-2 transition-colors">Edit</button>
              <button type="button" onClick={() => handleRemove(i)}
                className="text-xs text-red-500 hover:text-red-700 underline underline-offset-2 transition-colors">Remove</button>
            </div>
          </li>
        ))}
      </ul>

      {editing !== null && (
        <div className="border border-brand-terracotta/30 rounded-xl p-4 flex flex-col gap-3 bg-brand-ivory">
          <p className="text-xs font-semibold text-brand-brown">{editing === -1 ? "New Address" : "Edit Address"}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-brand-stone mb-1">Label (optional)</label>
              <input type="text" value={form.label ?? ""} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                className={inputCls} placeholder="Home, Office…" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs text-brand-stone mb-1">Address Line 1 *</label>
              <input type="text" value={form.line1} onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
                className={inputCls} placeholder="No. 12, Flower Road" />
            </div>
            <div>
              <label className="block text-xs text-brand-stone mb-1">City *</label>
              <input type="text" value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                className={inputCls} placeholder="Colombo" />
            </div>
            <div>
              <label className="block text-xs text-brand-stone mb-1">District *</label>
              <select value={form.district} onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))} className={inputCls}>
                <option value="">Select…</option>
                {SL_DISTRICTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-brand-stone mb-1">Postal Code</label>
              <input type="text" value={form.postalCode ?? ""} onChange={(e) => setForm((f) => ({ ...f, postalCode: e.target.value }))}
                className={inputCls} placeholder="00300" />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleFormSave} disabled={saving}
              className="px-5 py-2 rounded-full bg-brand-terracotta text-brand-white text-sm font-medium hover:bg-brand-terracotta-dark disabled:opacity-60 transition-colors">
              {saving ? "Saving…" : "Save"}
            </button>
            <button type="button" onClick={() => setEditing(null)}
              className="px-5 py-2 rounded-full border border-brand-border text-brand-stone text-sm hover:border-brand-terracotta transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Order history section
// ---------------------------------------------------------------------------
function OrderHistorySection({ phone }: { phone: string }) {
  const [orders, setOrders]   = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getOrdersByCustomerPhone(phone)
      .then(setOrders)
      .catch((err) => {
        console.warn("Order history fetch failed:", err);
        setOrders([]);
      })
      .finally(() => setLoading(false));
  }, [phone]);

  return (
    <div className="bg-brand-white rounded-2xl border border-brand-border p-5 sm:p-6 flex flex-col gap-4">
      <h2 className="font-serif text-lg font-semibold text-brand-brown">Order History</h2>
      {loading ? (
        <div className="flex justify-center py-6">
          <div className="w-6 h-6 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-sm text-brand-muted">No orders yet. <Link href="/shop" className="text-brand-terracotta underline underline-offset-2">Browse the shop</Link></p>
      ) : (
        <ul className="flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/order/${order.orderNumber}`}
                className="block border border-brand-border rounded-xl p-4 hover:border-brand-terracotta transition-colors">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="font-mono font-semibold text-sm text-brand-brown">{order.orderNumber}</p>
                    <p className="text-xs text-brand-muted mt-0.5">{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${STATUS_BADGE[order.orderStatus]}`}>
                      {STATUS_LABELS[order.orderStatus]}
                    </span>
                    <span className="text-sm font-semibold text-brand-terracotta">{formatPrice(order.total)}</span>
                  </div>
                </div>
                <ul className="mt-2 flex flex-col gap-0.5">
                  {order.items.slice(0, 3).map((item, i) => (
                    <li key={i} className="text-xs text-brand-stone">{item.title} × {item.qty}</li>
                  ))}
                  {order.items.length > 3 && (
                    <li className="text-xs text-brand-muted">+{order.items.length - 3} more items</li>
                  )}
                </ul>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function AccountPage() {
  const { user, profile, loading } = useCustomerAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/account/login");
  }, [loading, user, router]);

  async function handleLogout() {
    await logoutCustomer();
    router.replace("/");
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-brand-cream flex items-center justify-center">
        <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="font-serif text-3xl font-semibold text-brand-brown">
              {profile ? `Hello, ${profile.name.split(" ")[0]}` : "My Account"}
            </h1>
            <p className="text-brand-stone text-sm mt-1">{user.email}</p>
          </div>
          <button type="button" onClick={handleLogout}
            className="text-sm text-brand-stone hover:text-red-600 underline underline-offset-2 transition-colors">
            Sign Out
          </button>
        </div>

        <div className="flex flex-col gap-6">
          {profile ? (
            <>
              <ProfileSection profile={profile} uid={user.uid} />
              <AddressesSection profile={profile} uid={user.uid} />
              <OrderHistorySection phone={profile.phone} />
            </>
          ) : (
            <div className="bg-brand-white rounded-2xl border border-brand-border p-8 text-center">
              <p className="text-brand-stone text-sm">Profile data not found for this account.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
