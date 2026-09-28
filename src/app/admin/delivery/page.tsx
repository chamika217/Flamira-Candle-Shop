"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { getSettings, updateSettings } from "@/lib/settingsService";
import type { Settings, DeliveryRate } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const inputCls =
  "rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-brand-terracotta transition-colors";

// ---------------------------------------------------------------------------
// Zero-fee confirmation dialog
// ---------------------------------------------------------------------------
function ZeroFeeDialog({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full flex flex-col gap-4">
        <h2 className="text-base font-semibold text-gray-900">Zero delivery fee?</h2>
        <p className="text-sm text-gray-500">
          One or more districts have a fee of <strong>Rs. 0</strong>. This is
          unusual — are you sure you want to save these rates?
        </p>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors">
            Review
          </button>
          <button type="button" onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-brand-terracotta hover:bg-brand-terracotta-dark transition-colors">
            Save Anyway
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminDeliveryPage() {
  const { isStaffOnly } = useAdminAuth();
  const router = useRouter();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [saved, setSaved]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [showZeroDialog, setShowZeroDialog] = useState(false);

  const [rates, setRates]             = useState<DeliveryRate[]>([]);
  const [threshold, setThreshold]     = useState("");
  const [paused, setPaused]           = useState(false);

  // Staff guard
  useEffect(() => {
    if (isStaffOnly) router.replace("/admin/dashboard");
  }, [isStaffOnly, router]);

  useEffect(() => {
    getSettings()
      .then((s: Settings) => {
        setRates(s.deliveryRates);
        setThreshold(s.freeDeliveryThreshold !== undefined ? String(s.freeDeliveryThreshold) : "");
        setPaused(s.deliveryPaused ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (isStaffOnly) return null;

  function updateRate(district: string, field: "fee" | "estimatedDays", value: string) {
    setRates((prev) =>
      prev.map((r) =>
        r.district === district
          ? { ...r, [field]: field === "fee" ? parseFloat(value) || 0 : parseInt(value) || 1 }
          : r
      )
    );
  }

  function doSave() {
    setSaving(true);
    setSaveError(null);
    setShowZeroDialog(false);

    const data: Partial<Settings> = {
      deliveryRates: rates,
      freeDeliveryThreshold: threshold !== "" ? parseFloat(threshold) : undefined,
      deliveryPaused: paused,
    };

    updateSettings(data)
      .then(() => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      })
      .catch((err: unknown) => {
        setSaveError(err instanceof Error ? err.message : "Save failed.");
      })
      .finally(() => setSaving(false));
  }

  function handleSave() {
    const hasZero = rates.some((r) => r.fee === 0);
    if (hasZero) {
      setShowZeroDialog(true);
    } else {
      doSave();
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Delivery & Shipping</h1>
        <p className="text-sm text-gray-400 mt-0.5">Set delivery fees and estimated days per district.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          {/* ---- Global settings ---- */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col gap-5">
            <h2 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">
              Global Settings
            </h2>

            {/* Pause toggle */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-800">Pause All Deliveries</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Temporarily stops customers from placing new orders. A notice
                  is shown on the checkout page while this is on.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={paused}
                onClick={() => setPaused((v) => !v)}
                className={[
                  "relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
                  paused ? "bg-red-500" : "bg-gray-200",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform duration-200",
                    paused ? "translate-x-5" : "translate-x-0",
                  ].join(" ")}
                />
              </button>
            </div>

            {paused && (
              <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                ⚠ Deliveries are currently paused. The checkout page will display a
                notice and the "Place Order" button will be disabled.
              </div>
            )}

            {/* Free delivery threshold */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                Free Delivery Threshold (Rs.) — optional
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  step={50}
                  value={threshold}
                  onChange={(e) => setThreshold(e.target.value)}
                  placeholder="Leave blank to disable"
                  className={`${inputCls} w-52`}
                />
                {threshold !== "" && (
                  <button type="button" onClick={() => setThreshold("")}
                    className="text-xs text-gray-400 hover:text-gray-600 underline transition-colors">
                    Clear
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400">
                Orders with a subtotal ≥ this amount get free delivery regardless of district.
              </p>
            </div>
          </div>

          {/* ---- District rates table ---- */}
          <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-700">District Delivery Rates</h2>
              <p className="text-xs text-gray-400 mt-0.5">Edit inline — changes are saved when you click "Save Changes".</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-5 py-3 font-semibold">District</th>
                    <th className="text-left px-5 py-3 font-semibold">Fee (Rs.)</th>
                    <th className="text-left px-5 py-3 font-semibold">Est. Days</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rates.map((rate) => (
                    <tr key={rate.district} className="hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-2.5 text-gray-700 font-medium">{rate.district}</td>
                      <td className="px-5 py-2">
                        <input
                          type="number"
                          min={0}
                          step={50}
                          value={rate.fee}
                          onChange={(e) => updateRate(rate.district, "fee", e.target.value)}
                          className={`${inputCls} w-28 ${rate.fee === 0 ? "border-amber-400 bg-amber-50" : ""}`}
                        />
                      </td>
                      <td className="px-5 py-2">
                        <input
                          type="number"
                          min={1}
                          step={1}
                          value={rate.estimatedDays}
                          onChange={(e) => updateRate(rate.district, "estimatedDays", e.target.value)}
                          className={`${inputCls} w-20`}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---- Save ---- */}
          <div className="flex items-center gap-4 pb-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className={[
                "px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
                saved
                  ? "bg-emerald-600 text-white"
                  : "bg-brand-terracotta text-white hover:bg-brand-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed",
              ].join(" ")}
            >
              {saving ? "Saving…" : saved ? "Saved ✓" : "Save Changes"}
            </button>
            {saveError && <p className="text-sm text-red-600">{saveError}</p>}
          </div>
        </>
      )}

      {showZeroDialog && (
        <ZeroFeeDialog onConfirm={doSave} onCancel={() => setShowZeroDialog(false)} />
      )}
    </div>
  );
}
