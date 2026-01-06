import { useEffect, useRef } from "react";
import { Code, Search, Sparkles } from "lucide-react";

const Commands = () => {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up");
          }
        });
      },
      { threshold: 0.1 }
    );

    const elements = sectionRef.current?.querySelectorAll(".animate-on-scroll");
    elements?.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative">
      <div className="container mx-auto px-6 lg:px-12">
        {/* Section Header */}
        <div className="text-center mb-12">
          <div className="animate-on-scroll opacity-0 section-label mb-4">
            Commands
          </div>
          <h2 className="animate-on-scroll opacity-0 text-3xl md:text-4xl lg:text-5xl font-light leading-tight mb-4">
            Slice It Your Way{" "}
            <span className="font-serif italic text-gradient">With Commands.</span>
          </h2>
          <p className="animate-on-scroll opacity-0 text-muted-foreground text-base md:text-lg max-w-xl mx-auto">
            Build your own AI workflows with Commands. Define what you want
            once, then run it instantly whenever you need it.
          </p>
        </div>

        {/* Command Preview Box */}
        <div className="animate-on-scroll opacity-0 mb-10">
          <div className="rounded-xl bg-card border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-secondary border border-border">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm">AI Commands</span>
              </div>
              <div className="h-px flex-1 bg-border" />
            </div>
            
            {/* Commands List */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                <Code className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Generate Code</span>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary ml-auto">
                  Cursor
                </span>
              </div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border">
                <Search className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium">Research Topic</span>
                <span className="text-xs px-2 py-0.5 rounded bg-primary/10 text-primary ml-auto">
                  Perplexity
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-2 gap-4">
          <div className="animate-on-scroll opacity-0 rounded-xl bg-card border border-border p-6 hover:border-primary/30 transition-colors">
            <Code className="w-8 h-8 text-primary mb-4" />
            <h4 className="text-lg font-medium mb-2">Code Faster With Cursor</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Trigger Cursor agents directly from your tasks to automatically
              draft code changes based on your requirements.
            </p>
          </div>
          <div className="animate-on-scroll opacity-0 rounded-xl bg-card border border-border p-6 hover:border-primary/30 transition-colors">
            <Search className="w-8 h-8 text-primary mb-4" />
            <h4 className="text-lg font-medium mb-2">Make Better Research</h4>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Let Kiden run your research and collect all of it directly into
              your tasks so that you can focus more on what you love doing.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Commands;
