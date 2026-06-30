
import { Shield } from 'lucide-react';

const Privacy = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-24">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Privacy Policy</h1>
          <p className="text-white/40 font-medium uppercase tracking-widest text-xs">Last Updated: May 15, 2026</p>
        </header>

        <section className="space-y-6 text-white/70 leading-relaxed">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">1. Introduction</h2>
            <p>
              Kiden Hub ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, and safeguard your information when you use our productivity platform.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">2. Information We Collect</h2>
            <p>
              We collect information that you provide directly to us, such as when you create an account, connect third-party services like Google Calendar, or save notes and research data.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Account Data:</strong> Email address, name, and profile information via Supabase Auth.</li>
              <li><strong>Calendar Data:</strong> If you connect Google Calendar, we access your calendar list and events to display and sync them within your workspace.</li>
              <li><strong>Content Data:</strong> Research boards, notes, and uploaded files.</li>
            </ul>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">3. Google API Disclosure</h2>
            <p>
              Kiden Hub's use and transfer to any other app of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy#additional_requirements_for_specific_api_scopes" className="text-emerald-500 hover:underline">Google API Services User Data Policy</a>, including the Limited Use requirements.
            </p>
            <p>
              We do not share your Google Calendar data with third-party AI models for training purposes without your explicit consent.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">4. Data Security</h2>
            <p>
              We implement industry-standard security measures, including encryption at rest and in transit, to protect your personal data and OAuth tokens.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">5. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at: kittuplayz123@gmail.com
            </p>
          </div>
        </section>

        <footer className="pt-12 border-t border-white/5 text-white/20 text-xs">
          &copy; 2026 Kiden Hub. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default Privacy;
