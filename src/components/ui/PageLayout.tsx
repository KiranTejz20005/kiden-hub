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
            initial={{ opacity: 0, scale: 0.99, filter: 'blur(5px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.99, filter: 'blur(5px)' }}
            transition={{
                duration: 0.3,
                ease: "easeOut"
            }}
            className={cn(
                "flex flex-col w-full bg-background transition-all duration-300",
                // Mobile: p-3 or p-4 to save space. Desktop: p-8 for breathability.
                "p-3 sm:p-4 md:p-6 lg:p-8",
                // If scrollable, fix height and scroll. If not, let it flow.
                scrollable ? "h-full overflow-y-auto" : "min-h-full",
                className
            )}
        >
            <div className={cn(
                "flex flex-col w-full mx-auto space-y-4 sm:space-y-6",
                // Max width control to prevent stretching on Ultrawide monitors
                "max-w-7xl",
                scrollable ? "min-h-min" : "h-full"
            )}>
                {children}
            </div>
        </motion.div>
    );
}
