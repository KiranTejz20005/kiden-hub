import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface PageLayoutProps {
    children: ReactNode;
    className?: string;
}

export function PageLayout({ children, className }: PageLayoutProps) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            transition={{
                duration: 0.4,
                ease: [0.22, 1, 0.36, 1], // Custom cubic-bezier for "smooth" feel
                staggerChildren: 0.1
            }}
            className={cn("flex flex-col h-full bg-background p-6 lg:p-8 overflow-hidden", className)}
        >
            <div className="flex flex-col h-full max-w-7xl mx-auto w-full space-y-6">
                {children}
            </div>
        </motion.div>
    );
}
