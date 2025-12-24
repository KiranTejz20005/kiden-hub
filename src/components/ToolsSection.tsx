import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";

const floatingIcons = [
  { name: "Miro", bg: "bg-[#050038]", position: "left-[15%] top-[15%]", icon: "M" },
  { name: "Drive", bg: "bg-white", position: "left-[20%] top-[45%]", isGoogle: true },
  { name: "Notion", bg: "bg-black", position: "left-[25%] bottom-[25%]", icon: "N" },
  { name: "Miro", bg: "bg-[#FFD02F]", position: "left-[18%] bottom-[10%]", icon: "M" },
  { name: "ChatGPT", bg: "bg-white", position: "right-[22%] top-[12%]", isGPT: true },
  { name: "NotebookLM", bg: "bg-[#FF7A00]", position: "right-[15%] top-[35%]", icon: "✳" },
  { name: "Figma", bg: "bg-white", position: "right-[20%] bottom-[30%]", icon: "◆" },
  { name: "Evernote", bg: "bg-white", position: "right-[18%] bottom-[10%]", isEvernote: true },
];

const ToolsSection = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} className="py-32 relative overflow-hidden">
      {/* Floating Icons */}
      {floatingIcons.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={isInView ? { opacity: 1, scale: 1 } : {}}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          className={`absolute ${item.position} hidden lg:block`}
        >
          <div className={`w-14 h-14 rounded-2xl ${item.bg} flex items-center justify-center shadow-xl`}>
            {item.isGoogle && (
              <svg className="w-7 h-7" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            {item.isGPT && (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#10A37F">
                <path d="M22.2 12c0 5.5-4.5 10-10 10S2.2 17.5 2.2 12s4.5-10 10-10 10 4.5 10 10zm-10-6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z"/>
              </svg>
            )}
            {item.isEvernote && (
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="#00A82D">
                <path d="M8.667 4.333c-.92 0-1.667.747-1.667 1.667v12c0 .92.747 1.667 1.667 1.667h6.666c.92 0 1.667-.747 1.667-1.667V8.5L13.5 4.333H8.667z"/>
              </svg>
            )}
            {item.icon && !item.isGoogle && !item.isGPT && !item.isEvernote && (
              <span className="text-xl font-bold text-black">{item.icon}</span>
            )}
          </div>
        </motion.div>
      ))}

      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          {/* Eyebrow */}
          <p className="text-sm text-muted-foreground tracking-widest mb-6">
            2015 IS OVER...
          </p>

          {/* Headline */}
          <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-medium mb-8">
            <span className="text-foreground">You Don't Need</span>
            <br />
            <span className="text-foreground">7+ Tools And Tabs</span>
          </h2>

          {/* Description */}
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-6">
            One file storage app. Three AI chat subscriptions. Endless tabs for research,
            project outlines, and notes.
          </p>

          <p className="text-lg text-foreground italic">
            It doesn't need to be like this.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default ToolsSection;