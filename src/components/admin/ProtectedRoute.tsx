"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { logoutAdmin } from "@/lib/adminAuthService";

function Spinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div
        className="w-8 h-8 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin"
        role="status"
        aria-label="Loading"
      />
    </div>
  );
}

export default function ProtectedRoute({ children }: { children: ReactNode }) {
  const { firebaseUser, adminProfile, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !firebaseUser) {
      router.replace("/admin/login");
    }
  }, [loading, firebaseUser, router]);

  // Still waiting for onAuthStateChanged to fire
  if (loading) return <Spinner />;

  // Not signed in — redirect is in progress via useEffect
  if (!firebaseUser) return <Spinner />;

  // Signed in but no admins/{uid} document
  if (!adminProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 max-w-sm w-full text-center flex flex-col gap-4">
          <div className="text-3xl">🚫</div>
          <h1 className="text-lg font-semibold text-gray-800">Access Denied</h1>
          <p className="text-sm text-gray-500">
            Your account is not authorized as an admin. Contact the site owner
            to be granted access.
          </p>
          <button
            type="button"
            onClick={() => logoutAdmin()}
            className="mt-2 w-full px-4 py-2.5 rounded-lg bg-gray-100 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
