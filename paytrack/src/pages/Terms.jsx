import React from 'react';

const Terms = () => (
  <div className="min-h-screen bg-[#F8FAFF] px-6 py-16">
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-[#E2E8F0] p-8 shadow-sm">
      <h1 className="text-3xl font-black text-[#0F172A] mb-2">Terms of Service</h1>
      <p className="text-sm text-slate-400 mb-8">Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="space-y-6 text-sm text-[#475569] leading-relaxed">
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">1. Acceptance of Terms</h2>
          <p>By accessing or using Flowora ("the Service"), operated by FloworaX, you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">2. Description of Service</h2>
          <p>Flowora is a business management platform for service businesses, offering booking management, invoicing, sales tracking, expense tracking, and payment processing via Paystack.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">3. Account Registration</h2>
          <p>You must provide accurate information when creating an account and are responsible for maintaining the confidentiality of your login credentials and all activity under your account.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">4. Subscription Plans and Billing</h2>
          <p>Flowora offers Free, Pro, and Business tiers with different feature limits. Paid subscriptions are billed as described at checkout. You may cancel at any time; access continues until the end of the current billing period.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">5. Payments</h2>
          <p>Payments are processed through Paystack. Flowora does not store your card details. You are responsible for any fees charged by Paystack or your bank.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">6. Acceptable Use</h2>
          <p>You agree not to use the Service for unlawful purposes, to misrepresent your business, or to attempt to disrupt or reverse-engineer the Service.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">7. Data Ownership</h2>
          <p>You retain ownership of your business data. We process it to provide the Service, as described in our Privacy Policy.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">8. Limitation of Liability</h2>
          <p>Flowora is provided "as is" without warranties of any kind. FloworaX is not liable for indirect, incidental, or consequential damages arising from use of the Service.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">9. Termination</h2>
          <p>We may suspend or terminate accounts that violate these terms. You may close your account at any time.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">10. Changes to These Terms</h2>
          <p>We may update these Terms from time to time. Continued use of the Service after changes constitutes acceptance.</p>
        </section>
        <section>
          <h2 className="font-black text-[#0F172A] text-lg mb-2">11. Contact</h2>
          <p>Questions about these Terms can be sent to <a href="mailto:floworax2@gmail.com" className="text-[#185FA5] font-bold">hello@floworax.com</a>.</p>
        </section>
      </div>
    </div>
  </div>
);

export default Terms;