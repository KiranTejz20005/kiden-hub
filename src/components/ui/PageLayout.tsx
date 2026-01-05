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
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className={cn("flex flex-col h-full bg-background p-6 lg:p-8 overflow-hidden", className)}
        >
            <div className="flex flex-col h-full max-w-7xl mx-auto w-full space-y-6">
                {children}
            </div>
        </motion.div>
    );
}
