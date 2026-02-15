import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, style, ...props }, ref) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variants = {
      primary: "btn-primary text-white focus:ring-orange-500 shadow-sm hover:shadow",
      secondary:
        "bg-[var(--bg-tertiary)] hover:opacity-80 focus:ring-gray-500 border border-[var(--border-color)]",
      danger: "btn-danger text-white focus:ring-red-500 shadow-sm",
      ghost: "bg-transparent hover:bg-[var(--bg-tertiary)] focus:ring-gray-500",
    };

    const sizes = {
      sm: "px-3 py-1.5 text-sm",
      md: "px-4 py-2 text-sm",
      lg: "px-6 py-3 text-base",
    };

    // Add text color for variants that need theme-aware colors
    const needsThemeColor = variant === "secondary" || variant === "ghost";

    return (
      <button
        ref={ref}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        style={{ 
          borderRadius: 'var(--radius-sm)',
          ...(needsThemeColor ? { color: 'var(--text-primary)' } : {}),
          ...style 
        }}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
