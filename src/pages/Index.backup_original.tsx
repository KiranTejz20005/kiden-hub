import { useRef, useState, useEffect } from "react";
import { motion, useScroll, useTransform, useSpring, useInView } from "framer-motion";
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
  Star,
  Menu,
  X,
  ChevronRight,
  Target,
  Flame,
  Globe,
  Lock
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
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-background/80 backdrop-blur-lg border-b border-white/10 py-4" : "bg-transparent py-6"
        }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={kidenLogo} alt="Kiden" className="w-8 h-8 rounded-lg" />
          <span className="text-xl font-bold tracking-tight text-white">Kiden</span>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {["Features", "Templates", "Pricing"].map((item) => (
            <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">
              {item}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/auth" className="text-sm font-medium text-white hover:text-emerald-400 transition-colors">
            Log in
          </Link>
          <Link to="/auth">
            <Button className="bg-emerald-500 hover:bg-emerald-600 text-black font-semibold rounded-full px-6">
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
          className="md:hidden bg-background border-b border-white/10 overflow-hidden"
        >
          <div className="flex flex-col p-6 gap-4">
            {["Features", "Templates", "Pricing"].map((item) => (
              <a key={item} href={`#${item.toLowerCase()}`} onClick={() => setMobileMenuOpen(false)} className="text-lg font-medium text-gray-300">
                {item}
              </a>
            ))}
            <div className="h-px bg-white/10 my-2" />
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
            <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
              <Button className="w-full bg-emerald-500 text-black">Get Started</Button>
            </Link>
          </div>
        </motion.div>
      )}
    </motion.nav>
  );
};

const Hero = () => {
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 500], [0, 200]);
  const y2 = useTransform(scrollY, [0, 500], [0, -150]);

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center pt-32 pb-20 overflow-hidden">
      {/* Background Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            rotate: [0, 90, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-emerald-500/20 blur-[120px] rounded-full opacity-50"
        />
        <motion.div
          animate={{
            scale: [1, 1.5, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 100, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-blue-600/10 blur-[100px] rounded-full opacity-30"
        />
      </div>

      <div className="container relative z-10 px-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-8"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          v2.0 is live
        </motion.div>

        <motion.h1
          className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tighter text-white mb-6 leading-[1.1]"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
        >
          Build Habits. <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-500">
            Master Productivity.
          </span>
        </motion.h1>

        <motion.p
          className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          The modern tracker for high-performers. Visualize your progress, maintain streaks,
          and stay consistent with a design inspired by precision.
        </motion.p>

        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Link to="/auth">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-600 text-black text-base font-semibold h-12 px-8 rounded-full">
              Start for free
            </Button>
          </Link>
          <Button variant="outline" size="lg" className="border-white/10 hover:bg-white/5 text-white h-12 px-8 rounded-full gap-2 group">
            <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
            Watch demo
          </Button>
        </motion.div>

        {/* Dashboard Preview */}
        <motion.div
          className="mt-20 relative mx-auto max-w-5xl"
          initial={{ opacity: 0, y: 100, rotateX: 20 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
          style={{ perspective: "1000px" }}
        >
          <motion.div
            animate={{ y: [0, -20, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          >
            <div className="relative rounded-xl border border-white/10 bg-[#0A0A0A] shadow-2xl overflow-hidden aspect-[16/9] group">
              <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />

              {/* Mockup UI */}
              <div className="p-6 h-full flex gap-6">
                {/* Sidebar */}
                <div className="invisible md:visible w-64 flex flex-col gap-4 border-r border-white/5 pr-6">
                  <div className="h-8 w-32 bg-white/10 rounded-md animate-pulse" />
                  <div className="space-y-2 mt-4">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="h-10 w-full bg-white/5 rounded-lg" />
                    ))}
                  </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col gap-6">
                  <div className="flex gap-4">
                    <div className="flex-1 h-32 bg-emerald-500/10 border border-emerald-500/20 rounded-xl relative overflow-hidden">
                      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-30">
                        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                          <path d="M0 100 L0 50 Q 25 20, 50 50 T 100 30 L 100 100 Z" fill="#10b981" />
                        </svg>
                      </div>
                    </div>
                    <div className="w-1/3 h-32 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-4xl font-bold text-white">12</span>
                      <span className="text-xs text-gray-500 uppercase tracking-widest mt-1">Day Streak</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-6 w-24 bg-white/10 rounded" />
                      <div className="h-6 w-16 bg-emerald-500/20 rounded text-emerald-500 text-xs flex items-center justify-center">85%</div>
                    </div>
                    <div className="space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="w-5 h-5 rounded border border-white/20" />
                          <div className="h-4 w-full bg-white/5 rounded" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
            </div>
          </motion.div>

          {/* Glow under the image */}
          <div className="absolute -inset-10 bg-emerald-500/20 blur-[60px] -z-10 rounded-full opacity-60" />
        </motion.div>
      </div>
    </section>
  );
};

