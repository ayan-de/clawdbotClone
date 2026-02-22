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
 * Reusable card container with TUI-style decoration
 */
export function Card({ children, className = "" }: CardProps) {
  return (
    <div className={`border-2 border-white/10 bg-black/90 relative shadow-[0_0_50px_rgba(255,255,255,0.1)] backdrop-blur-xl ${className}`}>
      {children}
      {/* Corner decorations */}
      <div className="absolute -top-1 -left-1 w-8 h-8 border-t-2 border-l-2 border-white/40 pointer-events-none" />
      <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-2 border-r-2 border-white/40 pointer-events-none" />
    </div>
  );
}

/**
 * CardHeader Component
 * Top section with title bar
 */
export function CardHeader({ children, className = "" }: CardHeaderProps) {
  return (
    <div className={`border-b border-white/10 ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardTitle Component
 * Title bar with TUI styling
 */
export function CardTitle({ children, className = "" }: CardTitleProps) {
  return (
    <div className={`bg-white/10 px-4 py-2 flex items-center justify-between text-[10px] uppercase tracking-widest ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardContent Component
 * Main content area
 */
export function CardContent({ children, className = "" }: CardContentProps) {
  return (
    <div className={`p-6 ${className}`}>
      {children}
    </div>
  );
}

/**
 * CardFooter Component
 * Footer section
 */
export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div className={`border-t border-white/10 px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}
