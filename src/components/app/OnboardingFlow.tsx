import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Brain,
  FileText,
  Timer,
  MessageSquare,
  Lightbulb,
  Mic,
  LayoutTemplate,
  ChevronRight,
  ChevronLeft,
  Rocket,
  Zap,
  Target,
  ArrowRight
} from 'lucide-react';
import kidenLogo from '@/assets/kiden-logo.png';
import { cn } from '@/lib/utils';

interface OnboardingFlowProps {
  onComplete: () => void;
  userName?: string;
}

const features = [
  {
    id: 'command',
    icon: Target,
    title: 'Command Center',
    description: 'Your mission control. Access all features, track your focus time, and manage collections from one unified dashboard.',
    color: 'from-emerald-500 to-teal-500',
    preview: (
      <div className="grid grid-cols-3 gap-2 p-4">
        <div className="aspect-square rounded-xl bg-primary/20 flex items-center justify-center">
          <Zap className="w-6 h-6 text-primary" />
        </div>
        <div className="aspect-square rounded-xl bg-violet/20 flex items-center justify-center">
          <MessageSquare className="w-6 h-6 text-violet" />
        </div>
        <div className="aspect-square rounded-xl bg-amber/20 flex items-center justify-center">
          <Timer className="w-6 h-6 text-amber" />
        </div>
      </div>
    )
  },
  {
    id: 'notebook',
    icon: FileText,
    title: 'Smart Notebook',
    description: 'Write like in Notion with blocks, slash commands, and drag-and-drop. AI-powered features help you summarize, expand, and transform your notes.',
    color: 'from-blue-500 to-cyan-500',
    preview: (
      <div className="p-4 space-y-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-xs">#</div>
          <div className="h-4 bg-foreground/20 rounded w-32" />
        </div>
        <div className="h-3 bg-foreground/10 rounded w-full" />
        <div className="h-3 bg-foreground/10 rounded w-3/4" />
        <div className="flex items-center gap-2 pt-2">
          <div className="w-4 h-4 rounded border-2 border-primary" />
          <div className="h-3 bg-foreground/10 rounded w-24" />
        </div>
      </div>
    )
  },
  {
    id: 'ai',
    icon: Sparkles,
    title: 'AI Assistant',
    description: 'Chat with Kiden AI to brainstorm ideas, get writing help, or answer questions. Your intelligent companion for knowledge work.',
    color: 'from-violet-500 to-purple-500',
    preview: (
      <div className="p-4 space-y-3">
        <div className="flex justify-end">
          <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-3 py-2 text-xs max-w-[80%]">
            Help me brainstorm ideas
          </div>
        </div>
        <div className="flex justify-start">
          <div className="bg-secondary rounded-2xl rounded-tl-sm px-3 py-2 text-xs max-w-[80%]">
            <span className="animate-pulse">●●●</span>
          </div>
        </div>
      </div>
    )
  },
  {
    id: 'focus',
    icon: Timer,
    title: 'Focus Timer',
    description: 'Enter deep work with Pomodoro-style focus sessions. Track your productivity and build consistent work habits.',
    color: 'from-rose-500 to-pink-500',
    preview: (
      <div className="p-4 flex flex-col items-center">
        <div className="relative w-24 h-24">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="4" fill="none" className="text-secondary" />
            <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="4" fill="none" className="text-primary" strokeDasharray="251" strokeDashoffset="60" strokeLinecap="round" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center text-lg font-bold">25:00</div>
        </div>
      </div>
    )
  },
  {
    id: 'ideas',
    icon: Lightbulb,
    title: 'Idea Capture',
    description: 'Never lose a thought again. Quickly capture ideas, categorize them, and process them later when you have time.',
    color: 'from-amber-500 to-orange-500',
    preview: (
      <div className="p-4 space-y-2">
        {['neural', 'creative', 'logic'].map((cat, i) => (
          <motion.div
            key={cat}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center gap-2 p-2 rounded-lg bg-secondary/50"
          >
            <div className="w-2 h-2 rounded-full bg-amber" />
            <div className="h-2 bg-foreground/20 rounded w-full" />
          </motion.div>
        ))}
      </div>
    )
  }
];

