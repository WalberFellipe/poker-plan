import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";

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
    "font-display uppercase tracking-[.08em]",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-0",
    "disabled:pointer-events-none disabled:opacity-45",
  ].join(" "),
  {
    variants: {
      variant: {
        primary:
          "rounded-sm bg-cy-fill text-cy-ink font-bold shadow-[0_0_16px_rgb(var(--pa-cy)/.18)] hover:shadow-[0_0_22px_rgb(var(--pa-cy)/.3)]",
        secondary:
          "rounded-sm border border-pa-text/20 bg-transparent text-pa-text hover:border-mg/60 hover:text-mg-soft",
        outline:
          "rounded-sm border border-cy/40 bg-cy/5 text-cy hover:bg-cy/10 hover:border-cy/70",
        call: "rounded-sm border border-mg/50 bg-mg/10 text-mg-soft hover:bg-mg/20",
        ghost:
          "rounded-sm bg-transparent text-pa-dim hover:text-pa-text hover:bg-pa-text/5",
        destructive:
          "rounded-sm border border-mg/50 bg-mg/12 text-mg-soft hover:bg-mg/25",
        link: "text-cy hover:text-cy-soft normal-case tracking-normal font-sans",
      },
      size: {
        default: "h-10 px-[18px] text-[12px]",
        sm: "h-9 px-4 text-[11px]",
        lg: "h-12 px-7 text-[14px]",
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
  /**
   * Mostra um spinner e desabilita o botão.
   *
   * Desabilitar é a metade que importa: sem isso, uma ação lenta convida ao
   * segundo clique — e foi assim que "importar selecionadas" chegou a
   * duplicar a fila.
   */
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, asChild = false, loading = false, children, disabled, ...props },
    ref
  ) => {
    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          {...props}
        >
          {children}
        </Slot>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        ) : null}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
