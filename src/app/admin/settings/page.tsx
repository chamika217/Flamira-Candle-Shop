"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getAdminUsers, createAdminUser,
  updateAdminUserRole, deactivateAdminUser,
} from "@/lib/adminUsersService";
import { getSettings, updateSettings } from "@/lib/settingsService";
import type { AdminUser, AdminRole, Settings } from "@/lib/types";

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------
const inputCls = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta transition-colors";
const labelCls = "block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1.5";

function SectionCard({ title, subtitle, children }: {
  title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6 flex flex-col gap-5">
      <div className="border-b border-gray-100 pb-3">
        <h2 className="text-base font-semibold text-gray-800">{title}</h2>
        {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Password generator
// ---------------------------------------------------------------------------

function generatePassword(): string {
  const upper  = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower  = "abcdefghjkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  const rand = (charset: string) => charset[Math.floor(Math.random() * charset.length)];
  // Guarantee at least one of each category
  const required = [rand(upper), rand(lower), rand(digits), rand(special)];
  const rest = Array.from({ length: 8 }, () => rand(all));
  return [...required, ...rest].sort(() => Math.random() - 0.5).join("");
}

// ---------------------------------------------------------------------------
// Deactivate confirmation dialog
// ---------------------------------------------------------------------------
function DeactivateDialog({ name, onConfirm, onCancel, loading }: {
  name: string; onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full flex flex-col gap-4">
        <h3 className="text-base font-semibold text-gray-900">Deactivate admin?</h3>
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-800">{name}</span> will lose admin access
          immediately. Their Firebase Auth account still exists — delete it manually from
          the Firebase Console if needed.
        </p>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 transition-colors">
            Cancel
          </button>
          <button type="button" onClick={onConfirm} disabled={loading}
            className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-50 transition-colors">
            {loading ? "Deactivating…" : "Deactivate"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Admin Users section
// ---------------------------------------------------------------------------

function AdminUsersSection({
  users,
  currentUid,
  onReload,
}: {
  users: AdminUser[];
  currentUid: string;
  onReload: () => void;
}) {
  const [togglingUid, setTogglingUid]       = useState<string | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<AdminUser | null>(null);
  const [deactivating, setDeactivating]     = useState(false);

  async function handleRoleChange(uid: string, role: AdminRole) {
    setTogglingUid(uid);
    try { await updateAdminUserRole(uid, role); onReload(); }
    finally { setTogglingUid(null); }
  }

  async function handleDeactivate() {
    if (!deactivateTarget) return;
    setDeactivating(true);
    try {
      await deactivateAdminUser(deactivateTarget.uid);
      setDeactivateTarget(null);
      onReload();
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <SectionCard
      title="Admin Users"
      subtitle="All users with admin panel access"
    >
      {users.length === 0 ? (
        <p className="text-sm text-gray-400">No admin users found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Name</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Role</th>
                <th className="text-left px-4 py-3 font-semibold">Created</th>
                <th className="text-left px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((user) => {
                const isSelf = user.uid === currentUid;
                return (
                  <tr key={user.uid} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800">
                      {user.name}
                      {isSelf && (
                        <span className="ml-2 text-[10px] font-semibold text-brand-terracotta bg-brand-terracotta/10 px-2 py-0.5 rounded-full">
                          You
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{user.email}</td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${user.role === "owner" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"}`}>
                          {user.role}
                        </span>
                      ) : (
                        <select
                          value={user.role}
                          disabled={togglingUid === user.uid}
                          onChange={(e) => handleRoleChange(user.uid, e.target.value as AdminRole)}
                          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 focus:outline-none focus:border-brand-terracotta transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <option value="owner">Owner</option>
                          <option value="staff">Staff</option>
                        </select>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {user.createdAt?.toDate?.().toLocaleDateString("en-LK", {
                        day: "numeric", month: "short", year: "numeric",
                      }) ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      {isSelf ? (
                        <span className="text-xs text-gray-300">—</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDeactivateTarget(user)}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {deactivateTarget && (
        <DeactivateDialog
          name={deactivateTarget.name}
          onConfirm={handleDeactivate}
          onCancel={() => setDeactivateTarget(null)}
          loading={deactivating}
        />
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Add Staff Member form
// ---------------------------------------------------------------------------

interface CreatedCreds { name: string; email: string; password: string; }

function AddStaffSection({ onReload }: { onReload: () => void }) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole]         = useState<AdminRole>("staff");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [created, setCreated]   = useState<CreatedCreds | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("Name, email, and password are all required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await createAdminUser(name.trim(), email.trim(), password, role);
      setCreated({ name: name.trim(), email: email.trim(), password });
      setName(""); setEmail(""); setPassword(""); setRole("staff");
      onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create user.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SectionCard title="Add Staff Member" subtitle="Creates a new Firebase Auth account + admin profile">
      {created && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex flex-col gap-2">
          <p className="text-sm font-semibold text-emerald-700">
            ✓ Account created for {created.name}
          </p>
          <p className="text-xs text-emerald-600">
            Share these login details — the password <strong>cannot be retrieved again</strong>:
          </p>
          <div className="bg-white rounded-lg border border-emerald-200 px-3 py-2.5 text-xs font-mono text-gray-700 space-y-0.5">
            <p><span className="text-gray-400">Email:</span> {created.email}</p>
            <p><span className="text-gray-400">Password:</span> {created.password}</p>
          </div>
          <button type="button" onClick={() => setCreated(null)}
            className="self-start text-xs text-emerald-600 hover:text-emerald-800 underline underline-offset-2 transition-colors">
            Dismiss
          </button>
        </div>
      )}

      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Full Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)}
            className={inputCls} placeholder="Kavya Silva" />
        </div>

        <div>
          <label className={labelCls}>Email *</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
            className={inputCls} placeholder="kavya@flamira.lk" />
        </div>

        <div>
          <label className={labelCls}>Password *</label>
          <div className="flex gap-2">
            <input
              type={showPass ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputCls} flex-1 font-mono`}
              placeholder="Min 6 characters"
            />
            <button type="button" onClick={() => setShowPass((v) => !v)}
              className="px-3 rounded-lg border border-gray-200 text-xs text-gray-500 hover:bg-gray-50 transition-colors"
              aria-label={showPass ? "Hide password" : "Show password"}>
              {showPass ? "Hide" : "Show"}
            </button>
            <button type="button" onClick={() => { setPassword(generatePassword()); setShowPass(true); }}
              className="px-3 rounded-lg border border-gray-200 text-xs text-gray-600 hover:bg-gray-50 transition-colors whitespace-nowrap">
              Generate
            </button>
          </div>
        </div>

        <div>
          <label className={labelCls}>Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value as AdminRole)}
            className={inputCls}>
            <option value="staff">Staff</option>
            <option value="owner">Owner</option>
          </select>
        </div>

        <div className="sm:col-span-2 flex items-center gap-3">
          <button type="submit" disabled={loading}
            className="px-6 py-2.5 rounded-lg text-sm font-medium text-white bg-brand-terracotta hover:bg-brand-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
            {loading ? "Creating…" : "Create Account"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Store info section
// ---------------------------------------------------------------------------

function StoreInfoSection({ settings, onSaved }: {
  settings: Settings; onSaved: () => void;
}) {
  const [storeName, setStoreName]     = useState(settings.storeName ?? "");
  const [phone, setPhone]             = useState(settings.contactPhone ?? "");
  const [contactEmail, setContactEmail] = useState(settings.contactEmail ?? "");
  const [saving, setSaving]           = useState(false);
  const [saved, setSaved]             = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true); setError(null);
    try {
      await updateSettings({
        storeName:    storeName.trim() || undefined,
        contactPhone: phone.trim() || undefined,
        contactEmail: contactEmail.trim() || undefined,
      });
      setSaved(true); setTimeout(() => setSaved(false), 2500);
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <SectionCard title="Store Information" subtitle="Displayed in order emails and admin panel">
      {error && (
        <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2" role="alert">{error}</p>
      )}
      <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className={labelCls}>Store Name</label>
          <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)}
            className={inputCls} placeholder="Flamira" />
        </div>
        <div>
          <label className={labelCls}>Contact Phone</label>
          <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
            className={inputCls} placeholder="071 116 8590" />
        </div>
        <div>
          <label className={labelCls}>Contact Email</label>
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
            className={inputCls} placeholder="candlesflamira@gmail.com" />
        </div>
        <div className="sm:col-span-2">
          <button type="submit" disabled={saving}
            className={[
              "px-6 py-2.5 rounded-lg text-sm font-medium transition-colors",
              saved ? "bg-emerald-600 text-white"
                : "bg-brand-terracotta text-white hover:bg-brand-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed",
            ].join(" ")}>
            {saving ? "Saving…" : saved ? "Saved ✓" : "Save Store Info"}
          </button>
        </div>
      </form>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminSettingsPage() {
  const { isStaffOnly, firebaseUser } = useAdminAuth();
  const router = useRouter();

  const [users, setUsers]         = useState<AdminUser[]>([]);
  const [settings, setSettings]   = useState<Settings | null>(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    if (isStaffOnly) router.replace("/admin/dashboard");
  }, [isStaffOnly, router]);

  async function load() {
    const [u, s] = await Promise.all([
      getAdminUsers().catch(() => [] as AdminUser[]),
      getSettings().catch(() => null),
    ]);
    setUsers(u);
    setSettings(s);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  if (isStaffOnly) return null;

  const currentUid = firebaseUser?.uid ?? "";

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-400 mt-0.5">Admin users, roles, and store configuration</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-7 h-7 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
        </div>
      ) : (
        <>
          <AdminUsersSection
            users={users}
            currentUid={currentUid}
            onReload={load}
          />
          <AddStaffSection onReload={load} />
          {settings && (
            <StoreInfoSection settings={settings} onSaved={load} />
          )}
        </>
      )}
    </div>
  );
}
