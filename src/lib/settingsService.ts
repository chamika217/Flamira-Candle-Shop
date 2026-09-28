/**
 * settingsService.ts
 * Reads and writes the single `settings/general` Firestore document.
 */

import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Settings, DeliveryRate } from "@/lib/types";

const SETTINGS_DOC = "settings/general";

// All 25 Sri Lankan districts with sensible defaults
const DEFAULT_DISTRICTS: readonly string[] = [
  "Ampara", "Anuradhapura", "Badulla", "Batticaloa", "Colombo",
  "Galle", "Gampaha", "Hambantota", "Jaffna", "Kalutara",
  "Kandy", "Kegalle", "Kilinochchi", "Kurunegala", "Mannar",
  "Matale", "Matara", "Monaragala", "Mullaitivu", "Nuwara Eliya",
  "Polonnaruwa", "Puttalam", "Ratnapura", "Trincomalee", "Vavuniya",
];

export const DEFAULT_DELIVERY_RATES: DeliveryRate[] = DEFAULT_DISTRICTS.map(
  (district) => ({ district, fee: 350, estimatedDays: 3 })
);

export const DEFAULT_SETTINGS: Settings = {
  deliveryRates:          DEFAULT_DELIVERY_RATES,
  freeDeliveryThreshold:  undefined,
  deliveryPaused:         false,
};

/**
 * Reads `settings/general`. If the document doesn't exist yet, returns
 * DEFAULT_SETTINGS in memory without writing to Firestore — the admin must
 * explicitly save to persist the rates.
 *
 * When a saved document exists but is missing some districts (e.g. a new
 * district was added later), the missing ones are back-filled with defaults
 * so the UI always shows all 25 rows.
 */
export async function getSettings(): Promise<Settings> {
  const snap = await getDoc(doc(db, SETTINGS_DOC));

  if (!snap.exists()) return DEFAULT_SETTINGS;

  const data = snap.data() as Partial<Settings>;

  // Back-fill any districts not yet in the saved document
  const savedRates: DeliveryRate[] = data.deliveryRates ?? [];
  const savedMap = new Map(savedRates.map((r) => [r.district, r]));
  const mergedRates = DEFAULT_DELIVERY_RATES.map(
    (def) => savedMap.get(def.district) ?? def
  );

  return {
    deliveryRates:         mergedRates,
    freeDeliveryThreshold: data.freeDeliveryThreshold,
    deliveryPaused:        data.deliveryPaused ?? false,
    bannerImageUrl:        data.bannerImageUrl,
    bannerHeadline:        data.bannerHeadline,
    bannerSubtext:         data.bannerSubtext,
    featuredProductIds:    data.featuredProductIds,
  };
}

/**
 * Writes (or merges) settings into `settings/general`.
 * Using `{ merge: true }` means this safely creates the document on first save.
 */
export async function updateSettings(data: Partial<Settings>): Promise<void> {
  await setDoc(doc(db, SETTINGS_DOC), data, { merge: true });
}

/**
 * Looks up the delivery fee for a given district from a Settings object.
 * Falls back to 350 if the district is not found (should never happen in practice).
 */
export function getDeliveryFeeForDistrict(
  settings: Settings,
  district: string
): number {
  if (!district) return 350;
  return (
    settings.deliveryRates.find((r) => r.district === district)?.fee ?? 350
  );
}
