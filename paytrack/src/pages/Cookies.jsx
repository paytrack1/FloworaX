import React from "react";

const Cookies = () => (
  <div className="min-h-screen bg-[#F8FAFF] px-6 py-16">
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-sm">
      <h1 className="text-3xl font-black text-[#0F172A] mb-2">Cookie Policy</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: a recent date</p>

      <div className="space-y-6 text-sm text-[#475569] leading-relaxed">
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">What Are Cookies</h2>
          <p>Cookies are small files stored on your device that help websites remember information about your visit.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">How We Use Cookies</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Essential cookies:</strong> keep you logged in and secure your session.</li>
            <li><strong>Functional cookies:</strong> remember preferences like your active dashboard tab.</li>
            <li><strong>Analytics cookies:</strong> help us understand how the Service is used.</li>
          </ul>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">Managing Cookies</h2>
          <p>You can control or delete cookies through your browser settings.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">Contact</h2>
          <p>Questions:floworax2@gmail.com</p>
        </section>
      </div>
    </div>
  </div>
);

export default Cookies;
