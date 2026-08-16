import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Botões da direção neon.
 *
 * - `primary`: fill ciano em gradiente com texto escuro; o hover aumenta o glow
 *   (não muda a cor nem escala).
 * - `secondary`: transparente com borda neutra; o hover vira magenta.
 * - `ghost` / `link`: texto apagado que clareia.
 * - `call`: a ação magenta de "pagar pra ver", usada com parcimônia.
 */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center whitespace-nowrap gap-2",
    "font-display uppercase tracking-[.14em]",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-0",
    "disabled:pointer-events-none disabled:opacity-45",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "rounded-sm bg-cy-fill text-cy-ink font-bold shadow-[0_0_26px_rgb(var(--pa-cy)/.35)] hover:shadow-[0_0_48px_rgb(var(--pa-cy)/.6)]",
        secondary:
          "rounded-sm border border-pa-text/20 bg-transparent text-pa-text hover:border-mg/60 hover:text-mg-soft",
        outline:
          "rounded-sm border border-cy/40 bg-cy/5 text-cy hover:bg-cy/10 hover:border-cy/70",
        call: "rounded-sm border border-mg/50 bg-mg/10 text-mg-soft hover:bg-mg/20 hover:shadow-[0_0_30px_rgb(var(--pa-mg)/.35)]",
        ghost:
          "rounded-sm bg-transparent text-pa-dim hover:text-pa-text hover:bg-pa-text/5",
        destructive:
          "rounded-sm border border-mg/50 bg-mg/12 text-mg-soft hover:bg-mg/25",
        link: "text-cy hover:text-cy-soft normal-case tracking-normal font-sans",
      },
      size: {
        default: "h-10 px-5 text-[11px]",
        sm: "h-8 px-3.5 text-[10px]",
        lg: "h-12 px-7 text-xs",
        icon: "h-10 w-10 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