const OnboardingFlow = ({ onComplete, userName }: OnboardingFlowProps) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const totalSteps = features.length + 2; // Welcome + features + final

  const nextStep = () => {
    if (step < totalSteps - 1) {
      setDirection(1);
      setStep(s => s + 1);
    }
  };

  const prevStep = () => {
    if (step > 0) {
      setDirection(-1);
      setStep(s => s - 1);
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.9
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.9
    })
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background flex items-center justify-center overflow-hidden"
    >
      {/* Background effects */}
      <div className="absolute inset-0 mesh-gradient opacity-50" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet/10 rounded-full blur-3xl animate-float-slow" />

      {/* Progress bar */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 w-48 h-1 bg-secondary rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary to-accent"
          initial={{ width: 0 }}
          animate={{ width: `${((step + 1) / totalSteps) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Step indicators */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              "w-2 h-2 rounded-full transition-colors duration-300",
              i === step ? "bg-primary" : i < step ? "bg-primary/50" : "bg-secondary"
            )}
            animate={{ scale: i === step ? 1.2 : 1 }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative w-full max-w-lg mx-auto px-6">
        <AnimatePresence mode="wait" custom={direction}>
          {step === 0 && (
            <motion.div
              key="welcome"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", duration: 0.8, bounce: 0.4 }}
                className="w-24 h-24 mx-auto mb-8 relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary to-accent rounded-3xl animate-morph" />
                <img src={kidenLogo} alt="Kiden" className="relative w-full h-full p-2 rounded-3xl" />
                <motion.div
                  className="absolute -inset-2 border-2 border-primary/30 rounded-3xl"
                  animate={{ scale: [1, 1.1, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="font-serif text-4xl md:text-5xl italic mb-4 text-gradient-primary"
              >
                Welcome to Kiden
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-muted-foreground mb-2"
              >
                {userName ? `Hello, ${userName}!` : 'Hello there!'}
              </motion.p>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-muted-foreground max-w-md mx-auto"
              >
                Your unified intelligence platform for notes, ideas, and deep focus. Let's take a quick tour of what you can do.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="mt-8"
              >
                <Button
                  onClick={nextStep}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl px-8 gap-2 group"
                >
                  Let's Go
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </motion.div>
            </motion.div>
          )}

          {step > 0 && step <= features.length && (
            <motion.div
              key={`feature-${step}`}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center"
            >
              {(() => {
                const feature = features[step - 1];
                const Icon = feature.icon;
                return (
                  <>
                    {/* Feature preview card */}
                    <motion.div
                      initial={{ opacity: 0, y: 30, rotateX: 20 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      transition={{ delay: 0.1, duration: 0.5 }}
                      className="relative mb-8 mx-auto max-w-xs"
                    >
                      <div className="relative bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
                        {/* Preview header */}
                        <div className="flex items-center gap-2 p-3 border-b border-border bg-secondary/30">
                          <div className="flex gap-1.5">
                            <div className="w-3 h-3 rounded-full bg-rose/60" />
                            <div className="w-3 h-3 rounded-full bg-amber/60" />
                            <div className="w-3 h-3 rounded-full bg-primary/60" />
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">{feature.title}</span>
                        </div>
                        {/* Preview content */}
                        <div className="min-h-[140px]">
                          {feature.preview}
                        </div>
                      </div>

                      {/* Glow effect */}
                      <div className={cn(
                        "absolute -inset-4 rounded-3xl opacity-20 blur-2xl -z-10 bg-gradient-to-r",
                        feature.color
                      )} />
                    </motion.div>

                    {/* Feature icon */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                      className={cn(
                        "w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center bg-gradient-to-br",
                        feature.color
                      )}
                    >
                      <Icon className="w-8 h-8 text-white" />
                    </motion.div>

                    <motion.h2
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      className="text-2xl font-bold mb-3"
                    >
                      {feature.title}
                    </motion.h2>

                    <motion.p
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                      className="text-muted-foreground max-w-md mx-auto"
                    >
                      {feature.description}
                    </motion.p>
                  </>
                );
              })()}
            </motion.div>
          )}

          {step === totalSteps - 1 && (
            <motion.div
              key="final"
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.8, bounce: 0.5 }}
                className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center"
              >
                <Rocket className="w-12 h-12 text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="font-serif text-3xl md:text-4xl italic mb-4"
              >
                You're All Set!
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-muted-foreground max-w-md mx-auto mb-8"
              >
                Your Kiden workspace is ready. Start capturing ideas, writing notes, and achieving deep focus. Welcome to your unified intelligence.
              </motion.p>

              {/* Feature summary */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="flex flex-wrap justify-center gap-3 mb-8"
              >
                {features.map((f, i) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-2 px-3 py-2 rounded-full bg-secondary/50 text-sm"
                  >
                    <f.icon className="w-4 h-4 text-primary" />
                    <span>{f.title}</span>
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <Button
                  onClick={onComplete}
                  size="lg"
                  className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl px-8 gap-2 group glow-intense"
                >
                  <Sparkles className="w-5 h-5" />
                  Start Creating
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation buttons */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={prevStep}
          disabled={step === 0}
          className="w-12 h-12 rounded-full"
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>

        {step < totalSteps - 1 && (
          <Button
            variant="ghost"
            size="icon"
            onClick={nextStep}
            className="w-12 h-12 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Skip button */}
      {step < totalSteps - 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 right-8"
        >
          <Button
            variant="ghost"
            onClick={onComplete}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip tour
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OnboardingFlow;
