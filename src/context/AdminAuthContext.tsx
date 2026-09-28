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
import { getAdminProfile } from "@/lib/adminAuthService";
import type { AdminUser } from "@/lib/types";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface AdminAuthContextValue {
  firebaseUser: User | null;
  adminProfile: AdminUser | null;
  /** true until the initial onAuthStateChanged fires and profile is fetched */
  loading: boolean;
  /** convenience: true when role === 'staff' */
  isStaffOnly: boolean;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [adminProfile, setAdminProfile] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (user) {
        // Fetch the admin profile; null means the user exists in Auth but
        // has no admins/{uid} document — treated as "access denied".
        const profile = await getAdminProfile(user.uid);
        setAdminProfile(profile);
      } else {
        setAdminProfile(null);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const isStaffOnly = adminProfile?.role === "staff";

  const value = useMemo<AdminAuthContextValue>(
    () => ({ firebaseUser, adminProfile, loading, isStaffOnly }),
    [firebaseUser, adminProfile, loading, isStaffOnly]
  );

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside <AdminAuthProvider>");
  return ctx;
}
