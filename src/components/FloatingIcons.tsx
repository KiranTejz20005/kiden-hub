import { motion } from "framer-motion";

const icons = [
  { name: "Notion", letter: "N", position: "left-[5%] top-[25%]", bg: "bg-foreground", text: "text-background" },
  { name: "Slack", icon: "slack", position: "left-[3%] bottom-[20%]", bg: "bg-card/60", text: "text-foreground" },
  { name: "ChatGPT", icon: "gpt", position: "right-[8%] top-[20%]", bg: "bg-card/60", text: "text-foreground" },
  { name: "Evernote", letter: "E", position: "right-[5%] bottom-[25%]", bg: "bg-card/60", text: "text-foreground" },
];

const FloatingIcons = () => {
  return (
    <>
      {/* Left Icons */}
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute left-[8%] top-[30%] hidden lg:block"
      >
        <div className="floating-icon">
          <span className="font-serif text-xl font-bold">N</span>
        </div>
        <span className="text-xs text-muted-foreground mt-2 block text-center tracking-widest">NOTION</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute left-[5%] bottom-[25%] hidden lg:block"
      >
        <div className="floating-icon">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6 15a2 2 0 0 1-2 2a2 2 0 0 1-2-2a2 2 0 0 1 2-2h2v2zm1 0a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-5zm2-8a2 2 0 0 1-2-2a2 2 0 0 1 2-2a2 2 0 0 1 2 2v2H9zm0 1a2 2 0 0 1 2 2a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2a2 2 0 0 1 2-2h5zm8 2a2 2 0 0 1 2-2a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-2v-2zm-1 0a2 2 0 0 1-2 2a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2a2 2 0 0 1 2 2v5zm-2 8a2 2 0 0 1 2 2a2 2 0 0 1-2 2a2 2 0 0 1-2-2v-2h2zm0-1a2 2 0 0 1-2-2a2 2 0 0 1 2-2h5a2 2 0 0 1 2 2a2 2 0 0 1-2 2h-5z"/>
          </svg>
        </div>
        <span className="text-xs text-muted-foreground mt-2 block text-center tracking-widest">SLACK</span>
      </motion.div>

      {/* Right Icons */}
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="absolute right-[8%] top-[28%] hidden lg:block"
      >
        <div className="floating-icon">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
            <circle cx="12" cy="12" r="3"/>
            <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
        </div>
        <span className="text-xs text-muted-foreground mt-2 block text-center tracking-widest">CHATGPT</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="absolute right-[5%] bottom-[30%] hidden lg:block"
      >
        <div className="floating-icon bg-primary/10">
          <span className="font-serif text-lg">E</span>
        </div>
        <span className="text-xs text-muted-foreground mt-2 block text-center tracking-widest">EVERNOTE</span>
      </motion.div>
    </>
  );
};

export default FloatingIcons;