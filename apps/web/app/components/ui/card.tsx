import { ReactNode } from "react";

export interface CardProps {
  children: ReactNode;
  className?: string;
}

export interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export interface CardTitleProps {
  children: ReactNode;
  className?: string;
}

export interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

/**
 * Card Component
 * Reusable card container with space-themed glassmorphism and hover effects
 */
export function Card({ children, className = "" }: CardProps) {
  return (
    <div
      className={`
        border border-white/10
        bg-gradient-to-br from-white/5 to-white/[0.02]
        backdrop-blur-xl
        relative
        transition-all duration-300 ease-out
        card-hover-light
        rounded-lg
        ${className}
      `}
    >
      {children}
      {/* Corner decorations with enhanced glow */}
      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-white/40 pointer-events-none rounded-tl-sm transition-colors duration-300 group-hover:border-white/60" />
      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-white/40 pointer-events-none rounded-br-sm transition-colors duration-300 group-hover:border-white/60" />

      {/* Subtle gradient overlay for glass effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}

/**
 * CardHeader Component
 * Top section with title bar
 */
export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div
      className={`
        border-b border-white/10
        bg-gradient-to-r from-white/10 to-white/5
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * CardTitle Component
 * Title bar with TUI styling and glow effect
 */
export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <div
      className={`
        flex items-center justify-between
        text-[10px] uppercase tracking-widest
        space-glow
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * CardContent Component
 * Main content area with enhanced spacing
 */
export function CardContent({ children, className = "" }: CardContentProps) {
  return (
    <div
      className={`
        p-6
        space-y-4
        ${className}
      `}
    >
      {children}
    </div>
  );
}

/**
 * CardFooter Component
 * Footer section with glass effect
 */
export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div
      className={`
        border-t border-white/10
        px-6 py-4
        bg-gradient-to-r from-white/[0.02] to-transparent
        ${className}
      `}
    >
      {children}
    </div>
  );
}
