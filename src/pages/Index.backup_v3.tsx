import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useInView } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Check,
  Play,
  Zap,
  BarChart3,
  Calendar,
  Clock,
  Shield,
  Smartphone,
  Users,
  Target,
  Flame,
  Globe,
  Lock,
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Layout,
  Sun
} from "lucide-react";
import kidenLogo from "@/assets/kiden-logo.png";

// --- Components ---

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-[#0b0c15]/80 backdrop-blur-md border-b border-white/5 py-4" : "bg-transparent py-6"
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
            <span className="font-bold text-black text-lg">K</span>
          </div>
          <span className="text-xl font-bold tracking-tight text-white">Kaiden</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-10">
          {["Features", "Templates", "Pricing"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-gray-400 hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/auth">
            <Button className="bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold rounded-full px-6 transition-all duration-300 shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)]">
              Get Started
            </Button>
          </Link>
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="md:hidden bg-[#0b0c15] border-b border-white/5 overflow-hidden absolute top-full left-0 right-0"
        >
          <div className="flex flex-col p-6 gap-6">
            {["Features", "Templates", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-300">
                {item}
              </a>
            ))}
            <div className="h-px bg-white/5 my-2" />
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-[#22c55e] text-black font-bold h-12 rounded-xl">Get Started</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-screen flex flex-col items-center pt-40 pb-20 overflow-hidden bg-[#050505]">
      {/* Background Gradients */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-green-500/20 blur-[120px] rounded-full opacity-30 pointer-events-none" />

      <div className="container relative z-10 px-4 text-center max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold uppercase tracking-wider mb-8 text-green-400"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          v2.0 is live
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white mb-8 leading-[1.1]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Build Habits. <br />
          <span className="text-gray-400">Master Productivity.</span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed font-light"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          The modern tracker for high-performers. Visualize your progress, maintain streaks,
          and stay consistent with a design inspired by precision.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Link to="/auth">
            <Button size="lg" className="bg-[#22c55e] hover:bg-[#16a34a] text-black text-base font-bold h-12 px-8 rounded-full shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all">
              Start for free
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="border-white/10 bg-white/5 hover:bg-white/10 text-white h-12 px-8 rounded-full gap-2 group font-medium">
            <div className="w-5 h-5 rounded-full border border-white/30 flex items-center justify-center">
              <Play className="w-2 h-2 fill-white ml-0.5" />
            </div>
            Watch demo
          </Button>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          className="relative mx-auto w-full max-w-4xl"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Card Container */}
          <div className="relative rounded-2xl bg-[#0a0a0a] border border-white/10 aspect-[2/1] overflow-hidden shadow-2xl flex items-center justify-center">
            {/* Green Glow Inner */}
            <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-green-500/10 to-transparent pointer-events-none" />

            {/* Content - Mock Graph */}
            <div className="relative w-full h-full p-8 flex items-center justify-center">
              {/* Left UI Placeholders */}
              <div className="absolute left-8 top-8 bottom-8 w-16 flex flex-col gap-3 opacity-20">
                <div className="w-full h-8 bg-white/20 rounded-md" />
                <div className="w-full h-4 bg-white/10 rounded-md" />
                <div className="w-full h-4 bg-white/10 rounded-md" />
                <div className="w-full h-4 bg-white/10 rounded-md" />
              </div>

              {/* Center Graph */}
              <div className="w-full max-w-lg h-32 relative">
                {/* CSS Line Graph */}
                <svg className="w-full h-full overflow-visible">
                  <path d="M0 100 Q 100 100, 150 70 T 300 40 T 450 10" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" />
                  {/* Glow under line */}
                  <path d="M0 100 Q 100 100, 150 70 T 300 40 T 450 10 V 150 H 0 Z" fill="url(#graphGlow)" opacity="0.2" />
                  <defs>
                    <linearGradient id="graphGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22c55e" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Right Stats */}
              <div className="absolute right-12 top-1/2 -translate-y-1/2 flex flex-col gap-6">
                <div className="bg-[#111] border border-white/10 p-4 rounded-xl w-32 backdrop-blur-sm">
                  <h4 className="text-3xl font-bold text-white mb-1">12</h4>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">Day Streak</span>
                </div>
                <div className="bg-[#111] border border-white/10 p-4 rounded-xl w-32 backdrop-blur-sm">
                  <h4 className="text-3xl font-bold text-green-500 mb-1">85%</h4>
                  <span className="text-[10px] uppercase tracking-widest text-gray-500">Completion</span>
                </div>
              </div>
            </div>
          </div>

          {/* Green Glow Behind Card */}
          <div className="absolute -inset-0.5 bg-green-500/20 blur-2xl -z-10 rounded-3xl opacity-50" />
        </motion.div>

        {/* Trusted By */}
        <div className="mt-20 pt-10 border-t border-white/5 w-full">
          <p className="text-xs font-semibold text-gray-600 uppercase tracking-[0.2em] mb-8">Trusted by 1000+ performers at</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-40 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500">
            {['Acme Corp', '∞ Infinite', '⚡ Flash Inc', '❖ BoxLayer', '◉ Vertex'].map((logo, i) => (
              <span key={i} className="text-sm font-bold text-white font-mono">{logo}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-32 bg-[#050505]">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">Powerful Features</h2>
          <p className="text-lg text-gray-500">Everything you need to build unbreakable habits, designed with the precision of One UI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-auto md:h-[500px]">
          {/* Card 1: Visual Analytics (Wide) */}
          <div className="md:col-span-7 bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-4 text-green-500">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Visual Analytics</h3>
              <p className="text-sm text-gray-500 max-w-sm">Keep a close tab on your productivity data with interactive charts that help you identify patterns.</p>
            </div>

            {/* Abstract Graph BG */}
            <div className="absolute bottom-0 right-0 w-3/4 h-32 opacity-20 group-hover:opacity-40 transition-opacity">
              <svg className="w-full h-full" viewBox="0 0 200 100" preserveAspectRatio="none">
                <path d="M0 100 C 50 80, 100 20, 200 40" fill="none" stroke="#22c55e" strokeWidth="2" />
                <path d="M0 100 C 50 80, 100 20, 200 40 V 100 H 0 Z" fill="url(#greenGrad)" opacity="0.5" />
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22c55e" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>

          {/* Card 2: Focus Mode */}
          <div className="md:col-span-5 bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 text-white">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Focus Mode</h3>
              <p className="text-sm text-gray-500">Integrated Pomodoro timer for deep work sessions.</p>
            </div>
            <div className="absolute bottom-4 right-4 text-6xl font-bold text-[#111] select-none group-hover:text-[#1a1a1a] transition-colors">25:00</div>
          </div>

          {/* Card 3: Sync Everywhere */}
          <div className="md:col-span-5 bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-white/5 flex items-center justify-center mb-4 text-white">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sync Everywhere</h3>
            <p className="text-sm text-gray-500">Seamlessly switch between desktop, tablet, and mobile.</p>
          </div>

          {/* Card 4: Streak Protection */}
          <div className="md:col-span-7 bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 relative overflow-hidden group hover:border-white/20 transition-colors flex items-center justify-between">
            <div>
              <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-4 text-orange-500">
                <Flame className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Streak Protection</h3>
              <p className="text-sm text-gray-500 max-w-xs">Life happens. Freeze your streak for a day without losing your progress.</p>
            </div>
            <div className="flex gap-1">
              <div className="w-8 h-8 rounded bg-green-900/40 text-green-500 flex items-center justify-center text-xs font-bold border border-green-500/20">M</div>
              <div className="w-8 h-8 rounded bg-green-500 text-black flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(34,197,94,0.4)]">T</div>
              <div className="w-8 h-8 rounded bg-green-900/40 text-green-500 flex items-center justify-center text-xs font-bold border border-green-500/20">W</div>
              <div className="w-8 h-8 rounded bg-[#111] text-gray-600 flex items-center justify-center text-xs font-bold border border-white/5">T</div>
              <div className="w-8 h-8 rounded bg-[#111] text-gray-600 flex items-center justify-center text-xs font-bold border border-white/5">F</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Templates = () => {
  const templates = [
    { title: "75 Hard", sub: "FITNESS", desc: "The ultimate mental toughness challenge.", bg: "bg-zinc-800" },
    { title: "Deep Work", sub: "PRODUCTIVITY", desc: "Plan your day for maximum cognitive output.", bg: "bg-blue-900/20" },
    { title: "Monk Mode", sub: "FOCUS", desc: "Eliminate distractions and isolate your attention span.", bg: "bg-amber-900/20" },
    { title: "Miracle Morning", sub: "ROUTINE", desc: "Start your day with purpose and intention.", bg: "bg-purple-900/20" },
  ];

  return (
    <section id="templates" className="py-20 bg-[#050505]">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Start with a Proven Template</h2>
            <p className="text-gray-500">Clone top-performers' routines in one click.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white"><ChevronRight className="rotate-180 w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white"><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x">
          {templates.map((t, i) => (
            <div key={i} className="min-w-[320px] h-[420px] rounded-3xl relative overflow-hidden group cursor-pointer border border-white/10 hover:border-white/20 transition-all bg-[#0a0a0a]">
              {/* Image Placeholder */}
              <div className="h-1/2 w-full bg-gradient-to-b from-white/5 to-transparent flex items-center justify-center">
                <Layout className={`w-16 h-16 ${i === 0 ? 'text-green-500' : 'text-gray-700'}`} />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8 h-1/2 bg-[#0a0a0a]">
                <span className={`text-[10px] font-bold uppercase tracking-widest mb-3 block ${i === 0 ? 'text-green-500' : i === 1 ? 'text-blue-500' : i === 2 ? 'text-amber-500' : 'text-purple-500'
                  }`}>{t.sub}</span>
                <h3 className="text-2xl font-bold text-white mb-3">{t.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-4">{t.desc}</p>
                <div className="flex gap-2 mt-auto">
                  <span className="text-[10px] px-2 py-1 rounded bg-white/10 text-gray-400 border border-white/5">By Kaiden</span>
                  <span className="text-[10px] px-2 py-1 rounded bg-white/10 text-gray-400 border border-white/5">Verified</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  return (
    <section id="pricing" className="py-32 bg-[#050505]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
          <p className="text-gray-500">Invest in your better self today.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto items-start">
          {/* Starter */}
          <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 text-left hover:border-white/20 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-gray-500 text-sm font-medium">/mo</span>
            </div>
            <p className="text-sm text-gray-500 mb-8 h-10">Perfect for building a few key habits.</p>
            <ul className="space-y-4 text-sm text-gray-400 mb-10">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> 3 habits limit</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Basic analytics</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> 7-day history</li>
            </ul>
            <Button className="w-full bg-transparent border border-white/20 hover:bg-white/5 text-white rounded-xl h-12 font-medium">Get Started</Button>
          </div>

          {/* Pro */}
          <div className="p-8 rounded-3xl bg-[#0d120f] border border-green-500/30 text-left relative transform md:-translate-y-6 shadow-[0_0_40px_rgba(34,197,94,0.05)]">
            <div className="absolute top-0 right-0 p-6">
              <span className="bg-green-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wide">Popular</span>
            </div>
            <h3 className="text-xl font-bold text-green-500 mb-2">Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-5xl font-bold text-white">$9</span>
              <span className="text-gray-500 text-sm font-medium">/mo</span>
            </div>
            <p className="text-sm text-gray-400 mb-8 h-10">Unlock your full potential with data.</p>
            <ul className="space-y-4 text-sm text-gray-300 mb-10">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Unlimited habits</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Advanced visual analytics</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Unlimited history</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Focus mode (Timer)</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Streak repair (1/mo)</li>
            </ul>
            <Button className="w-full bg-green-500 hover:bg-green-600 text-black rounded-xl font-bold h-12 shadow-[0_0_20px_rgba(34,197,94,0.2)]">Try Pro Free</Button>
          </div>

          {/* Team */}
          <div className="p-8 rounded-3xl bg-[#0a0a0a] border border-white/10 text-left hover:border-white/20 transition-colors">
            <h3 className="text-xl font-bold text-white mb-2">Team</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-white">$29</span>
              <span className="text-gray-500 text-sm font-medium">/mo</span>
            </div>
            <p className="text-sm text-gray-500 mb-8 h-10">Accountability groups and challenges.</p>
            <ul className="space-y-4 text-sm text-gray-400 mb-10">
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Everything in Pro</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Up to 10 members</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Shared leaderboards</li>
              <li className="flex items-center gap-3"><Check className="w-4 h-4 text-green-500" /> Team challenges</li>
            </ul>
            <Button className="w-full bg-transparent border border-white/20 hover:bg-white/5 text-white rounded-xl h-12 font-medium">Contact Sales</Button>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-20 border-t border-white/5 bg-[#050505]">
      <div className="container mx-auto px-4">
        {/* Footer Top CTA */}
        <div className="flex flex-col items-center justify-center text-center mb-24 bg-[#0a0a0a] rounded-3xl p-12 border border-white/5 relative overflow-hidden">
          <div className="absolute inset-0 bg-green-500/5" />
          <div className="relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">Ready to level up?</h2>
            <p className="text-gray-500 mb-8">Join 10,000+ high performers building their future with Kaiden.</p>
            <Link to="/auth">
              <Button className="bg-white hover:bg-gray-200 text-black font-bold h-12 px-8 rounded-full">
                Get Started Now
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-20">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-green-500 rounded-md flex items-center justify-center">
                <span className="font-bold text-black text-xs">K</span>
              </div>
              <span className="text-xl font-bold text-white">Kaiden</span>
            </div>
            <p className="text-gray-500 text-sm">Designed to be obsessed.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-green-500 transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-green-500 transition-colors">Templates</a></li>
              <li><a href="#" className="hover:text-green-500 transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-green-500 transition-colors">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-green-500 transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-green-500 transition-colors">API</a></li>
              <li><a href="#" className="hover:text-green-500 transition-colors">Community</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><a href="#" className="hover:text-green-500 transition-colors">Privacy</a></li>
              <li><a href="#" className="hover:text-green-500 transition-colors">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/5">
          <p className="text-gray-600 text-sm">© 2026 Kaiden Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-600 hover:text-white transition-colors"><Globe className="w-5 h-5" /></a>
            <a href="#" className="text-gray-600 hover:text-white transition-colors"><Zap className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}

const Index = () => {
  return (
    <main className="min-h-screen bg-[#050505] text-white selection:bg-green-500/30 selection:text-green-200 font-sans">
      <Navbar />
      <Hero />
      <Features />
      <Templates />
      <Pricing />
      <Footer />
    </main>
  );
};

export default Index;