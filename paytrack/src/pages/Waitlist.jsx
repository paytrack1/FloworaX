import React, { useState } from "react";

const BUSINESS_TYPES = [
  { value: "health_wellness", label: "Health & Wellness" },
  { value: "professional_services", label: "Professional Services" },
  { value: "education_nonprofits", label: "Education & Nonprofits" },
  { value: "business_retail", label: "Business & Retail" },
  { value: "complete_business_os", label: "Complete Business OS" },
];

const Waitlist = () => {
  const [form, setForm] = useState({ name: "", email: "", businessType: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const res = await fetch(backendUrl + "/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Failed to join waitlist");
      setSent(true);
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] px-6 py-16">
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-sm">
        <h1 className="text-3xl font-black text-[#0F172A] mb-2">Join the Waitlist</h1>
        <p className="text-sm text-[#64748B] mb-8">
          Be the first to know when Flowora is ready for your business.
        </p>

        {sent ? (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-green-700 text-sm font-medium">
            You're on the list! We'll email you as soon as we're ready.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Name</span>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
              />
            </label>
            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Business Type</span>
              <select
                value={form.businessType}
                onChange={(e) => setForm({ ...form, businessType: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-[#185FA5] bg-white"
              >
                <option value="">Select a category</option>
                {BUSINESS_TYPES.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </label>

            {error && (
              <p className="text-sm text-red-600 font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#185FA5] text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform disabled:opacity-60"
            >
              {loading ? "Joining..." : "Join Waitlist"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Waitlist;
