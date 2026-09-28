"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signUpCustomer } from "@/lib/customerAuthService";

export default function CustomerSignupPage() {
  const router = useRouter();

  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone]       = useState("");
  const [error, setError]       = useState<string | null>(null);
  const [loading, setLoading]   = useState(false);

  const inputCls = "w-full rounded-lg border border-brand-border bg-brand-white px-3 py-2.5 text-sm text-brand-brown placeholder:text-brand-muted focus:outline-none focus:border-brand-terracotta transition-colors";

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim() || !phone.trim()) {
      setError("All fields are required.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await signUpCustomer(name, email, password, phone);
      router.replace("/account");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      console.error("Signup error:", err);
      if (msg.includes("email-already-in-use")) {
        setError("An account with this email already exists. Try signing in.");
      } else if (msg.includes("weak-password")) {
        setError("Password must be at least 6 characters.");
      } else if (msg.includes("invalid-email")) {
        setError("Please enter a valid email address.");
      } else if (msg.includes("network-request-failed")) {
        setError("Network error — check your internet connection and try again.");
      } else if (msg.includes("operation-not-allowed")) {
        setError("Email/password sign-up is not enabled. Please contact support.");
      } else {
        setError(`Could not create account: ${msg || "Unknown error"}`);
      }
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="bg-brand-white rounded-2xl border border-brand-border p-8 flex flex-col gap-6">
          <div className="text-center">
            <h1 className="font-serif text-2xl font-semibold text-brand-brown">Create account</h1>
            <p className="text-sm text-brand-muted mt-1">Save your details for faster checkout</p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 text-center">
              {error}
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {[
              { id: "name",     label: "Full Name",    type: "text",     val: name,     set: setName,     auto: "name",            ph: "Amaya Perera" },
              { id: "email",    label: "Email",         type: "email",    val: email,    set: setEmail,    auto: "email",           ph: "you@example.com" },
              { id: "phone",    label: "Phone",         type: "tel",      val: phone,    set: setPhone,    auto: "tel",             ph: "07X XXX XXXX" },
              { id: "password", label: "Password",      type: "password", val: password, set: setPassword, auto: "new-password",    ph: "Min 6 characters" },
            ].map(({ id, label, type, val, set, auto, ph }) => (
              <div key={id} className="flex flex-col gap-1.5">
                <label htmlFor={id} className="text-sm font-medium text-brand-brown">{label}</label>
                <input id={id} type={type} autoComplete={auto} required value={val}
                  onChange={(e) => set(e.target.value)} className={inputCls} placeholder={ph} />
              </div>
            ))}

            <button type="submit" disabled={loading}
              className="mt-1 w-full px-4 py-2.5 rounded-full bg-brand-terracotta text-brand-white font-medium text-sm hover:bg-brand-terracotta-dark disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-brand-stone mt-5">
          Already have an account?{" "}
          <Link href="/account/login" className="text-brand-terracotta hover:text-brand-terracotta-dark underline underline-offset-2 transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
