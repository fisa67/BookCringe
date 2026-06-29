import { type ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "outline";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--bc-red)] text-white hover:bg-[var(--bc-red-dark)] active:scale-[0.98]",
  secondary:
    "bg-[var(--bc-ink)] text-white hover:bg-[var(--bc-ink)]/80 active:scale-[0.98]",
  ghost:
    "bg-transparent text-[var(--bc-ink)] hover:bg-[var(--bc-surface)] active:scale-[0.98]",
  outline:
    "bg-transparent border border-[var(--bc-border)] text-[var(--bc-ink)] hover:border-[var(--bc-ink)] hover:bg-[var(--bc-surface)] active:scale-[0.98]",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 cursor-pointer select-none disabled:opacity-50 disabled:pointer-events-none",
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
