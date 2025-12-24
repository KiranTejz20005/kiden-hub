import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { 
  FolderSync, 
  Bot, 
  Users, 
  Layout, 
  MessageSquareText, 
  Zap, 
  Search, 
  PenTool, 
  Columns, 
  Video 
} from "lucide-react";

const features = [
  {
    icon: FolderSync,
    title: "Intelligent File Storage",
    description: "All web links and files are transcribed and auto-tagged in your workspace.",
    size: "large",
  },
  {
    icon: Bot,
    title: "Best Models In One Chat",
    description: "Move all your chats to a workspace where your files live. Reference anything from YouTube to Instagram.",
    size: "large",
  },
  {
    icon: Users,
    title: "Team Members",
    description: "Collaborate on videos, pages, canvases. One workspace for your entire creative process.",
    size: "medium",
  },
  {
    icon: Layout,
    title: "Create On Canvas",
    description: "Outlines, content, and research all in one view. Connect it all to AI chats.",
    size: "medium",
  },
  {
    icon: Video,
    title: "Video Commenting",
    description: "Comment and draw on specific video frames to pass off feedback to your team.",
    size: "small",
  },
  {
    icon: Zap,
    title: "Quick Capture",
    description: "Save ideas and web links fast instead of in one long messy note.",
    size: "small",
  },
  {
    icon: Search,
    title: "Visual Search",
    description: "Resurface the exact frame by describing what you're looking for.",
    size: "small",
  },
  {
    icon: PenTool,
    title: "Writing & Notes",
    description: "Write content and outlines in a markdown editor you know and love.",
    size: "small",
  },
  {
    icon: Columns,
    title: "Multiple Panes",
    description: "Open writing, research, and footage all in one view. Close all your tabs.",
    size: "small",
  },
];

const FeaturesGrid = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section ref={ref} id="features" className="py-32 relative">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="font-serif text-4xl sm:text-5xl font-medium mb-4">
            Everything You Need
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A complete creative workspace designed to replace your scattered tools
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
              className={`glass rounded-2xl p-6 card-hover ${
                feature.size === "large" ? "lg:col-span-1 lg:row-span-1" : ""
              }`}
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;
