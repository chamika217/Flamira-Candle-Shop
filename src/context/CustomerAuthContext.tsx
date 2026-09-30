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
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import type { CustomerProfile } from "@/lib/types";

interface CustomerAuthContextValue {
  user:    User | null;   // null if not signed in OR if signed in as admin
  profile: CustomerProfile | null;
  loading: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextValue | null>(null);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<User | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, (firebaseUser) => {
      // Unsubscribe previous profile listener if any
      profileUnsub?.();
      profileUnsub = null;

      if (!firebaseUser) {
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      // Subscribe to customers/{uid} with onSnapshot so profile updates are live.
      // If the document doesn't exist (e.g. this is an admin account), profile = null
      // and user = null — admin accounts are invisible to the storefront.
      profileUnsub = onSnapshot(
        doc(db, "customers", firebaseUser.uid),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as Omit<CustomerProfile, "uid">;
            setProfile({ uid: firebaseUser.uid, ...data } as CustomerProfile);
            setUser(firebaseUser); // only expose user if customer doc exists
          } else {
            // No customers/{uid} doc → this is an admin or unknown account.
            // Expose neither user nor profile to the storefront.
            setProfile(null);
            setUser(null);
          }
          setLoading(false);
        },
        () => {
          // Permission denied or other error — treat as guest
          setProfile(null);
          setUser(null);
          setLoading(false);
        }
      );
    });

    return () => {
      authUnsub();
      profileUnsub?.();
    };
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

export function useCustomerAuth(): CustomerAuthContextValue {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used inside <CustomerAuthProvider>");
  return ctx;
}
