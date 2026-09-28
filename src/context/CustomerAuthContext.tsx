"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { getCustomerProfile } from "@/lib/customerAuthService";
import type { CustomerProfile } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CustomerAuthContextValue {
  user:    User | null;
  profile: CustomerProfile | null;
  /** true until the initial onAuthStateChanged fires and profile is fetched */
  loading: boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

/**
 * Listens to the same Firebase `auth` instance as AdminAuthContext.
 * Multiple `onAuthStateChanged` listeners on the same auth instance are
 * fully supported by the Firebase SDK — they fire independently and do NOT
 * interfere with each other.
 *
 * The customer-vs-admin distinction is purely at the Firestore document level:
 *  - customers live in `customers/{uid}`
 *  - admins live in `admins/{uid}`
 * A customer will have no `admins/{uid}` document, so AdminAuthContext will
 * produce `adminProfile: null` for them (the "Access Denied" state).
 */
export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const p = await getCustomerProfile(firebaseUser.uid).catch(() => null);
        setProfile(p);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = useMemo<CustomerAuthContextValue>(
    () => ({ user, profile, loading }),
    [user, profile, loading]
  );

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useCustomerAuth(): CustomerAuthContextValue {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used inside <CustomerAuthProvider>");
  return ctx;
}
