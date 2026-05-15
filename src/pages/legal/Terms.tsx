import { motion } from 'framer-motion';
import { FileText } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white p-8 md:p-24">
      <div className="max-w-3xl mx-auto space-y-12">
        <header className="space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
            <FileText className="w-6 h-6 text-blue-500" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight">Terms of Service</h1>
          <p className="text-white/40 font-medium uppercase tracking-widest text-xs">Last Updated: May 15, 2026</p>
        </header>

        <section className="space-y-6 text-white/70 leading-relaxed">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Kiden Hub, you agree to be bound by these Terms of Service and all applicable laws and regulations.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">2. User Accounts</h2>
            <p>
              You are responsible for maintaining the confidentiality of your account and password. You agree to accept responsibility for all activities that occur under your account.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">3. Third-Party Services</h2>
            <p>
              Kiden Hub integrates with third-party services like Google Calendar. Your use of those services is subject to their respective terms and privacy policies.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">4. Intellectual Property</h2>
            <p>
              The content, features, and functionality of Kiden Hub are owned by Kiden Hub and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-semibold text-white">5. Termination</h2>
            <p>
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.
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

export default Terms;
