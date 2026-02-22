import { ReactNode, ButtonHTMLAttributes } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: "default" | "outline" | "ghost" | "connected" | "disconnected";
  size?: "sm" | "default" | "lg";
  loading?: boolean;
}

/**
 * Button Component
 * Reusable button with multiple variants matching TUI theme
 */
export function Button({
  children,
  variant = "default",
  size = "default",
  loading = false,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseStyles =
    "font-mono text-xs uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

  const variants = {
    default: "bg-white text-black hover:bg-white/80",
    outline: "border border-white/20 text-white hover:bg-white/10 hover:text-white",
    ghost: "text-white/60 hover:text-white hover:bg-white/5",
    connected:
      "border border-green-500/30 text-green-400 hover:bg-green-500/10 hover:border-green-500/50",
    disconnected:
      "border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10 hover:border-yellow-500/50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-[10px]",
    default: "px-6 py-3",
    lg: "px-8 py-4 text-sm",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="animate-pulse">[ PROCESSING... ]</span>
      ) : (
        children
      )}
    </button>
  );
}
