import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Peças pequenas e repetidas da direção neon.
 *
 * Elas existem para que a regra dos acentos fique num lugar só: ciano é
 * interativo e consenso, magenta é raro. Componentes de tela compõem estas
 * peças em vez de reescrever as mesmas classes.
 */

/** Rótulo curto em caixa alta acima de um título ou campo. */
export function Kicker({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return <span className={cn("pa-kicker", className)} {...props} />;
}

export function FieldLabel({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className={cn("pa-label block", className)} {...props} />;
}

/** Filete que separa um bloco do seguinte. */
export function Rule({ className }: { className?: string }) {
  return <div className={cn("pa-rule", className)} aria-hidden />;
}

/** Ponto pulsante — presença, rodada ao vivo, status. */
export function Dot({
  tone = "cy",
  size = 7,
  pulse = true,
  className,
}: {
  tone?: "cy" | "mg" | "idle";
  size?: number;
  pulse?: boolean;
  className?: string;
}) {
  const tones = {
    cy: "bg-cy shadow-[0_0_10px_rgb(var(--pa-cy))]",
    mg: "bg-mg shadow-[0_0_10px_rgb(var(--pa-mg))]",
    idle: "bg-pa-ghost",
  } as const;

  return (
    <span
      aria-hidden
      className={cn(
        "inline-block shrink-0 rounded-full",
        tones[tone],
        pulse && tone !== "idle" && "animate-pulse",
        className
      )}
      style={{ width: size, height: size }}
    />
  );
}

/** Superfície de card. `interactive` acende a borda ciano no hover. */
export function Panel({
  className,
  interactive = false,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }) {
  return (
    <div
      className={cn(
        "pa-surface",
        interactive && "pa-surface-interactive",
        className
      )}
      {...props}
    />
  );
}

const badgeTones = {
  cy: "border-cy/45 bg-cy/12 text-cy",
  mg: "border-mg/45 bg-mg/12 text-mg-soft",
  neutral: "border-pa-text/16 bg-pa-text/5 text-pa-dim",
} as const;

export function Badge({
  tone = "neutral",
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & {
  tone?: keyof typeof badgeTones;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-2 py-1",
        "font-display text-[10px] font-medium uppercase tracking-[.12em]",
        badgeTones[tone],
        className
      )}
      {...props}
    />
  );
}

/** Número grande de estatística, com rótulo embaixo. */
export function Stat({
  value,
  label,
  tone = "text",
  size = 38,
  className,
}: {
  value: React.ReactNode;
  label: React.ReactNode;
  tone?: "cy" | "mg" | "text";
  size?: number;
  className?: string;
}) {
  const tones = {
    cy: "text-cy",
    mg: "text-mg",
    text: "text-pa-text",
  } as const;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span
        className={cn("pa-numeric font-black leading-none", tones[tone])}
        style={{ fontSize: size }}
      >
        {value}
      </span>
      <span className="pa-kicker">{label}</span>
    </div>
  );
}

/** Título de seção com kicker opcional. */
export function SectionHeading({
  kicker,
  title,
  description,
  className,
}: {
  kicker?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      {kicker ? <Kicker>{kicker}</Kicker> : null}
      <h2 className="font-display text-[26px] leading-tight text-pa-text">
        {title}
      </h2>
      {description ? (
        <p className="max-w-[62ch] text-[17px] leading-relaxed text-pa-muted">
          {description}
        </p>
      ) : null}
    </div>
  );
}

/** Barra de progresso fina — consenso, distribuição de votos. */
export function Meter({
  value,
  tone = "cy",
  className,
}: {
  /** 0–100 */
  value: number;
  tone?: "cy" | "mg";
  className?: string;
}) {
  const clamped = Math.max(0, Math.min(100, value));

  return (
    <div
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-pa-text/8", className)}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn(
          "h-full rounded-full transition-[width] duration-500",
          tone === "cy"
            ? "bg-cy shadow-[0_0_12px_rgb(var(--pa-cy)/.6)]"
            : "bg-mg shadow-[0_0_12px_rgb(var(--pa-mg)/.6)]"
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
