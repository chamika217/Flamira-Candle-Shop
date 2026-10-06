"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users, UserCheck, UserX, Shield, ShieldAlert, Key, Search,
  Filter, Plus, RefreshCw, Mail, Phone, Calendar, ShoppingBag,
  CheckCircle2, Ban, Lock, Unlock, ArrowRight, ExternalLink,
  ChevronDown, Edit3, X, AlertTriangle
} from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";
import {
  getAllUnifiedUsers,
  updateUserStatus,
  updateUserRoleAndPermissions,
  updateUserDetails,
  sendUserPasswordReset,
  getCustomerOrderHistory,
} from "@/lib/userManagementService";
import { createAdminUser } from "@/lib/adminUsersService";
import type { UnifiedUser, AccountStatus, AdminRole, Order } from "@/lib/types";
import type { Timestamp } from "firebase/firestore";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatPrice(n: number) {
  return `Rs. ${n.toLocaleString("en-LK")}`;
}

function formatDate(ts: Timestamp | undefined): string {
  if (!ts) return "—";
  return ts.toDate().toLocaleDateString("en-LK", {
    day: "numeric", month: "short", year: "numeric",
  });
}

const STATUS_BADGE: Record<AccountStatus, { bg: string; text: string; label: string; icon: React.ReactNode }> = {
  active: {
    bg: "bg-emerald-100 border-emerald-200",
    text: "text-emerald-800",
    label: "Active",
    icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
  },
  inactive: {
    bg: "bg-gray-100 border-gray-200",
    text: "text-gray-700",
    label: "Inactive",
    icon: <UserX className="w-3.5 h-3.5 text-gray-500" />,
  },
  suspended: {
    bg: "bg-rose-100 border-rose-200",
    text: "text-rose-800",
    label: "Suspended / Blocked",
    icon: <Ban className="w-3.5 h-3.5 text-rose-600" />,
  },
};

