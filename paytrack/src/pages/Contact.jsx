import React, { useState } from "react";

const Contact = () => {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sent, setSent] = useState(false);

  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      const res = await fetch(backendUrl + "/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to send message");
      setSent(true);
    } catch (err) {
      setError("Something went wrong. Please try again or email hello@floworax.com directly.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] px-6 py-16">
      <div className="max-w-xl mx-auto bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-sm">
        <h1 className="text-3xl font-black text-[#0F172A] mb-2">Contact Us</h1>
        <p className="text-sm text-[#64748B] mb-8">Questions, feedback, or support. We would love to hear from you.</p>

        {sent ? (
          <div className="rounded-2xl bg-green-50 border border-green-200 p-4 text-green-700 text-sm font-medium">
            Thanks! We will get back to you within 24 hours. You can also reach us directly at{" "}
            <a href="mailto:hello@floworax.com" className="font-bold">hello@floworax.com</a>.
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
              <span className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">Message</span>
              <textarea
                required
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="mt-2 w-full rounded-2xl border border-[#E2E8F0] px-4 py-3 text-sm outline-none focus:border-[#185FA5]"
              />
            </label>
            <button
              type="submit"
              className="w-full bg-[#185FA5] text-white py-3 rounded-2xl font-black text-sm active:scale-95 transition-transform"
            >
              Send Message
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default Contact;
