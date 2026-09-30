"use client";

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

interface ToastContextValue {
  showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast container — fixed top-right, above everything */}
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 w-full max-w-sm pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={[
              "flex items-start gap-3 px-4 py-3.5 rounded-2xl shadow-lg pointer-events-auto",
              "animate-in slide-in-from-right-8 duration-300",
              toast.type === "success" ? "bg-emerald-600 text-white" :
              toast.type === "error"   ? "bg-red-600 text-white" :
                                         "bg-brand-brown text-white",
            ].join(" ")}
          >
            <span className="text-lg leading-none mt-0.5" aria-hidden="true">
              {toast.type === "success" ? "✓" : toast.type === "error" ? "✕" : "ℹ"}
            </span>
            <p className="flex-1 text-sm font-medium leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="shrink-0 opacity-80 hover:opacity-100 transition-opacity leading-none text-lg"
              aria-label="Dismiss notification"
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
