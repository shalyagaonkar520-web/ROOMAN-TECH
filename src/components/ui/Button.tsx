import React from 'react';
import { cn } from '../../lib/utils';
import { playClickSound } from '../../utils/audio';
import { motion, HTMLMotionProps } from 'motion/react';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center rounded-xl font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98]';
    
    const variants = {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20',
      secondary: 'bg-slate-900 text-white hover:bg-slate-800 dark:bg-white dark:text-black dark:hover:bg-slate-200 shadow-md',
      outline: 'border border-slate-200 bg-transparent hover:bg-slate-50 text-slate-700 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 dark:text-slate-300 dark:hover:bg-slate-800',
      danger: 'bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20',
    };

    const sizes = {
      sm: 'h-9 px-4 text-xs',
      md: 'h-11 px-6 text-sm',
      lg: 'h-14 px-8 text-base',
    };

    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.98 }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        disabled={isLoading || props.disabled}
        onClick={(e) => {
          playClickSound();
          if (props.onClick) {
            props.onClick(e as any);
          }
        }}
        {...(props as any)}
      >
        {isLoading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children as any}
      </motion.button>
    );
  }
);
Button.displayName = 'Button';
