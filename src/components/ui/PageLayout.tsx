import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PageLayoutProps {
    children: ReactNode;
    className?: string;
    /** If true, the layout will handle internal scrolling. If false, it assumes the parent scrolls. */
    scrollable?: boolean;
}

export function PageLayout({ children, className, scrollable = true }: PageLayoutProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{
                duration: 0.2,
                ease: "easeOut"
            }}
            className={cn(
                "flex flex-col w-full bg-[var(--bg-1)] transition-all",
                scrollable ? "h-full overflow-y-auto" : "min-h-full",
                className
            )}
        >
            <div className={cn(
                "flex flex-col w-full mx-auto",
                "max-w-7xl",
                scrollable ? "min-h-min" : "h-full"
            )}>
                {children}
            </div>
        </motion.div>
    );
}
