import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface TextShimmerProps {
  children: React.ReactNode;
  className?: string;
  duration?: number;
  repeatDelay?: number;
}

export function TextShimmer({
  children,
  className,
  duration = 1.5,
  repeatDelay = 0.5,
}: TextShimmerProps) {
  const [isAnimating, setIsAnimating] = useState(true);
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const startAnimation = () => {
      setIsAnimating(true);
      timeoutRef.current = setTimeout(() => {
        setIsAnimating(false);
        timeoutRef.current = setTimeout(startAnimation, repeatDelay * 1000);
      }, duration * 1000);
    };

    startAnimation();

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [duration, repeatDelay]);

  return (
    <span
      className={cn(
        "inline-block relative overflow-hidden bg-clip-text text-transparent",
        "bg-gradient-to-r from-transparent via-white/60 to-transparent",
        "[background-size:200%_100%]",
        isAnimating ? "animate-shimmer" : "",
        className
      )}
      style={{
        animationDuration: `${duration}s`,
      } as React.CSSProperties}
    >
      {children}
    </span>
  );
}