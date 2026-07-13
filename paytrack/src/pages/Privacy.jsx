import React from 'react';

const Privacy = () => (
  <div className="min-h-screen bg-[#F8FAFF] px-6 py-16">
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-sm">
      <h1 className="text-3xl font-black text-[#0F172A] mb-2">Privacy Policy</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="space-y-6 text-sm text-[#475569] leading-relaxed">
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">1. Information We Collect</h2>
          <p>We collect information you provide directly: name, email, phone number, business details, and transaction data you record in the app. We also collect basic usage data (pages visited, actions taken) to improve the Service.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">2. How We Use Your Information</h2>
          <p>We use your data to provide and improve the Service, process payments via Paystack, send transactional emails (booking confirmations, receipts), and communicate important account updates.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">3. Data Sharing</h2>
          <p>We do not sell your personal data. We share data only with service providers necessary to run Flowora (e.g. Paystack for payments, MongoDB Atlas for storage, email providers for notifications), each bound by their own privacy commitments.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">4. Data Storage and Security</h2>
          <p>Your data is stored on MongoDB Atlas with industry-standard security practices, including encrypted passwords and rate-limited, sanitized API access.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">5. Your Rights</h2>
          <p>You may access, correct, export, or delete your data at any time by contacting us or using in-app settings. You may close your account and request full data deletion.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">6. Cookies</h2>
          <p>We use cookies and local storage for authentication and app functionality. See our <a href="/cookies" className="text-[#185FA5] font-bold">Cookie Policy</a> for details.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">7. Children's Privacy</h2>
          <p>Flowora is intended for business use by adults and is not directed at children under 18.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">8. Changes to This Policy</h2>
          <p>We may update this policy periodically. Material changes will be communicated via email or in-app notice.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">9. Contact</h2>
          <p>Privacy questions: <a href="mailto:floworax2@gmail.com" className="text-[#185FA5] font-bold">floworax2@gmail.com</a>.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Privacy;