const Brands = () => {
  return (
    <div className="py-12 border-y border-white/5 bg-black/20">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm font-medium text-gray-500 mb-8 uppercase tracking-widest">Trusted by high performers at</p>
        <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          {["Acme Corp", "Infinite", "Flash Inc", "BoxLayer", "Vertex"].map((brand) => (
            <div key={brand} className="flex items-center gap-2 group cursor-default">
              <div className="w-6 h-6 bg-white/20 rounded-full group-hover:bg-emerald-500/50 transition-colors" />
              <span className="font-semibold text-lg text-white group-hover:text-emerald-400 transition-colors">{brand}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const Features = () => {
  return (
    <section id="features" className="py-32 relative">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">Powerful Features</h2>
          <p className="text-lg text-gray-400">Everything you need to build unbreakable habits, designed with the precision of One UI.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Large Card */}
          <motion.div
            className="md:col-span-2 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors group relative overflow-hidden"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400">
                <BarChart3 className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Visual Analytics</h3>
              <p className="text-gray-400 max-w-md">Deep dive into your productivity data with interactive charts that help you identify patterns.</p>
            </div>
            <div className="absolute right-0 bottom-0 w-1/2 h-full opacity-20 group-hover:opacity-40 transition-opacity">
              {/* Abstract Chart Graphic */}
              <svg viewBox="0 0 200 100" className="w-full h-full text-emerald-500 fill-current">
                <path d="M0 100 L20 80 L40 60 L60 90 L80 40 L100 50 L120 20 L200 10" fill="none" stroke="currentColor" strokeWidth="4" />
                <path d="M0 100 L20 80 L40 60 L60 90 L80 40 L100 50 L120 20 L200 10 V 100 Z" fill="url(#gradient)" opacity="0.5" />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="currentColor" />
                    <stop offset="100%" stopColor="transparent" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </motion.div>

          {/* Tall Card */}
          <motion.div
            className="md:col-span-1 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors group relative overflow-hidden" // Focus Mode
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400">
                <Clock className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Focus Mode</h3>
              <p className="text-gray-400">Integrated Pomodoro timer for deep work sessions.</p>

              <div className="mt-8 text-center text-5xl font-mono font-bold text-white/20 group-hover:text-emerald-500 transition-colors">
                25:00
              </div>
            </div>
          </motion.div>

          {/* Medium Card */}
          <motion.div
            className="md:col-span-1 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors group"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 text-emerald-400">
              <Smartphone className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Sync Everywhere</h3>
            <p className="text-gray-400 text-sm">Seamlessly switch between desktop, tablet, and mobile.</p>
          </motion.div>

          {/* Wide Card */}
          <motion.div
            className="md:col-span-2 p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-emerald-500/50 transition-colors group flex flex-col md:flex-row items-center gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex-1">
              <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center mb-6 text-orange-400">
                <Flame className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Streak Protection</h3>
              <p className="text-gray-400">Life happens. Freeze your streak for a day without losing your progress.</p>
            </div>
            <div className="flex gap-2">
              {['M', 'T', 'W', 'T', 'F'].map((day, i) => (
                <div key={day} className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${i < 3 ? 'bg-emerald-500 text-black' : 'bg-white/5 text-gray-500'}`}>
                  {day}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

const Templates = () => {
  const templates = [
    { title: "75 Hard", desc: "The ultimate mental toughness challenge.", users: "15k+", color: "bg-purple-500" },
    { title: "Deep Work", desc: "Structure your day for maximum cognitive output.", users: "20k+", color: "bg-blue-500" },
    { title: "Monk Mode", desc: "Eliminate distractions and isolate your attention span.", users: "8k+", color: "bg-amber-500" },
    { title: "Miracle Morning", desc: "Build habits that will transform your life before 8AM.", users: "12k+", color: "bg-emerald-500" },
  ];

  return (
    <section id="templates" className="py-20 bg-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">Start with a Proven Template</h2>
            <p className="text-gray-400">Clone top-performers' routines in one click.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/10"><ArrowRight className="rotate-180 w-4 h-4" /></Button>
            <Button variant="outline" size="icon" className="rounded-full border-white/10 hover:bg-white/10"><ArrowRight className="w-4 h-4" /></Button>
          </div>
        </div>

        <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar snap-x">
          {templates.map((t, i) => (
            <motion.div
              key={t.title}
              className="min-w-[300px] h-[400px] rounded-3xl relative overflow-hidden group cursor-pointer snap-start"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
            >
              <div className={`absolute inset-0 ${t.color} opacity-20 group-hover:opacity-30 transition-opacity`} />
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

              <div className="absolute bottom-0 left-0 p-8">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 block">{t.users} users</span>
                <h3 className="text-2xl font-bold text-white mb-2">{t.title}</h3>
                <p className="text-sm text-gray-300 mb-4">{t.desc}</p>
                <div className="flex gap-2">
                  <span className="px-2 py-1 rounded bg-white/10 text-xs text-white backdrop-blur">By Kiden</span>
                  <span className="px-2 py-1 rounded bg-white/10 text-xs text-white backdrop-blur">Verified</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const Pricing = () => {
  return (
    <section id="pricing" className="py-32">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-4xl font-bold text-white mb-4">Simple, Transparent Pricing</h2>
        <p className="text-gray-400 mb-16">Invest in your better self today.</p>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter */}
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-left">
            <h3 className="text-xl font-bold text-white mb-2">Starter</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-white">$0</span>
              <span className="text-gray-500">/mo</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">Perfect for tracking a few key habits.</p>
            <Button className="w-full bg-white/10 hover:bg-white/20 text-white mb-8 rounded-xl">Get Started</Button>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 3 habits limit</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Basic analytics</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> 7-day history</li>
            </ul>
          </div>

          {/* Pro */}
          <div className="p-8 rounded-3xl bg-emerald-500/10 border border-emerald-500/50 text-left relative transform md:-translate-y-4">
            <div className="absolute top-0 right-0 p-4">
              <span className="bg-emerald-500 text-black text-xs font-bold px-3 py-1 rounded-full">POPULAR</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Pro</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-white">$9</span>
              <span className="text-gray-500">/mo</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">Unlock your full potential with data.</p>
            <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-black mb-8 rounded-xl font-bold">Try Pro Free</Button>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Unlimited habits</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Advanced visual analytics</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Unlimited history</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Focus mode (Timer)</li>
            </ul>
          </div>

          {/* Team */}
          <div className="p-8 rounded-3xl bg-white/5 border border-white/10 text-left">
            <h3 className="text-xl font-bold text-white mb-2">Team</h3>
            <div className="flex items-baseline gap-1 mb-6">
              <span className="text-4xl font-bold text-white">$29</span>
              <span className="text-gray-500">/mo</span>
            </div>
            <p className="text-sm text-gray-400 mb-6">Accountability groups and challenges.</p>
            <Button className="w-full bg-white/10 hover:bg-white/20 text-white mb-8 rounded-xl">Contact Sales</Button>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Everything in Pro</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Up to 10 members</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Shared leaderboards</li>
              <li className="flex items-center gap-2"><Check className="w-4 h-4 text-emerald-500" /> Team challenges</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-20 border-t border-white/10 bg-black">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-20">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-6 h-6 bg-emerald-500 rounded-md" />
              <span className="text-xl font-bold text-white">Kiden</span>
            </div>
            <p className="text-gray-400 text-sm">Designed to be obsessed.</p>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Product</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-emerald-500">Features</a></li>
              <li><a href="#" className="hover:text-emerald-500">Templates</a></li>
              <li><a href="#" className="hover:text-emerald-500">Pricing</a></li>
              <li><a href="#" className="hover:text-emerald-500">Changelog</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Resources</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-emerald-500">Documentation</a></li>
              <li><a href="#" className="hover:text-emerald-500">API</a></li>
              <li><a href="#" className="hover:text-emerald-500">Community</a></li>
            </ul>
          </div>
          <div>
            <h4 className="text-white font-bold mb-6">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-400">
              <li><a href="#" className="hover:text-emerald-500">Privacy</a></li>
              <li><a href="#" className="hover:text-emerald-500">Terms</a></li>
            </ul>
          </div>
        </div>
        <div className="flex flex-col md:flex-row items-center justify-between pt-8 border-t border-white/10">
          <p className="text-gray-500 text-sm">© 2026 Kiden Inc. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="text-gray-500 hover:text-white"><Globe className="w-5 h-5" /></a>
            <a href="#" className="text-gray-500 hover:text-white"><Zap className="w-5 h-5" /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}

const Index = () => {
  return (
    <main className="min-h-screen bg-[#020817] text-foreground selection:bg-emerald-500/30 selection:text-emerald-200">
      <Navbar />
      <Hero />
      <Brands />
      <Features />
      <Templates />
      <Pricing />

      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-emerald-500/5" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Ready to level up?</h2>
          <p className="text-gray-400 mb-10">Join 10,000+ high performers building their future with Kiden.</p>
          <Link to="/auth">
            <Button size="lg" className="bg-white text-black hover:bg-gray-200 rounded-full h-14 px-10 text-lg font-bold">
              Get Started Now
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
};

export default Index;