const ROLE_LABELS: Record<string, { label: string; bg: string; text: string }> = {
  owner: { label: "Owner", bg: "bg-purple-100 border-purple-200", text: "text-purple-800" },
  manager: { label: "Manager", bg: "bg-indigo-100 border-indigo-200", text: "text-indigo-800" },
  staff: { label: "Staff", bg: "bg-blue-100 border-blue-200", text: "text-blue-800" },
  content_editor: { label: "Editor", bg: "bg-amber-100 border-amber-200", text: "text-amber-800" },
  customer: { label: "Customer", bg: "bg-teal-100 border-teal-200", text: "text-teal-800" },
  guest: { label: "Guest", bg: "bg-gray-100 border-gray-200", text: "text-gray-600" },
};

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function UserControlPage() {
  const { isStaffOnly, adminProfile } = useAdminAuth();
  const router = useRouter();

  const [users, setUsers] = useState<UnifiedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [activeTab, setActiveTab] = useState<"all" | "customers" | "staff" | "suspended">("all");

  // Selected User Modal / Drawer State
  const [selectedUser, setSelectedUser] = useState<UnifiedUser | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Status Change / Block Modal
  const [statusModalUser, setStatusModalUser] = useState<UnifiedUser | null>(null);
  const [newStatus, setNewStatus] = useState<AccountStatus>("active");
  const [statusReason, setStatusReason] = useState("");
  const [savingStatus, setSavingStatus] = useState(false);

  // Role Edit Modal
  const [roleModalUser, setRoleModalUser] = useState<UnifiedUser | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>("staff");
  const [savingRole, setSavingRole] = useState(false);

  // Add Staff Modal
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffName, setStaffName] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  const [staffPassword, setStaffPassword] = useState("");
  const [staffRole, setStaffRole] = useState<AdminRole>("staff");
  const [creatingStaff, setCreatingStaff] = useState(false);
  const [staffError, setStaffError] = useState<string | null>(null);
  const [createdCredentials, setCreatedCredentials] = useState<{ email: string; pass: string } | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  function showToast(msg: string) {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  // Guard: Staff members cannot access user control
  useEffect(() => {
    if (isStaffOnly) router.replace("/admin/dashboard");
  }, [isStaffOnly, router]);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUnifiedUsers();
      setUsers(data);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // When a user is selected, load their order history
  useEffect(() => {
    if (!selectedUser) {
      setUserOrders([]);
      return;
    }
    setLoadingOrders(true);
    getCustomerOrderHistory(selectedUser.phone, selectedUser.email)
      .then(setUserOrders)
      .catch(() => setUserOrders([]))
      .finally(() => setLoadingOrders(false));
  }, [selectedUser]);

  // Derived filtered users
  const filteredUsers = useMemo(() => {
    const q = search.toLowerCase().trim();
    return users.filter((u) => {
      // Tab filter
      if (activeTab === "customers" && u.userType !== "customer") return false;
      if (activeTab === "staff" && u.userType !== "admin") return false;
      if (activeTab === "suspended" && u.status !== "suspended") return false;

      // Dropdown filters
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter !== "all" && u.status !== statusFilter) return false;

      // Search
      if (
        q &&
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q) &&
        !(u.phone && u.phone.includes(q)) &&
        !u.uid.toLowerCase().includes(q)
      ) {
        return false;
      }
      return true;
    });
  }, [users, search, roleFilter, statusFilter, activeTab]);

  // Status submission
  const handleSaveStatus = async () => {
    if (!statusModalUser) return;
    setSavingStatus(true);
    try {
      await updateUserStatus(
        statusModalUser.uid,
        statusModalUser.userType === "admin" ? "admin" : "customer",
        newStatus,
        statusReason.trim()
      );
      showToast(`User status updated to "${newStatus.toUpperCase()}"`);
      setStatusModalUser(null);
      loadUsers();
      if (selectedUser?.uid === statusModalUser.uid) {
        setSelectedUser({ ...selectedUser, status: newStatus, statusReason });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status.");
    } finally {
      setSavingStatus(false);
    }
  };

  // Role submission
  const handleSaveRole = async () => {
    if (!roleModalUser) return;
    setSavingRole(true);
    try {
      await updateUserRoleAndPermissions(
        roleModalUser.uid,
        roleModalUser.userType === "admin" ? "admin" : "customer",
        selectedRole
      );
      showToast(`Role updated to ${selectedRole.toUpperCase()}`);
      setRoleModalUser(null);
      loadUsers();
      if (selectedUser?.uid === roleModalUser.uid) {
        setSelectedUser({ ...selectedUser, role: selectedRole });
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update role.");
    } finally {
      setSavingRole(false);
    }
  };

  // Create staff user
  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!staffName.trim() || !staffEmail.trim() || !staffPassword.trim()) {
      setStaffError("All fields are required.");
      return;
    }
    setCreatingStaff(true);
    setStaffError(null);
    try {
      await createAdminUser(staffName.trim(), staffEmail.trim(), staffPassword, staffRole);
      setCreatedCredentials({ email: staffEmail.trim(), pass: staffPassword });
      setStaffName("");
      setStaffEmail("");
      setStaffPassword("");
      showToast("Staff account created successfully!");
      loadUsers();
    } catch (err) {
      setStaffError(err instanceof Error ? err.message : "Failed to create staff account.");
    } finally {
      setCreatingStaff(false);
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      await sendUserPasswordReset(email);
      showToast(`Password reset link sent to ${email}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send reset link.");
    }
  };

  if (isStaffOnly) return null;

  // Overview Counts
  const totalUsers = users.length;
  const totalCustomers = users.filter((u) => u.userType === "customer").length;
  const totalStaff = users.filter((u) => u.userType === "admin").length;
  const totalSuspended = users.filter((u) => u.status === "suspended").length;

  return (
    <div className="flex flex-col gap-6 pb-12">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-brand-brown text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-sm font-semibold animate-fade-in border border-brand-terracotta">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Control & Access</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Manage customer accounts, roles, access permissions, and account suspensions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={loadUsers}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-600 hover:text-gray-900 hover:bg-gray-50 transition-colors shadow-xs"
            title="Refresh user list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => { setShowAddStaffModal(true); setCreatedCredentials(null); }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-terracotta text-white font-semibold text-sm hover:bg-brand-terracotta-dark shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Admin / Staff</span>
          </button>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Users", val: totalUsers, icon: <Users className="w-5 h-5 text-gray-500" />, tab: "all" as const },
          { label: "Registered Customers", val: totalCustomers, icon: <UserCheck className="w-5 h-5 text-teal-600" />, tab: "customers" as const },
          { label: "Admin & Staff", val: totalStaff, icon: <Shield className="w-5 h-5 text-purple-600" />, tab: "staff" as const },
          { label: "Blocked / Suspended", val: totalSuspended, icon: <Ban className="w-5 h-5 text-rose-600" />, tab: "suspended" as const },
        ].map((item) => (
          <div
            key={item.label}
            onClick={() => setActiveTab(item.tab)}
            className={`p-5 rounded-2xl border transition-all cursor-pointer ${
              activeTab === item.tab
                ? "bg-white border-brand-terracotta shadow-sm ring-2 ring-brand-terracotta/20"
                : "bg-white border-gray-200 hover:border-gray-300 shadow-xs"
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">{item.label}</span>
              {item.icon}
            </div>
            <p className="text-2xl font-bold text-gray-900 mt-2">{item.val}</p>
          </div>
        ))}
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 flex-wrap">
        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-white border border-gray-200 overflow-x-auto shadow-xs">
          {[
            { id: "all", label: "All Users" },
            { id: "customers", label: "Customers" },
            { id: "staff", label: "Staff & Admins" },
            { id: "suspended", label: "Suspended" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === t.id
                  ? "bg-brand-brown text-white shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Search & Select Filters */}
        <div className="flex items-center gap-2.5 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              placeholder="Search by name, email, phone, UID…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-brand-terracotta shadow-xs"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 focus:outline-none focus:border-brand-terracotta shadow-xs"
          >
            <option value="all">Status: All</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-brand-terracotta border-t-transparent animate-spin" />
            <p className="text-sm text-gray-400">Loading user accounts…</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-12 text-center text-sm text-gray-400 flex flex-col items-center gap-2">
            <p>No users found matching the selected filters.</p>
            <button
              type="button"
              onClick={() => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); setActiveTab("all"); }}
              className="text-xs text-brand-terracotta font-semibold underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="text-left px-5 py-3.5 font-semibold">User Details</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Role</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Account Status</th>
                  <th className="text-center px-5 py-3.5 font-semibold">Orders</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Total Spent</th>
                  <th className="text-left px-5 py-3.5 font-semibold">Registered</th>
                  <th className="text-right px-5 py-3.5 font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((user) => {
                  const roleCfg = ROLE_LABELS[user.role] ?? { label: user.role, bg: "bg-gray-100", text: "text-gray-800" };
                  const statusCfg = STATUS_BADGE[user.status] ?? STATUS_BADGE.active;

                  return (
                    <tr
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="hover:bg-gray-50/80 transition-colors cursor-pointer group"
                    >
                      {/* Name & Contact */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-brand-ivory border border-gray-200 flex items-center justify-center font-bold text-brand-brown text-sm shrink-0">
                            {user.name ? user.name.slice(0, 2).toUpperCase() : "U"}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 leading-snug group-hover:text-brand-terracotta transition-colors">
                              {user.name}
                            </p>
                            <p className="text-xs text-gray-500 truncate max-w-xs">{user.email}</p>
                            {user.phone && <p className="text-[11px] text-gray-400 font-mono">{user.phone}</p>}
                          </div>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${roleCfg.bg} ${roleCfg.text}`}>
                          {roleCfg.label}
                        </span>
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${statusCfg.bg} ${statusCfg.text}`}>
                          {statusCfg.icon}
                          <span>{statusCfg.label}</span>
                        </span>
                        {user.statusReason && (
                          <p className="text-[11px] text-gray-400 italic mt-0.5 truncate max-w-[150px]">
                            {user.statusReason}
                          </p>
                        )}
                      </td>

                      {/* Orders Count */}
                      <td className="px-5 py-4 text-center">
                        <span className="font-semibold text-gray-800 px-2 py-0.5 rounded-full bg-gray-100 text-xs">
                          {user.orderCount}
                        </span>
                      </td>

                      {/* Total Spent */}
                      <td className="px-5 py-4 font-bold text-gray-900">
                        {user.totalSpent > 0 ? formatPrice(user.totalSpent) : "—"}
                      </td>

                      {/* Registered Date */}
                      <td className="px-5 py-4 text-gray-500 text-xs whitespace-nowrap">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Quick Actions Dropdown */}
                      <td className="px-5 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setStatusModalUser(user);
                              setNewStatus(user.status);
                              setStatusReason(user.statusReason ?? "");
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-brand-terracotta hover:bg-gray-100 transition-colors"
                            title="Update Status / Block"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRoleModalUser(user);
                              setSelectedRole(user.role);
                            }}
                            className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-600 hover:bg-gray-100 transition-colors"
                            title="Change Role & Permissions"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedUser(user)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title="View Full Profile"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* =========================================================================
          MODAL 1: User Profile & Order History Drawer
      ========================================================================== */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSelectedUser(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto flex flex-col gap-6 z-10 animate-scale-in">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-brand-terracotta/10 text-brand-terracotta flex items-center justify-center font-bold text-lg">
                  {selectedUser.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedUser.name}</h2>
                  <p className="text-xs text-gray-400 font-mono">UID: {selectedUser.uid}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Info Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50/80 p-4 rounded-2xl border border-gray-200/70 text-xs">
              <div>
                <span className="text-gray-400 uppercase font-semibold">Email</span>
                <p className="font-bold text-gray-800 text-sm mt-0.5">{selectedUser.email}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-semibold">Phone</span>
                <p className="font-bold text-gray-800 text-sm mt-0.5">{selectedUser.phone || "Not provided"}</p>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-semibold">Account Role</span>
                <div className="mt-1">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold border ${ROLE_LABELS[selectedUser.role]?.bg} ${ROLE_LABELS[selectedUser.role]?.text}`}>
                    {ROLE_LABELS[selectedUser.role]?.label || selectedUser.role}
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-400 uppercase font-semibold">Account Status</span>
                <div className="mt-1">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${STATUS_BADGE[selectedUser.status]?.bg} ${STATUS_BADGE[selectedUser.status]?.text}`}>
                    {STATUS_BADGE[selectedUser.status]?.icon}
                    <span>{STATUS_BADGE[selectedUser.status]?.label}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setStatusModalUser(selectedUser);
                  setNewStatus(selectedUser.status);
                  setStatusReason(selectedUser.statusReason ?? "");
                }}
                className="px-3.5 py-2 rounded-xl bg-gray-100 text-gray-700 hover:bg-gray-200 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <Shield className="w-3.5 h-3.5" />
                Change Status / Block
              </button>
              <button
                type="button"
                onClick={() => {
                  setRoleModalUser(selectedUser);
                  setSelectedRole(selectedUser.role);
                }}
                className="px-3.5 py-2 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Manage Role
              </button>
              {selectedUser.email && (
                <button
                  type="button"
                  onClick={() => handlePasswordReset(selectedUser.email)}
                  className="px-3.5 py-2 rounded-xl bg-amber-50 text-amber-800 hover:bg-amber-100 text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  Send Password Reset Email
                </button>
              )}
            </div>

            {/* Customer Order History */}
            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center justify-between">
                <span>Order History ({userOrders.length})</span>
                <span className="text-xs font-normal text-gray-400">Total Spent: {formatPrice(selectedUser.totalSpent)}</span>
              </h3>

              {loadingOrders ? (
                <div className="p-8 flex justify-center">
                  <div className="w-6 h-6 rounded-full border-2 border-brand-terracotta border-t-transparent animate-spin" />
                </div>
              ) : userOrders.length === 0 ? (
                <div className="p-6 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center text-xs text-gray-400">
                  No orders placed by this user yet.
                </div>
              ) : (
                <div className="overflow-x-auto border border-gray-100 rounded-2xl">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50 text-gray-400 uppercase font-semibold">
                      <tr>
                        <th className="text-left px-3 py-2.5">Order #</th>
                        <th className="text-left px-3 py-2.5">Date</th>
                        <th className="text-left px-3 py-2.5">Total</th>
                        <th className="text-left px-3 py-2.5">Status</th>
                        <th className="text-right px-3 py-2.5">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {userOrders.map((ord) => (
                        <tr key={ord.id} className="hover:bg-gray-50/80">
                          <td className="px-3 py-2.5 font-mono font-bold text-gray-900">{ord.orderNumber}</td>
                          <td className="px-3 py-2.5 text-gray-500">{formatDate(ord.createdAt)}</td>
                          <td className="px-3 py-2.5 font-semibold text-gray-900">{formatPrice(ord.total)}</td>
                          <td className="px-3 py-2.5">
                            <span className="inline-block px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-700 capitalize">
                              {ord.orderStatus}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <Link
                              href={`/admin/orders/${ord.id}`}
                              className="text-brand-terracotta hover:underline font-bold inline-flex items-center gap-0.5"
                            >
                              Inspect <ExternalLink className="w-3 h-3" />
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: Account Status & Suspension Manager
      ========================================================================== */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setStatusModalUser(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full flex flex-col gap-5 z-10">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Manage Account Status</h3>
              <p className="text-xs text-gray-500 mt-1">
                Updating status for <span className="font-semibold text-gray-800">{statusModalUser.name}</span> ({statusModalUser.email})
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-xs font-bold uppercase tracking-wider text-gray-500">Account State</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "active", label: "Active", icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" /> },
                  { id: "inactive", label: "Inactive", icon: <UserX className="w-4 h-4 text-gray-500" /> },
                  { id: "suspended", label: "Block / Suspend", icon: <Ban className="w-4 h-4 text-rose-600" /> },
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setNewStatus(s.id as AccountStatus)}
                    className={`p-3 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      newStatus === s.id
                        ? "bg-brand-terracotta/10 border-brand-terracotta text-brand-terracotta"
                        : "border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {s.icon}
                    <span>{s.label}</span>
                  </button>
                ))}
              </div>

              {newStatus === "suspended" && (
                <div className="mt-2 bg-rose-50 border border-rose-200 p-3 rounded-xl text-xs text-rose-800">
                  <p className="font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    Suspension Notice
                  </p>
                  <p className="mt-0.5 text-[11px] text-rose-700">
                    This user will be blocked from logging into their storefront account or placing orders.
                  </p>
                </div>
              )}

              <div className="mt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1.5">
                  Reason / Internal Admin Note
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Account suspended due to fraudulent order dispute or requested closure"
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 p-3 text-xs text-gray-800 focus:outline-none focus:border-brand-terracotta resize-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setStatusModalUser(null)}
                disabled={savingStatus}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                disabled={savingStatus}
                className="px-5 py-2 rounded-xl bg-brand-terracotta text-white text-xs font-bold hover:bg-brand-terracotta-dark disabled:opacity-50"
              >
                {savingStatus ? "Saving…" : "Save Status"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 3: Role & Permissions Manager
      ========================================================================== */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRoleModalUser(null)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full flex flex-col gap-5 z-10">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Manage User Role</h3>
              <p className="text-xs text-gray-500 mt-1">
                Assign administrative roles or demote to customer account.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              {[
                { id: "owner", title: "Store Owner", desc: "Full administrative access across all settings & finances." },
                { id: "manager", title: "Store Manager", desc: "Access to Products, Orders, Inventory, and Reviews." },
                { id: "staff", title: "Order & Inventory Staff", desc: "Processing orders, print slips & stock adjustment only." },
                { id: "content_editor", title: "Content Editor", desc: "Hero banners, coupons & featured product curation." },
                { id: "customer", title: "Standard Customer", desc: "Storefront shopping and order placement account." },
              ].map((r) => (
                <label
                  key={r.id}
                  onClick={() => setSelectedRole(r.id)}
                  className={`p-3.5 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${
                    selectedRole === r.id
                      ? "bg-brand-terracotta/5 border-brand-terracotta shadow-xs"
                      : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="radio"
                    name="role-select"
                    checked={selectedRole === r.id}
                    onChange={() => setSelectedRole(r.id)}
                    className="mt-0.5 accent-brand-terracotta"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{r.title}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{r.desc}</p>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRoleModalUser(null)}
                disabled={savingRole}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRole}
                disabled={savingRole}
                className="px-5 py-2 rounded-xl bg-brand-terracotta text-white text-xs font-bold hover:bg-brand-terracotta-dark disabled:opacity-50"
              >
                {savingRole ? "Updating…" : "Update Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 4: Create Admin / Staff User (Secondary Firebase App Pattern)
      ========================================================================== */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddStaffModal(false)} />
          <div className="relative bg-white rounded-3xl shadow-2xl p-6 sm:p-8 max-w-md w-full flex flex-col gap-5 z-10">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Create Staff / Admin Account</h3>
              <p className="text-xs text-gray-500 mt-1">
                Creates a secure Firebase Auth login + Admin profile safely.
              </p>
            </div>

            {createdCredentials ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex flex-col gap-2">
                <p className="text-sm font-bold text-emerald-800 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Account Created Successfully!
                </p>
                <p className="text-xs text-emerald-700">Please share these initial credentials with the staff member:</p>
                <div className="bg-white p-3 rounded-xl border border-emerald-200 font-mono text-xs text-gray-800 space-y-1">
                  <p><span className="text-gray-400">Email:</span> {createdCredentials.email}</p>
                  <p><span className="text-gray-400">Password:</span> {createdCredentials.pass}</p>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowAddStaffModal(false); setCreatedCredentials(null); }}
                  className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold self-start hover:bg-emerald-700"
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateStaff} className="flex flex-col gap-4">
                {staffError && (
                  <p className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">
                    {staffError}
                  </p>
                )}

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kasun Perera"
                    value={staffName}
                    onChange={(e) => setStaffName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Email Address *</label>
                  <input
                    type="email"
                    required
                    placeholder="kasun@flamira.lk"
                    value={staffEmail}
                    onChange={(e) => setStaffEmail(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Initial Password *</label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 characters"
                    value={staffPassword}
                    onChange={(e) => setStaffPassword(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm font-mono focus:outline-none focus:border-brand-terracotta"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-gray-500 block mb-1">Administrative Role</label>
                  <select
                    value={staffRole}
                    onChange={(e) => setStaffRole(e.target.value as AdminRole)}
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-brand-terracotta"
                  >
                    <option value="staff">Staff (Orders & Inventory)</option>
                    <option value="manager">Manager (Store Operations)</option>
                    <option value="content_editor">Content Editor (CMS & Reviews)</option>
                    <option value="owner">Owner (Full Admin Access)</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddStaffModal(false)}
                    disabled={creatingStaff}
                    className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-semibold hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingStaff}
                    className="px-5 py-2 rounded-xl bg-brand-terracotta text-white text-xs font-bold hover:bg-brand-terracotta-dark disabled:opacity-50"
                  >
                    {creatingStaff ? "Creating Account…" : "Create Staff Account"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
