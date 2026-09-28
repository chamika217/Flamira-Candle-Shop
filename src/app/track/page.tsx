import type { Metadata } from "next";
import TrackForm from "./TrackForm";

export const metadata: Metadata = {
  title: "Track Order — Flamira",
  description: "Track your Flamira order status using your order number.",
};

export default function TrackOrderPage() {
  return (
    <div className="min-h-screen bg-brand-cream">
      <div className="bg-brand-ivory border-b border-brand-border">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 sm:py-20 text-center">
          <h1 className="font-serif text-4xl sm:text-5xl font-semibold text-brand-brown mb-4">
            Track Your Order
          </h1>
          <p className="text-brand-stone text-base max-w-md mx-auto leading-relaxed">
            Enter your order number to check the status of your delivery.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-lg px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
        <TrackForm />
      </div>
    </div>
  );
}
